import type { RequirementQuestion } from "./types";
import { askModel, parseJSONFromModel } from "./runtime";

/**
 * 需求访谈角色：
 * 负责把用户模糊需求转为可执行的结构化问题清单。
 */

export interface RequirementAnalysisResult {
  clarity: "clear" | "unclear";
  clarifiedRequirement: string;
  questions: RequirementQuestion[];
}

/**
 * 角色元信息（用于日志/调试/后续扩展）。
 */
export const requirementInterviewerRole = {
  id: "requirement-interviewer",
  description: "Collects missing web requirements and produces a structured checklist for the user.",
};

/**
 * 构建“需求分析”提示词。
 */
const buildRequirementAnalysisPrompt = (
  userRequirement: string,
  previousAnswers = ""
) => `You are a landing-page requirement interviewer.
All your outputs must be in English.

Role description:
${requirementInterviewerRole.description}

User requirement:
${userRequirement}

Known answers:
${previousAnswers || "None"}

Return STRICT JSON only (no markdown, no extra text) using this schema:
{
  "clarity": "clear" | "unclear",
  "clarifiedRequirement": "A complete, consolidated requirement in English",
  "questions": [
    {
      "id": "q_color",
      "title": "Main Color Tone",
      "question": "Choose the primary color tone",
      "type": "option",
      "options": [
        { "id": "blue", "label": "Blue and white" },
        { "id": "purple", "label": "Purple gradient" }
      ]
    },
    {
      "id": "q_brand",
      "title": "Brand Name",
      "question": "Enter your brand or project name",
      "type": "input",
      "placeholder": "e.g. Aurora Studio"
    }
  ]
}

Rules:
1. questions must be a LIST of all missing items (not a single question).
2. Ask one question at a time in UI flow, but here return all still-missing questions.
3. Each question must be either "option" or "input".
4. For "option", provide 3-6 options.
5. If clarity is "clear", return questions as an empty array.
6. This project focuses ONLY on landing page generation.
7. You must self-check requirement completeness and ask only high-impact missing items.
8. Language for landing-page copy should be asked only when it is not inferable from user requirement and previous answers.
9. Focus on target audience, offer, CTA, color tone, style, key sections, mobile-first preference, and payment preference (Stripe/PayPal).`;

/**
 * 调用模型分析需求，返回结构化结果。
 */
export const analyzeRequirement = async (
  userRequirement: string,
  previousAnswers = ""
): Promise<RequirementAnalysisResult> => {
  const prompt = buildRequirementAnalysisPrompt(userRequirement, previousAnswers);
  const content = await askModel(prompt);
  const parsed = parseJSONFromModel(content);

  const questions: RequirementQuestion[] = Array.isArray(parsed?.questions)
    ? parsed.questions.filter(
        (q: any) => q && q.id && q.question && (q.type === "input" || q.type === "option")
      )
    : [];

  return {
    clarity: parsed?.clarity === "clear" ? "clear" : "unclear",
    clarifiedRequirement: String(parsed?.clarifiedRequirement || userRequirement),
    questions,
  };
};

/**
 * 本地兜底问题：当模型分析失败或返回异常时使用。
 */
export const getFallbackQuestions = (): RequirementQuestion[] => [
  {
    id: "q_copy_language",
    title: "Landing Page Copy Language",
    question: "Please enter the language for all landing page copy.",
    type: "input",
    placeholder: "e.g. English, Spanish, Japanese"
  },
  {
    id: "q_color_tone",
    title: "Main Color Tone",
    question: "Choose a primary color tone.",
    type: "option",
    options: [
      { id: "blue", label: "Blue and white" },
      { id: "purple", label: "Purple gradient" },
      { id: "green", label: "Green and neutral" },
      { id: "dark", label: "Dark modern" }
    ]
  },
  {
    id: "q_style",
    title: "Visual Style",
    question: "Choose a visual style.",
    type: "option",
    options: [
      { id: "minimal", label: "Minimal clean" },
      { id: "modern", label: "Modern business" },
      { id: "creative", label: "Creative bold" },
      { id: "tech", label: "Tech/futuristic" }
    ]
  },
  {
    id: "q_sections",
    title: "Key Sections",
    question: "List the key sections you need (comma-separated).",
    type: "input",
    placeholder: "e.g. Hero, Features, Pricing, FAQ, Contact"
  },
  {
    id: "q_payment",
    title: "Payment Integration",
    question: "Which payment methods should the landing page support?",
    type: "option",
    options: [
      { id: "stripe", label: "Stripe" },
      { id: "paypal", label: "PayPal" },
      { id: "both", label: "Both Stripe and PayPal" },
      { id: "none", label: "No payment integration" }
    ]
  }
];
