import { ERROR_CODES } from '~/utils/aiweb/errorCodes';
import { createTraceId, toFailure, toSuccess } from '~/utils/aiweb/response';
import type { AIProvider, AIChatPayload } from './types';

/**
 * Java API Provider 配置项。
 */
export interface JavaApiProviderOptions {
  /** Java 后端聊天接口地址 */
  endpoint: string;
  /** 透传附加请求头（如租户、鉴权信息） */
  headers?: Record<string, string>;
}

/**
 * Java API Provider：通过后端统一调用大模型。
 *
 * 适用场景：
 * - 生产环境密钥后端托管
 * - 统一限流、审计、计费与日志
 */
export class JavaApiAIProvider implements AIProvider {
  /** Provider 标识（用于日志与回传） */
  readonly name = 'java-api';

  constructor(private readonly options: JavaApiProviderOptions) {}

  /**
   * 聊天请求入口：
   * 1) 校验 endpoint
   * 2) 透传 traceId 到后端
   * 3) 解析后端统一响应结构
   * 4) 转为前端统一 ApiResponse
   */
  async chat(payload: AIChatPayload) {
    const traceId = payload.traceId || createTraceId('java');

    try {
      if (!this.options.endpoint) {
        return toFailure(ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED, 'Java API endpoint is not configured', { traceId });
      }

      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-trace-id': traceId,
          ...(this.options.headers || {}),
        },
        body: JSON.stringify({
          messages: payload.messages,
          model: payload.model,
          temperature: payload.temperature,
          maxTokens: payload.maxTokens,
          traceId,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json?.ok) {
        return toFailure(
          json?.code || ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
          json?.message || `Java API request failed: ${response.status}`,
          { traceId: json?.traceId || traceId },
        );
      }

      const content = String(json?.data?.content || '').trim();
      if (!content) {
        return toFailure(ERROR_CODES.AI_CHAT_FAILED, 'empty model response', { traceId: json?.traceId || traceId });
      }

      return toSuccess(
        {
          content,
          model: json?.data?.model || payload.model,
          provider: 'java-api' as const,
        },
        {
          message: json?.message || 'AI chat completed',
          traceId: json?.traceId || traceId,
        },
      );
    } catch (error: any) {
      return toFailure(
        ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
        error?.message || 'Java API provider request failed',
        { traceId },
      );
    }
  }
}
