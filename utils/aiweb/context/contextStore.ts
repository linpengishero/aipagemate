import type { RequirementFlowContext, RequirementFlowStage } from '~/utils/aiweb/orchestrators';
import { buildPageFlowKey, buildProjectFlowKey } from './keyFactory';

const FLOW_CONTEXT_STORAGE_KEY = 'aiweb:flow-context';
const ROLE_CONTEXT_STORAGE_KEY = 'aiweb:role-context';

export interface FlowSnapshot {
  stage: RequirementFlowStage;
  context: RequirementFlowContext;
}

export type FlowContextStoreMap = Record<string, FlowSnapshot>;
export type RoleContextStoreMap = Record<string, string[]>;

export interface ContextStoreState {
  flow: FlowContextStoreMap;
  role: RoleContextStoreMap;
}

export const createContextStoreState = (): ContextStoreState => ({
  flow: {},
  role: {},
});

export const loadContextStoreState = (): ContextStoreState => {
  const state = createContextStoreState();

  try {
    const rawFlow = localStorage.getItem(FLOW_CONTEXT_STORAGE_KEY);
    if (rawFlow) {
      const parsed = JSON.parse(rawFlow);
      if (parsed && typeof parsed === 'object') {
        state.flow = parsed;
      }
    }
  } catch (error) {
    console.warn('[FlowContext] 读取失败:', error);
  }

  try {
    const rawRole = localStorage.getItem(ROLE_CONTEXT_STORAGE_KEY);
    if (rawRole) {
      const parsed = JSON.parse(rawRole);
      if (parsed && typeof parsed === 'object') {
        state.role = parsed;
      }
    }
  } catch (error) {
    console.warn('[RoleContext] 读取失败:', error);
  }

  return state;
};

export const persistFlowContextStore = (flow: FlowContextStoreMap) => {
  try {
    localStorage.setItem(FLOW_CONTEXT_STORAGE_KEY, JSON.stringify(flow));
  } catch (error) {
    console.warn('[FlowContext] 持久化失败:', error);
  }
};

export const persistRoleContextStore = (role: RoleContextStoreMap) => {
  try {
    localStorage.setItem(ROLE_CONTEXT_STORAGE_KEY, JSON.stringify(role));
  } catch (error) {
    console.warn('[RoleContext] 持久化失败:', error);
  }
};

export const saveFlowSnapshot = (
  flow: FlowContextStoreMap,
  key: string,
  stage: RequirementFlowStage,
  context: RequirementFlowContext,
) => {
  flow[key] = {
    stage,
    context: JSON.parse(JSON.stringify(context)),
  };
  persistFlowContextStore(flow);
};

export const restoreFlowSnapshot = (
  flow: FlowContextStoreMap,
  projectId: string,
  pageId = '',
): FlowSnapshot | null => {
  const pageKey = pageId ? buildPageFlowKey(projectId, pageId) : '';
  const projectKey = buildProjectFlowKey(projectId);
  return (pageKey && flow[pageKey]) || flow[projectKey] || null;
};

export const appendRoleContext = (
  role: RoleContextStoreMap,
  key: string,
  entry: string,
  limit = 30,
) => {
  if (!key || !entry) return;
  const prev = role[key] || [];
  role[key] = [...prev, entry].slice(-limit);
  persistRoleContextStore(role);
};

export const getRoleContextText = (role: RoleContextStoreMap, key: string) => {
  const list = role[key] || [];
  return list.join('\n');
};
