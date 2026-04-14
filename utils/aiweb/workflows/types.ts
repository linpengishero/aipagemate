export type WorkflowErrorCode =
  | 'WORKFLOW_VALIDATION_FAILED'
  | 'WORKFLOW_UNSUPPORTED_TARGET'
  | 'WORKFLOW_EXECUTION_FAILED'
  | 'WORKFLOW_DOWNLOAD_FAILED';

export interface WorkflowSuccess<TData = null> {
  ok: true;
  data: TData;
}

export interface WorkflowFailure<TCode extends string = WorkflowErrorCode> {
  ok: false;
  code: TCode;
  error: string;
}

export type WorkflowResult<TData = null, TCode extends string = WorkflowErrorCode> =
  | WorkflowSuccess<TData>
  | WorkflowFailure<TCode>;
