import { downloadPreviewAsPdf } from '~/utils/aiweb/skills/pdfExportSkill';
import type {
  PdfExportPipelineParams,
  PdfExportPipelineResult,
} from './types';

/**
 * PDF 导出工作流：
 * 页面层统一调用该入口，内部编排并调用 PDF 导出技能。
 */
export const runPdfExportPipeline = async (
  params: PdfExportPipelineParams,
): Promise<PdfExportPipelineResult> => {
  if (!params?.iframeDocument) {
    return {
      ok: false,
      code: 'PDF_EXPORT_VALIDATION_FAILED',
      error: 'Missing iframeDocument for PDF export.',
    };
  }

  try {
    await downloadPreviewAsPdf(params);
    return {
      ok: true,
      data: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      code: 'PDF_EXPORT_EXECUTION_FAILED',
      error: error?.message || 'PDF export failed.',
    };
  }
};
