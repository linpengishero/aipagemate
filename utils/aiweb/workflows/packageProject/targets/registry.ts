import type { PackageTarget } from '../types';
import { runStaticHtmlExportWorkflow, downloadStaticHtmlExportPackage } from '~/utils/aiweb/workflows/staticHtmlExport';
import { runVue3ExportWorkflow, downloadVue3ExportPackage } from '~/utils/aiweb/workflows/vue3Export';
import { runReactExportWorkflow, downloadReactExportPackage } from '~/utils/aiweb/workflows/reactExport';
import { runWordpressThemeExportWorkflow, downloadWordpressThemeExportPackage } from '~/utils/aiweb/workflows/wordpressThemeExport';

export const packageBuildRegistry = {
  html: runStaticHtmlExportWorkflow,
  vue3: runVue3ExportWorkflow,
  react: runReactExportWorkflow,
  'wordpress-theme': runWordpressThemeExportWorkflow,
} as const;

export const packageDownloadRegistry = {
  html: downloadStaticHtmlExportPackage,
  vue3: downloadVue3ExportPackage,
  react: downloadReactExportPackage,
  'wordpress-theme': downloadWordpressThemeExportPackage,
} as const;

export const isSupportedPackageTarget = (target: string): target is PackageTarget => {
  return target in packageBuildRegistry;
};
