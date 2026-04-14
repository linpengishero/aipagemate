import type { DesignPlan } from "./types";
import { askModel, parseJSONFromModel } from "./runtime";

/**
 * 设计方案角色：
 * 根据确认后的需求输出结构化设计方案（不是代码）。
 */

/**
 * 角色元信息（用于日志/调试/后续扩展）。
 */
export const designPlannerRole = {
  id: "design-planner",
  description: "Creates a business-friendly design proposal in English JSON.",
};

/**
 * 构建设计方案提示词。
 */
const buildDesignPlanPrompt = (requirement: string) => `You are a senior web designer. Output a design proposal (not code) in English.

Role description:
${designPlannerRole.description}

Requirement:
${requirement}

Critical language rule:
- Keep planning/control language in English for developer readability.
- If user requests page copy in another language, only content copy should follow that language.
- Page names, routing labels, and plan item headers must stay English.

Return STRICT JSON only:
{
  "title": "Plan title",
  "summary": "One-line positioning",
  "sections": [
    "Section: Hero | Goal: ... | Content: ... | CTA: ...",
    "Section: FAQ | Goal: ... | Content: ... | Behavior: On click, each item expands/collapses with clear active state"
  ],
  "visual": [
    "Color system: ... | Typography: ... | Spacing rhythm: ...",
    "Card/section style: ... | Emphasis hierarchy: ..."
  ],
  "interaction": [
    "Component: FAQ accordion | Trigger: click question | Feedback: expand/collapse animation | State: single/multi open",
    "Component: CTA buttons | Trigger: click | Action: scroll/jump/open checkout | Failure handling: ..."
  ],
  "pagePlanningRules": [
    "If payment integration is required, include payment success/callback page and cancellation page in page planning.",
    "If homepage has submit/lead form, include submit-success/thank-you page in page planning.",
    "If legal/compliance is requested, include privacy/terms/cookies pages accordingly."
  ]
}

Rules:
1. Business-friendly wording.
2. 3-6 bullet points per array.
3. Every section item must include: section name, business goal, content points, and CTA/next-step.
4. Every interactive item must include: component, trigger, expected behavior, and state change.
5. For payment-related requirements, explicitly describe Stripe/PayPal entry points and user flow.
6. If FAQ exists, explicitly describe clickable expand/collapse behavior.`;

/**
 * 调用模型生成设计方案并解析为结构化对象。
 */
export const planDesign = async (requirement: string): Promise<DesignPlan> => {
  const prompt = buildDesignPlanPrompt(requirement);
  const content = await askModel(prompt);
  const parsed = parseJSONFromModel(content);

  return {
    title: String(parsed?.title || "Web Design Plan"),
    summary: String(parsed?.summary || "Modern, practical and visually clear"),
    sections: Array.isArray(parsed?.sections) ? parsed.sections.map(String) : [],
    visual: Array.isArray(parsed?.visual) ? parsed.visual.map(String) : [],
    interaction: Array.isArray(parsed?.interaction) ? parsed.interaction.map(String) : [],
    pagePlanningRules: Array.isArray(parsed?.pagePlanningRules)
      ? parsed.pagePlanningRules.map(String)
      : [
          'If payment integration is required, include payment success/callback page and cancellation page.',
          'If homepage has submit/lead form, include submit-success/thank-you page.',
          'Include privacy/terms pages when legal content is needed.'
        ],
  };
};

/**
 * 将结构化方案转成给用户展示的可读文本。
 */
export const formatPlanForUser = (plan: Partial<DesignPlan>) => {
  const sections = Array.isArray(plan?.sections) ? plan.sections : [];
  const visual = Array.isArray(plan?.visual) ? plan.visual : [];
  const interaction = Array.isArray(plan?.interaction) ? plan.interaction : [];

  return `I’ve prepared a draft design plan for your confirmation:\n\n` +
    `Title: ${plan?.title || "Web Design Plan"}\n` +
    `Positioning: ${plan?.summary || "Modern, practical and visually clear"}\n\n` +
    `Structure (with goal/content/CTA):\n${sections.map((item, index) => `${index + 1}. ${item}`).join("\n") || "1. Section: Hero | Goal: communicate value fast | Content: headline, subheadline, social proof | CTA: Start now"}\n\n` +
    `Visual Style:\n${visual.map((item, index) => `${index + 1}. ${item}`).join("\n") || "1. Color system + typography + spacing hierarchy"}\n\n` +
    `Interactions (with trigger/behavior/state):\n${interaction.map((item, index) => `${index + 1}. ${item}`).join("\n") || "1. FAQ accordion: click question to expand/collapse with active state"}\n\n` +
    `Please choose one action in the structured options below.`;
};
