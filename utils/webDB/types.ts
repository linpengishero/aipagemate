/**
 * 项目类型定义
 */
export interface WebProject {
  id: string;
  name: string;
  description?: string;
  /** 项目是否已完成首次 AI 生成 */
  isGenerated: boolean;
  /** 首次 AI 生成时的核心需求描述 */
  generationRequirement?: string;
  /** 首次 AI 生成确认通过的设计方案文本 */
  generationPlan?: string;
  /** 首次 AI 生成确认通过的页面规划（JSON 字符串） */
  generationPagePlanJson?: string;
  /** 首次 AI 生成完成时间 */
  generatedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 页面类型定义
 */
export interface WebPage {
  id: string;
  projectId: string;
  name: string;
  title: string;
  content: string;
  isPublic: boolean;
  /** 页面内链占位符（用于预览时再替换真实URL） */
  linkPlaceholder?: string;
  createdAt: number;
  updatedAt: number;
  generationRequirement?: string;
  generationDraftPlan?: string;
  generationPagePlanJson?: string;
}
