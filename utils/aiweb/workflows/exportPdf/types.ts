import type { DownloadPreviewPdfParams } from '~/utils/aiweb/skills/pdfExportSkill';
import type { WorkflowResult } from '~/utils/aiweb/workflows/types';

export type PdfExportPipelineParams = DownloadPreviewPdfParams;

export type PdfExportErrorCode =
  | 'PDF_EXPORT_VALIDATION_FAILED'
  | 'PDF_EXPORT_EXECUTION_FAILED';

export type PdfExportPipelineResult = WorkflowResult<null, PdfExportErrorCode>;
