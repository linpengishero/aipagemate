import { ERROR_CODES } from '~/utils/aiweb/errorCodes';
import { getAIProvider } from '~/utils/aiweb/providers/factory';

/**
 * 角色运行时基础能力：
 * 1) 调用底层大模型
 * 2) 解析 JSON（带容错）
 * 3) 清理代码块包裹
 */

/**
 * 去掉 ```xxx ... ``` 代码块包裹，返回纯代码文本。
 */
export const unwrapCodeFence = (code: string) => {
  if (!code) return "";
  const trimmed = code.trim();
  const fencedMatch = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
};

/**
 * 从文本中提取首个完整 JSON 对象字符串。
 * 支持模型返回夹杂解释文本、markdown 代码块等情况。
 */
const extractJSONObject = (rawText: string): string | null => {
  const text = rawText.replace(/```json/gi, "```").replace(/```/g, "").trim();
  const firstBrace = text.indexOf("{");
  if (firstBrace < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(firstBrace, i + 1);
      }
    }
  }

  return null;
};

/**
 * 解析模型返回的 JSON。
 * 首次解析失败时，会自动做常见修复（智能引号、尾逗号）再重试。
 */
export const parseJSONFromModel = (text: string) => {
  const extracted = extractJSONObject(text);
  if (!extracted) {
    throw new Error("Model response does not contain a valid JSON object.");
  }

  try {
    return JSON.parse(extracted);
  } catch {
    const compacted = extracted
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, "$1");

    return JSON.parse(compacted);
  }
};

/**
 * 统一模型调用入口：给定 prompt，返回模型主文本内容。
 */
export const askModel = async (prompt: string) => {
  const provider = getAIProvider();
  const result = await provider.chat({
    messages: [{ role: 'user', content: prompt }],
  });

  if (!result.ok) {
    throw new Error(`[${result.code || ERROR_CODES.AI_CHAT_FAILED}] ${result.message}`);
  }

  return String(result.data.content || '').trim();
};

export const askModelWithRoleScope = async (
  roleScopedId: string,
  prompt: string,
) => {
  const scopedPrompt = `[role-scope:${roleScopedId}]\n${prompt}`;
  return askModel(scopedPrompt);
};
