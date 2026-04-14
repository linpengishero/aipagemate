import { exportPageCode } from '~/utils/aiweb/skills/pageExportSkill';
import type {
  PageExportPipelineParams,
  PageExportPipelineResult,
} from './types';

/**
 * 单页导出工作流：
 * 页面层统一调用该入口，内部编排并调用导出技能。
 */
export const runPageExportPipeline = async (
  params: PageExportPipelineParams,
): Promise<PageExportPipelineResult> => {
  if (!params?.sourceCode) {
    return {
      ok: false,
      code: 'PAGE_EXPORT_VALIDATION_FAILED',
      error: 'Page source code is empty.',
    };
  }

  try {
    const result = await exportPageCode(params);
    if (!result.ok) {
      return {
        ok: false,
        code: 'PAGE_EXPORT_EXECUTION_FAILED',
        error: result.error || 'Page export failed.',
      };
    }

    return {
      ok: true,
      data: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      code: 'PAGE_EXPORT_EXECUTION_FAILED',
      error: error?.message || 'Page export failed.',
    };
  }
};
