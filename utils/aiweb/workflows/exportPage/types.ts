import type { ExportNotifyType } from '~/utils/aiweb/skills/pageExportSkill';
import type { ExportSettings, AIProcessResult } from '~/utils/aiweb/dto/exportDto';
import type { WorkflowResult } from '~/utils/aiweb/workflows/types';

export interface PageExportPipelineParams {
  settings: ExportSettings;
  sourceCode: string;
  aiProcessor: (prompt: string) => Promise<AIProcessResult>;
  notify?: (message: string, type?: ExportNotifyType) => void;
}

export type PageExportErrorCode =
  | 'PAGE_EXPORT_VALIDATION_FAILED'
  | 'PAGE_EXPORT_EXECUTION_FAILED';

export type PageExportPipelineResult = WorkflowResult<null, PageExportErrorCode>;
