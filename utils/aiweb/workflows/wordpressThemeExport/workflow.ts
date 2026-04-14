import type { PackageProjectContext, PackageWorkflowResponse } from '~/utils/aiweb/workflows/packageProject/types';
import { runStaticHtmlExportWorkflow } from '~/utils/aiweb/workflows/staticHtmlExport';

/**
 * WordPress 主题导出工作流（预留扩展）：
 * 当前先复用静态 HTML 导出结果，后续可在此基础上做主题结构转换。
 */
export const runWordpressThemeExportWorkflow = async (
  context: PackageProjectContext,
): Promise<PackageWorkflowResponse> => {
  const staticResult = await runStaticHtmlExportWorkflow(context);
  if (!staticResult.ok) {
    return staticResult;
  }

  return {
    ok: false,
    code: 'PACKAGE_TARGET_UNSUPPORTED',
    error: 'WordPress theme export workflow is not implemented yet (static HTML pre-step is ready).',
  };
};

export const downloadWordpressThemeExportPackage = (_zipBlob: Blob, _projectName: string) => {
  return {
    ok: false as const,
    code: 'PACKAGE_TARGET_UNSUPPORTED' as const,
    error: 'WordPress theme export workflow is not implemented yet.',
  };
};
