import type { PackageProjectContext, PackageWorkflowResponse } from '~/utils/aiweb/workflows/packageProject/types';

export const runReactExportWorkflow = async (
  _context: PackageProjectContext,
): Promise<PackageWorkflowResponse> => {
  return {
    ok: false,
    code: 'PACKAGE_TARGET_UNSUPPORTED',
    error: 'React export workflow is not implemented yet.',
  };
};

export const downloadReactExportPackage = (_zipBlob: Blob, _projectName: string) => {
  return {
    ok: false as const,
    code: 'PACKAGE_TARGET_UNSUPPORTED' as const,
    error: 'React export workflow is not implemented yet.',
  };
};
