import type { RequirementFlowContext } from './requirementFlowOrchestrator';

export const GENERATION_CONTINUE_QUESTION_ID = 'generation_continue';

export type GenerationContinueOption = 'continue' | 'pause' | 'stop';

export interface GenerationContinuePayload {
  questionId: string;
  optionId?: string;
}

export interface GenerationContinueReducerResult {
  matched: boolean;
  action: 'continue' | 'pause' | 'stop' | 'noop';
  nextContext: RequirementFlowContext;
}

export const hasPendingGenerationProgress = (context: RequirementFlowContext) => {
  const progress = context.generationProgress;
  return Boolean(progress && progress.nextIndex < progress.plannedPages.length);
};

export const buildGenerationContinueQuestion = () => ({
  id: GENERATION_CONTINUE_QUESTION_ID,
  title: 'Continue Page Generation',
  question: 'Do you want to continue generating the next planned page?',
  type: 'option' as const,
  options: [
    { id: 'continue', label: 'Continue generating next page' },
    { id: 'pause', label: 'Pause here for now' },
    { id: 'stop', label: 'Stop remaining page generation' },
  ],
});

export const reduceGenerationContinueAnswer = (
  context: RequirementFlowContext,
  payload: GenerationContinuePayload,
): GenerationContinueReducerResult => {
  if (payload.questionId !== GENERATION_CONTINUE_QUESTION_ID) {
    return {
      matched: false,
      action: 'noop',
      nextContext: context,
    };
  }

  const option = String(payload.optionId || '') as GenerationContinueOption;

  if (option === 'continue') {
    return {
      matched: true,
      action: 'continue',
      nextContext: context,
    };
  }

  if (option === 'pause') {
    return {
      matched: true,
      action: 'pause',
      nextContext: context,
    };
  }

  if (option === 'stop') {
    return {
      matched: true,
      action: 'stop',
      nextContext: {
        ...context,
        generationProgress: null,
      },
    };
  }

  return {
    matched: true,
    action: 'noop',
    nextContext: context,
  };
};
