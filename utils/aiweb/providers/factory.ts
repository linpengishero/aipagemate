import type { AIProvider } from './types';
import { LocalAIProvider } from './localAIProvider';
import { JavaApiAIProvider } from './javaApiAIProvider';

/** Provider 运行模式 */
export type AIProviderMode = 'local' | 'java-api';

/**
 * 解析当前运行模式。
 * 优先级：
 * 1) VITE_AI_PROVIDER_MODE
 * 2) window.__AI_PROVIDER_MODE__（运行时覆盖）
 * 3) local（默认）
 */
const resolveMode = (): AIProviderMode => {
  const mode = (import.meta as any)?.env?.VITE_AI_PROVIDER_MODE || (window as any)?.__AI_PROVIDER_MODE__;
  return mode === 'java-api' ? 'java-api' : 'local';
};

/** Provider 单例，避免重复创建 */
let singleton: AIProvider | null = null;

/**
 * 获取 AI Provider 单例。
 *
 * 当切换为 java-api 模式时，会使用后端聊天接口；
 * 否则回退到本地模式。
 */
export const getAIProvider = (): AIProvider => {
  if (singleton) return singleton;

  const mode = resolveMode();
  if (mode === 'java-api') {
    const endpoint = (import.meta as any)?.env?.VITE_JAVA_AI_ENDPOINT || '/api/ai/chat';
    singleton = new JavaApiAIProvider({ endpoint });
    return singleton;
  }

  singleton = new LocalAIProvider();
  return singleton;
};

/**
 * 测试辅助：注入或重置 Provider 单例。
 */
export const setAIProviderForTesting = (provider: AIProvider | null) => {
  singleton = provider;
};
