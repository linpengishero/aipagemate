import type { WebProject, WebPage } from '~/utils/webDB/types';

/**
 * 云端 DTO：保持字段明确、避免携带本地运行时冗余状态。
 */
export interface CloudProjectDTO {
  id: string;
  name: string;
  description: string;
  isGenerated: boolean;
  generationRequirement: string;
  generationPlan: string;
  generationPagePlanJson: string;
  generatedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CloudPageDTO {
  id: string;
  projectId: string;
  name: string;
  title: string;
  content: string;
  isPublic: boolean;
  linkPlaceholder: string;
  generationRequirement: string;
  generationDraftPlan: string;
  generationPagePlanJson: string;
  createdAt: number;
  updatedAt: number;
}

export interface CloudProjectBundleDTO {
  project: CloudProjectDTO;
  pages: CloudPageDTO[];
}

export const toCloudProjectDTO = (project: WebProject): CloudProjectDTO => ({
  id: project.id,
  name: project.name,
  description: project.description || '',
  isGenerated: !!project.isGenerated,
  generationRequirement: project.generationRequirement || '',
  generationPlan: project.generationPlan || '',
  generationPagePlanJson: project.generationPagePlanJson || '',
  generatedAt: project.generatedAt ?? null,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

export const toCloudPageDTO = (page: WebPage): CloudPageDTO => ({
  id: page.id,
  projectId: page.projectId,
  name: page.name,
  title: page.title,
  content: page.content,
  isPublic: !!page.isPublic,
  linkPlaceholder: page.linkPlaceholder || '',
  generationRequirement: page.generationRequirement || '',
  generationDraftPlan: page.generationDraftPlan || '',
  generationPagePlanJson: page.generationPagePlanJson || '',
  createdAt: page.createdAt,
  updatedAt: page.updatedAt,
});

export const toCloudProjectBundleDTO = (
  project: WebProject,
  pages: WebPage[],
): CloudProjectBundleDTO => ({
  project: toCloudProjectDTO(project),
  pages: (pages || []).map(toCloudPageDTO),
});
