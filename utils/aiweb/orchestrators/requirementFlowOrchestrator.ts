import type { RequirementQuestion } from '~/utils/aiweb/roles/types';
import { analyzeRequirement, getFallbackQuestions } from '~/utils/aiweb/roles/requirementInterviewer';
import { planDesign, formatPlanForUser } from '~/utils/aiweb/roles/designPlanner';
import { planPages, formatPagePlanForUser } from '~/utils/aiweb/roles/pagePlanner';
import type { SitePagePlan } from '~/utils/aiweb/roles/types';
import { normalizeQuestionsWithOther } from '~/utils/aiweb/tools';
import { ok, err, type Result } from '~/utils/aiweb/types';

/**
 * 需求流程阶段：空闲 / 澄清中 / 方案确认中。
 */
export type RequirementFlowStage = 'idle' | 'awaitingClarification' | 'awaitingPlanConfirm' | 'awaitingPagePlanConfirm';

/**
 * 需求流程上下文：贯穿需求分析、追问与方案确认的状态。
 */
export interface RequirementFlowContext {
  /** 原始用户需求（首次输入） */
  originalRequirement: string;
  /** 澄清后可用于生成的需求 */
  clarifiedRequirement: string;
  /** 当前草案方案文本 */
  draftPlan: string;
  /** 页面规划结果 */
  pagePlan: SitePagePlan | null;
  /** 待回答的问题列表 */
  pendingQuestions: RequirementQuestion[];
  /** 已回答的问题列表 */
  answeredQuestions: Array<{ questionId: string; value: string; optionId?: string }>;
  /** 多页面生成进度（支持暂停/继续） */
  generationProgress?: {
    plannedPages: SitePagePlan['pages'];
    nextIndex: number;
    generatedPageIds: string[];
    finalRequirement: string;
    approvedPlan: string;
    plannedToPersistedPageIdMap: Record<string, string>;
  } | null;
}

/**
 * 需求分析输出：告诉调用方下一阶段、最新上下文和要展示的提示语。
 */
export interface RequirementAnalysisOutput {
  /** 下一流程阶段 */
  stage: RequirementFlowStage;
  /** 更新后的流程上下文 */
  context: RequirementFlowContext;
  /** 需要展示给用户的说明消息 */
  assistantMessage: string;
}

/**
 * 需求分析统一返回结果。
 */
export type RequirementAnalysisResult = Result<RequirementAnalysisOutput>;

/**
 * 方案生成统一返回结果。
 */
export type PlanProposalResult = Result<{
  stage: RequirementFlowStage;
  draftPlan: string;
  assistantMessage: string;
}>;

export type PagePlanProposalResult = Result<{
  stage: RequirementFlowStage;
  pagePlan: SitePagePlan;
  assistantMessage: string;
}>;

/**
 * 运行需求分析，返回下一阶段与上下文。
 */
export const runRequirementAnalysis = async (
  userRequirement: string,
  currentContext: RequirementFlowContext,
  logFlow?: (stage: string, payload?: any) => void,
  roleScopedAnswers = '',
): Promise<RequirementAnalysisResult> => {
  const contextAnswers = currentContext.answeredQuestions
    .map((item) => `- ${item.questionId}: ${item.value}`)
    .join('\n');
  const inheritedAnswers = [roleScopedAnswers, contextAnswers].filter(Boolean).join('\n');

  try {
    const analysis = await Promise.race([
      analyzeRequirement(userRequirement, inheritedAnswers),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Requirement analysis timeout')), 25000);
      }),
    ]);

    let questions = analysis.questions;
    if (analysis.clarity === 'unclear' && questions.length === 0) {
      questions = getFallbackQuestions();
    }

    questions = normalizeQuestionsWithOther(questions);

    const context: RequirementFlowContext = {
      originalRequirement: currentContext.originalRequirement || userRequirement,
      clarifiedRequirement: analysis.clarifiedRequirement || userRequirement,
      draftPlan: '',
      pagePlan: null,
      pendingQuestions: questions,
      answeredQuestions: [],
    };

    if (analysis.clarity === 'unclear' && questions.length > 0) {
      return ok({
        stage: 'awaitingClarification',
        context,
        assistantMessage: `I prepared a confirmation checklist with ${questions.length} items. We will confirm them one by one.`,
      });
    }

    return ok({
      stage: 'idle',
      context,
      assistantMessage: '',
    });
  } catch (error: any) {
    logFlow?.('runRequirementAnalysis:fallback', { error: error?.message || error });
    const fallbackQuestions = normalizeQuestionsWithOther(getFallbackQuestions());

    return ok({
      stage: 'awaitingClarification',
      context: {
        originalRequirement: currentContext.originalRequirement || userRequirement,
        clarifiedRequirement: userRequirement,
        draftPlan: '',
        pagePlan: null,
        pendingQuestions: fallbackQuestions,
        answeredQuestions: [],
      },
      assistantMessage: `Automatic analysis failed. Switched to fallback checklist with ${fallbackQuestions.length} items.`,
    });
  }
};

/**
 * 方案生成编排：根据已确认需求输出可展示给用户的设计方案文本。
 */
export const runPlanProposal = async (requirement: string, isRedesign = false): Promise<PlanProposalResult> => {
  try {
    const plan = await planDesign(requirement);
    const formattedPlan = formatPlanForUser(plan);

    return ok({
      stage: 'awaitingPlanConfirm' as RequirementFlowStage,
      draftPlan: formattedPlan,
      assistantMessage: isRedesign
        ? `I redesigned the plan based on your feedback.\n\n${formattedPlan}`
        : formattedPlan,
    });
  } catch (error: any) {
    return err(error?.message || 'Plan proposal generation failed.', 'PLAN_PROPOSAL_FAILED');
  }
};

export const runPagePlanProposal = async (
  requirement: string,
  draftPlan: string,
  isRedesign = false,
): Promise<PagePlanProposalResult> => {
  try {
    const designPlan = await planDesign(`${requirement}\n\nConfirmed design plan:\n${draftPlan}`);
    const pagePlan = await planPages(requirement, designPlan);
    const formatted = formatPagePlanForUser(pagePlan);

    return ok({
      stage: 'awaitingPagePlanConfirm',
      pagePlan,
      assistantMessage: isRedesign
        ? `I redesigned the page planning based on your feedback.\n\n${formatted}`
        : formatted,
    });
  } catch (error: any) {
    return err(error?.message || 'Page plan generation failed.', 'PAGE_PLAN_PROPOSAL_FAILED');
  }
};
