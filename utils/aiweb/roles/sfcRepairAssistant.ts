import { askModel, unwrapCodeFence } from "./runtime";

/**
 * 构建结构修复提示词（用于标签缺失、输出截断等场景）。
 */
const buildStructureRepairPrompt = (
  requirement: string,
  approvedPlan: string,
  currentCode: string
) => `You are a Vue SFC structure repair assistant.
The following code is incomplete or has malformed tags.
Please regenerate ONE complete and valid Vue 3 SFC.

Rules:
1. Output only one complete Vue SFC (template/script/style)
2. Keep the user intent and visual structure as much as possible
3. Use Options API
4. Ensure all tags are correctly closed
5. No explanations

Original requirement:
${requirement}${approvedPlan ? `\n\nApproved design proposal:\n${approvedPlan}` : ""}

Broken code:
${currentCode}`;

/**
 * SFC 样式修复角色：
 * 当首次生成代码缺少样式时，负责补全可用 CSS。
 */

/**
 * 角色元信息（用于日志/调试/后续扩展）。
 */
export const sfcRepairAssistantRole = {
  id: "sfc-repair-assistant",
  description: "Repairs generated Vue SFC when usable style blocks are missing.",
};

/**
 * 构建样式修复提示词。
 */
const buildStyleRepairPrompt = (
  requirement: string,
  approvedPlan: string,
  currentCode: string
) => `You are a Vue SFC repair assistant.
The following code is missing usable CSS styles.
Please keep the template/script logic as much as possible, and regenerate a complete Vue 3 SFC with meaningful, modern styles.

Role description:
${sfcRepairAssistantRole.description}

Rules:
1. Output only one complete Vue SFC (template/script/style)
2. Keep Options API
3. Ensure <style> has practical CSS for layout, spacing, typography, colors, and responsive behavior
4. Do not include explanations

Original requirement:
${requirement}${approvedPlan ? `\n\nApproved design proposal:\n${approvedPlan}` : ""}

Current code:
${currentCode}`;

/**
 * 调用模型修复 SFC 样式，并清理 markdown 代码块包裹。
 */
export const repairSfcStyle = async (
  requirement: string,
  approvedPlan: string,
  currentCode: string
) => {
  const prompt = buildStyleRepairPrompt(requirement, approvedPlan, currentCode);
  const content = await askModel(prompt);
  return unwrapCodeFence(content);
};

/**
 * 调用模型修复 SFC 结构完整性（标签缺失/截断）。
 */
export const repairSfcStructure = async (
  requirement: string,
  approvedPlan: string,
  currentCode: string
) => {
  const prompt = buildStructureRepairPrompt(requirement, approvedPlan, currentCode);
  const content = await askModel(prompt);
  return unwrapCodeFence(content);
};
