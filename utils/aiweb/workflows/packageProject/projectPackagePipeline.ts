import webProjectStore from '~/utils/webDB/WebProjectStorage';
import type {
  PackageProjectContext,
  PackageProjectOptions,
  PackageWorkflowResponse,
} from './types';
import {
  packageBuildRegistry,
  packageDownloadRegistry,
  isSupportedPackageTarget,
} from './targets/registry';

const validateOptions = (options: PackageProjectOptions): PackageWorkflowResponse | null => {
  if (!options.projectId) {
    return {
      ok: false,
      code: 'PACKAGE_VALIDATE_FAILED',
      error: 'Missing projectId.',
    };
  }

  if (!options.projectName?.trim()) {
    return {
      ok: false,
      code: 'PACKAGE_VALIDATE_FAILED',
      error: 'Project name is required.',
    };
  }

  if (!isSupportedPackageTarget(options.target)) {
    return {
      ok: false,
      code: 'PACKAGE_TARGET_UNSUPPORTED',
      error: `Unsupported package target: ${options.target}`,
    };
  }

  return null;
};

const buildContext = async (options: PackageProjectOptions): Promise<PackageProjectContext | null> => {
  const pages = await webProjectStore.getProjectPages(options.projectId);
  if (!pages || pages.length === 0) {
    return null;
  }

  return {
    options,
    pages: pages.map((page) => ({
      name: page.name,
      content: page.content || '',
    })),
  };
};

export const runProjectPackagePipeline = async (
  options: PackageProjectOptions,
): Promise<PackageWorkflowResponse> => {
  const validationError = validateOptions(options);
  if (validationError) return validationError;

  const context = await buildContext(options);
  if (!context) {
    return {
      ok: false,
      code: 'PACKAGE_VALIDATE_FAILED',
      error: 'Current project has no pages to package.',
    };
  }

  const builder = packageBuildRegistry[options.target];
  const buildResult = await builder(context);
  if (!buildResult.ok) return buildResult;

  const downloader = packageDownloadRegistry[options.target];
  const downloadResult = downloader(buildResult.data.zipBlob, options.projectName);
  if (!downloadResult.ok) {
    return {
      ok: false,
      code: downloadResult.code,
      error: downloadResult.error,
    };
  }

  return buildResult;
};
