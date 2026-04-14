export type ContextScope = 'project' | 'page';

export interface ChatHistoryKeyParams {
  projectId?: string;
  pageId?: string;
}

export interface FlowKeyParams {
  projectId: string;
  pageId?: string;
  scope?: ContextScope;
}

export interface RoleKeyParams {
  roleId: string;
  projectId: string;
  pageId?: string;
  scope?: ContextScope;
}

export const buildProjectFlowKey = (projectId: string) => `project:${projectId}`;

export const buildPageFlowKey = (projectId: string, pageId: string) => `page:${projectId}:${pageId}`;

export const buildFlowKey = ({ projectId, pageId = '', scope }: FlowKeyParams) => {
  const finalScope: ContextScope = scope || (pageId ? 'page' : 'project');
  if (finalScope === 'page') {
    if (!pageId) {
      throw new Error('buildFlowKey requires pageId when scope is page');
    }
    return buildPageFlowKey(projectId, pageId);
  }
  return buildProjectFlowKey(projectId);
};

export const buildRoleProjectKey = (roleId: string, projectId: string) => `${roleId}:project:${projectId}`;

export const buildRolePageKey = (roleId: string, projectId: string, pageId: string) => `${roleId}:page:${projectId}:${pageId}`;

export const buildRoleKey = ({ roleId, projectId, pageId = '', scope }: RoleKeyParams) => {
  const finalScope: ContextScope = scope || (pageId ? 'page' : 'project');
  if (finalScope === 'page') {
    if (!pageId) {
      throw new Error('buildRoleKey requires pageId when scope is page');
    }
    return buildRolePageKey(roleId, projectId, pageId);
  }
  return buildRoleProjectKey(roleId, projectId);
};

export const buildChatHistoryKey = ({ projectId = '', pageId = '' }: ChatHistoryKeyParams) => {
  const p = String(projectId).trim();
  const pg = String(pageId).trim();

  if (p && pg) {
    return `aiChatHistory:page:${p}:${pg}`;
  }

  if (p) {
    return `aiChatHistory:project:${p}`;
  }

  return 'aiChatHistory:default';
};
