import type { RequirementQuestion } from '~/utils/aiweb/roles/types';
import type { RequirementFlowContext, RequirementFlowStage } from './requirementFlowOrchestrator';

export const ROLE_IDS = {
  requirementInterviewer: 'requirement-interviewer',
  designPlanner: 'design-planner',
  pagePlanner: 'page-planner',
  siteGenerator: 'site-generator',
  elementEditor: 'element-editor',
} as const;

export interface StructuredQuestionPayload {
  questionId: string;
  type: 'input' | 'option';
  value: string;
  optionId?: string;
}

export type StructuredAnswerAction =
  | { type: 'noop' }
  | { type: 'plan_confirm_to_page_plan'; finalRequirement: string }
  | { type: 'plan_redesign'; requirement: string }
  | { type: 'stop'; message?: string }
  | { type: 'page_plan_confirm_to_generate'; finalRequirement: string }
  | { type: 'page_plan_redesign'; requirement: string }
  | { type: 'clarification_next_question' }
  | { type: 'clarification_done_to_plan'; finalRequirement: string };

export interface StructuredAnswerReducerResult {
  nextStage: RequirementFlowStage;
  nextContext: RequirementFlowContext;
  action: StructuredAnswerAction;
}

export const createEmptyRequirementFlowContext = (): RequirementFlowContext => ({
  originalRequirement: '',
  clarifiedRequirement: '',
  draftPlan: '',
  pagePlan: null,
  pendingQuestions: [] as RequirementQuestion[],
  answeredQuestions: [] as Array<{ questionId: string; value: string; optionId?: string }>,
  generationProgress: null,
});

export const buildPlanConfirmationQuestion = () => ({
  id: 'plan_confirm',
  title: 'Design Plan Confirmation',
  question: 'Please choose your next action for this design plan.',
  type: 'option' as const,
  options: [
    { id: 'confirm', label: 'Confirm design plan and continue to page planning' },
    { id: 'redesign', label: 'Redesign plan' },
    { id: 'stop', label: 'Stop generation' },
  ],
});

export const buildPagePlanConfirmationQuestion = () => ({
  id: 'page_plan_confirm',
  title: 'Page Plan Confirmation',
  question: 'Please choose your next action for this page planning result.',
  type: 'option' as const,
  options: [
    { id: 'confirm', label: 'Confirm page plan and start generating pages' },
    { id: 'redesign', label: 'Regenerate page planning' },
    { id: 'stop', label: 'Stop generation' },
  ],
});

export const appendClarificationAnswer = (
  context: RequirementFlowContext,
  payload: StructuredQuestionPayload,
) => {
  const nextContext: RequirementFlowContext = {
    ...context,
    answeredQuestions: [
      ...context.answeredQuestions,
      {
        questionId: payload.questionId,
        value: payload.value,
        optionId: payload.optionId,
      },
    ],
    pendingQuestions: context.pendingQuestions.filter((q) => q.id !== payload.questionId),
  };

  return nextContext;
};

export const buildFinalClarifiedRequirement = (context: RequirementFlowContext) => {
  const answersText = context.answeredQuestions
    .map((item) => `- ${item.questionId}: ${item.value}`)
    .join('\n');

  return `${context.originalRequirement}\n\nConfirmed details:\n${answersText}`;
};

export const reduceStructuredAnswer = (
  stage: RequirementFlowStage,
  context: RequirementFlowContext,
  payload: StructuredQuestionPayload,
): StructuredAnswerReducerResult => {
  const baseRequirement = context.clarifiedRequirement || context.originalRequirement;

  if (stage === 'awaitingPlanConfirm') {
    if (payload.optionId === 'confirm') {
      return {
        nextStage: 'idle',
        nextContext: context,
        action: { type: 'plan_confirm_to_page_plan', finalRequirement: baseRequirement },
      };
    }

    if (payload.optionId === 'redesign') {
      return {
        nextStage: stage,
        nextContext: context,
        action: { type: 'plan_redesign', requirement: baseRequirement },
      };
    }

    if (payload.optionId === 'stop') {
      return {
        nextStage: 'idle',
        nextContext: createEmptyRequirementFlowContext(),
        action: { type: 'stop', message: 'Generation has been stopped. You can provide a new requirement anytime.' },
      };
    }

    return { nextStage: stage, nextContext: context, action: { type: 'noop' } };
  }

  if (stage === 'awaitingPagePlanConfirm') {
    if (payload.optionId === 'confirm') {
      return {
        nextStage: 'idle',
        nextContext: context,
        action: { type: 'page_plan_confirm_to_generate', finalRequirement: baseRequirement },
      };
    }

    if (payload.optionId === 'redesign') {
      return {
        nextStage: stage,
        nextContext: context,
        action: { type: 'page_plan_redesign', requirement: baseRequirement },
      };
    }

    if (payload.optionId === 'stop') {
      return {
        nextStage: 'idle',
        nextContext: createEmptyRequirementFlowContext(),
        action: { type: 'stop' },
      };
    }

    return { nextStage: stage, nextContext: context, action: { type: 'noop' } };
  }

  if (stage !== 'awaitingClarification') {
    return { nextStage: stage, nextContext: context, action: { type: 'noop' } };
  }

  const nextContext = appendClarificationAnswer(context, payload);

  if (nextContext.pendingQuestions.length > 0) {
    return {
      nextStage: stage,
      nextContext,
      action: { type: 'clarification_next_question' },
    };
  }

  const finalRequirement = buildFinalClarifiedRequirement(nextContext);
  return {
    nextStage: 'idle',
    nextContext: {
      ...nextContext,
      clarifiedRequirement: finalRequirement,
    },
    action: { type: 'clarification_done_to_plan', finalRequirement },
  };
};
