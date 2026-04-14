import { generateVue3Project, downloadVue3Project } from '~/utils/aiweb/skills';
import type { PackageProjectContext, PackageWorkflowResponse } from '~/utils/aiweb/workflows/packageProject/types';

export const runVue3ExportWorkflow = async (
  context: PackageProjectContext,
): Promise<PackageWorkflowResponse> => {
  try {
    const zipBlob = await generateVue3Project(
      context.options.projectName,
      context.pages,
      {
        cssFramework: context.options.cssFramework === 'tailwind' ? 'tailwind' : 'none',
        seoSupport: context.options.seoSupport,
        metadata: context.options.metadata,
      },
    );

    const fileName = `${context.options.projectName}-vue3.zip`;

    return {
      ok: true,
      data: {
        zipBlob,
        fileName,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      code: 'PACKAGE_BUILD_FAILED',
      error: error?.message || 'Failed to build Vue 3 package.',
    };
  }
};

export const downloadVue3ExportPackage = (zipBlob: Blob, projectName: string) => {
  try {
    downloadVue3Project(zipBlob, projectName);
    return { ok: true as const };
  } catch (error: any) {
    return {
      ok: false as const,
      code: 'PACKAGE_DOWNLOAD_FAILED' as const,
      error: error?.message || 'Failed to download Vue 3 package.',
    };
  }
};
