export interface RequirementQuestionOption {
  id: string;
  label: string;
}

export interface RequirementQuestion {
  id: string;
  title?: string;
  question: string;
  type: 'input' | 'option';
  placeholder?: string;
  options?: RequirementQuestionOption[];
}

export interface DesignPlan {
  title: string;
  summary: string;
  sections: string[];
  visual: string[];
  interaction: string[];
  pagePlanningRules: string[];
}

export interface PlannedPage {
  id: string;
  name: string;
  slug: string;
  /** 页面链接占位符，供生成阶段内链引用 */
  linkPlaceholder?: string;
  purpose: string;
  sectionHints: string[];
  interactionHints: string[];
}

export interface SitePagePlan {
  siteSummary: string;
  pages: PlannedPage[];
}
