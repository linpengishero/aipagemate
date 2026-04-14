import { chat, type ChatMessage } from '~/api/LLM/config';
import { ERROR_CODES } from '~/utils/aiweb/errorCodes';
import { createTraceId, toFailure, toSuccess } from '~/utils/aiweb/response';
import type { AIProvider, AIChatPayload } from './types';

/**
 * 过滤无效消息，避免将空文本传给模型侧。
 */
const normalizeMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return (messages || []).filter((item) => item?.content?.trim());
};

/**
 * 本地 Provider：直接复用现有前端模型调用能力（OpenAI 兼容/Claude）。
 *
 * 适用场景：
 * - 本地开发联调
 * - 迁移 Java 后端前的兼容模式
 */
export class LocalAIProvider implements AIProvider {
  /** Provider 标识（用于日志与回传） */
  readonly name = 'local';

  /**
   * 统一聊天入口：
   * 1) 生成 traceId
   * 2) 入参校验
   * 3) 调用底层 chat
   * 4) 统一包装响应结构
   */
  async chat(payload: AIChatPayload) {
    const traceId = payload.traceId || createTraceId('local');

    try {
      const messages = normalizeMessages(payload.messages);
      if (messages.length === 0) {
        return toFailure(ERROR_CODES.VALIDATION_ERROR, 'messages cannot be empty', { traceId });
      }

      const result = await chat(messages, {
        model: payload.model,
        apiKey: payload.apiKey,
        baseURL: payload.baseURL,
      });

      const content = String(result?.choices?.[0]?.message?.content || '').trim();
      if (!content) {
        return toFailure(ERROR_CODES.AI_CHAT_FAILED, 'empty model response', { traceId });
      }

      return toSuccess(
        {
          content,
          model: payload.model,
          provider: 'local' as const,
        },
        {
          message: 'AI chat completed',
          traceId,
        },
      );
    } catch (error: any) {
      return toFailure(
        ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
        error?.message || 'Local provider request failed',
        { traceId },
      );
    }
  }
}
