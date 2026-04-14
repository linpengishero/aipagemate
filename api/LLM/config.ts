import OpenAI from "openai";
import { getCurrentModelConfig } from "~/utils/modelManager";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// 缓存OpenAI实例，避免重复创建
const openaiInstances = new Map<string, OpenAI>();

// 获取或创建OpenAI实例
const getOpenAIInstance = (apiKey: string, baseURL: string): OpenAI => {
  const cacheKey = `${apiKey}:${baseURL}`;

  if (!openaiInstances.has(cacheKey)) {
    openaiInstances.set(
      cacheKey,
      new OpenAI({
        baseURL,
        apiKey,
        dangerouslyAllowBrowser: true,
      })
    );
  }

  return openaiInstances.get(cacheKey)!;
};

const normalizeMessages = (promptOrMessages: string | ChatMessage[]): ChatMessage[] => {
  if (typeof promptOrMessages === "string") {
    return [{ role: "user", content: promptOrMessages }];
  }

  const normalized = promptOrMessages
    .filter((item) => item && typeof item.content === "string" && item.content.trim() !== "")
    .map((item) => ({ role: item.role, content: item.content }));

  if (normalized.length === 0) {
    throw new Error("消息内容不能为空");
  }

  return normalized;
};

/**
 * 聊天
 * 支持传入单条prompt或多轮messages
 * 如果不传入选项，将从modelManager中获取模型设置
 */
export const chat = async (
  promptOrMessages: string | ChatMessage[],
  options?: { apiKey?: string; model?: string; baseURL?: string }
) => {
  const messages = normalizeMessages(promptOrMessages);

  // 优先使用传入的选项，如果没有传入则从modelManager获取
  let modelSettings = options;

  if (!modelSettings || !modelSettings.apiKey) {
    const settings = getCurrentModelConfig();
    if (!settings) {
      throw new Error("未找到有效的AI模型设置，请先配置模型");
    }
    modelSettings = settings;
  }

  const model = modelSettings.model || "gpt-4.1-mini";
  const apiKey = modelSettings.apiKey;
  const baseURL = modelSettings.baseURL;

  if (!apiKey) {
    throw new Error("请提供API Key");
  }

  // Claude API（Anthropic原生消息格式）
  if (model.includes("claude")) {
    const claudeBaseURL = baseURL || "https://api.anthropic.com/v1";

    const response = await fetch(`${claudeBaseURL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        messages: messages.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        // 提高代码生成场景下的输出上限，降低SFC截断概率
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error((error as any).error?.message || "请求Claude API失败");
    }

    const claudeResponse = await response.json();
    return {
      choices: [
        {
          message: {
            content: claudeResponse.content[0].text,
          },
        },
      ],
    };
  }

  // 其余模型统一走 OpenAI 兼容协议
  const openaiBaseURL = baseURL || "https://api.openai.com/v1";
  const openai = getOpenAIInstance(apiKey, openaiBaseURL);

  return openai.chat.completions.create({
    messages,
    model,
    // 增加输出上限，减少长代码响应被截断
    max_tokens: 8000,
  });
};

/**
 * 带图片的聊天
 * 如果不传入选项，将从modelManager中获取模型设置
 */
export const chatByImage = async (
  prompt: string,
  img: string,
  options?: { apiKey?: string; model?: string; baseURL?: string }
) => {
  // 优先使用传入的选项，如果没有传入则从modelManager获取
  let modelSettings = options;

  if (!modelSettings || !modelSettings.apiKey) {
    const settings = getCurrentModelConfig();
    if (!settings) {
      throw new Error("未找到有效的AI模型设置，请先配置模型");
    }
    modelSettings = settings;
  }

  const apiKey = modelSettings.apiKey;
  const baseURL = modelSettings.baseURL || "https://api.openai.com/v1";
  const model = modelSettings.model || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("请提供API Key");
  }

  const openai = getOpenAIInstance(apiKey, baseURL);

  return openai.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: img,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.2,
  });
};
