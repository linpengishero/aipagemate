import { askModel, unwrapCodeFence } from "./runtime";

/**
 * 元素编辑角色：
 * 负责按用户要求局部修改页面元素，并保持其他区域不变。
 */

/**
 * 角色元信息（用于日志/调试/后续扩展）。
 */
export const elementEditorRole = {
  id: "element-editor",
  description: "Edits selected DOM fragment while preserving all unrelated parts of the page.",
};

/**
 * 构建普通元素编辑提示词。
 */
const buildElementEditPrompt = (
  sourceCode: string,
  elementCode: string,
  message: string
) => `Update the target element in this code:\n${sourceCode}\n\nTarget element:\n${elementCode}\n\nRequirement:\n${message}\n\nRules:\n1. Modify only the requested target element and keep all unrelated parts unchanged.\n2. Return the full updated code, not a partial fragment.\n3. Do not add explanations, markdown, or any extra text.\n4. Output code only.`;

/**
 * 构建带图片占位符的元素编辑提示词。
 * 用于避免 AI 误改 Base64 图片数据。
 */
const buildElementEditPromptWithImagePlaceholders = (
  preprocessedSourceCode: string,
  preprocessedElementCode: string,
  message: string
) => `Update the target element in this code:\n${preprocessedSourceCode}\n\nTarget element:\n${preprocessedElementCode}\n\nRequirement:\n${message}\n\nRules:\n1. Modify only the requested target element and keep all unrelated parts unchanged.\n2. Return the full updated code, not a partial fragment.\n3. Do not add explanations, markdown, or any extra text.\n4. Output code only.\n\nImage placeholder rules:\n- The code may contain placeholders like URL_IMG_xxx / HTML_IMG_xxx / JS_IMG_xxx / INLINE_IMG_xxx. Keep them unchanged.\n- The element snippet may contain IMAGE_PLACEHOLDER as a simplified marker. Do not introduce new IMAGE_PLACEHOLDER in final output.\n- Preserve placeholder consistency with the source code to ensure image restoration works correctly.`;

/**
 * 调用模型编辑普通元素，返回清理后的完整代码。
 */
export const editElementByAI = async (
  sourceCode: string,
  elementCode: string,
  message: string
) => {
  const prompt = buildElementEditPrompt(sourceCode, elementCode, message);
  const content = await askModel(prompt);
  return unwrapCodeFence(content);
};

/**
 * 调用模型编辑含图片占位符的元素，返回清理后的完整代码。
 */
export const editElementByAIWithImagePlaceholders = async (
  preprocessedSourceCode: string,
  preprocessedElementCode: string,
  message: string
) => {
  const prompt = buildElementEditPromptWithImagePlaceholders(
    preprocessedSourceCode,
    preprocessedElementCode,
    message
  );
  const content = await askModel(prompt);
  return unwrapCodeFence(content);
};
