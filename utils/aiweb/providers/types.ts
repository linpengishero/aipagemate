import type { ChatMessage } from '~/api/LLM/config';
import type { ApiResponse } from '~/utils/aiweb/response';

export interface AIChatPayload {
  messages: ChatMessage[];
  model?: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  traceId?: string;
}

export interface AIChatData {
  content: string;
  model?: string;
  provider?: 'local' | 'java-api';
}

export interface AIProvider {
  readonly name: string;
  chat(payload: AIChatPayload): Promise<ApiResponse<AIChatData>>;
}
