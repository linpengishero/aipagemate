import type { PageData } from '~/utils/aiweb/skills/vue3ProjectExportSkill';

export type PackageTarget = 'html' | 'vue3' | 'react' | 'wordpress-theme';

export interface PackageMetadata {
  description?: string;
  author?: string;
  keywords?: string;
}

export interface PackageProjectOptions {
  projectId: string;
  projectName: string;
  target: PackageTarget;
  cssFramework?: 'none' | 'tailwind';
  seoSupport?: boolean;
  metadata?: PackageMetadata;
}

export interface PackageProjectContext {
  options: PackageProjectOptions;
  pages: PageData[];
}

export interface PackageWorkflowData {
  zipBlob: Blob;
  fileName: string;
}

export interface PackageWorkflowResult {
  ok: true;
  data: PackageWorkflowData;
}

export interface PackageWorkflowError {
  ok: false;
  code:
    | 'PACKAGE_VALIDATE_FAILED'
    | 'PACKAGE_TARGET_UNSUPPORTED'
    | 'PACKAGE_BUILD_FAILED'
    | 'PACKAGE_DOWNLOAD_FAILED';
  error: string;
}

export type PackageWorkflowResponse = PackageWorkflowResult | PackageWorkflowError;
