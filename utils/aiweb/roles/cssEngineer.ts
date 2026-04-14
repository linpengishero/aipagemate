import { askModel, unwrapCodeFence } from './runtime';

export const cssEngineerRole = {
  id: 'css-engineer',
  description: 'Generates responsive CSS for landing page sections with conversion-oriented visual hierarchy.',
};

const buildCssPrompt = (htmlFragment: string, requirement: string, approvedPlan = '') => `You are a senior CSS engineer specialized in landing pages.
Generate ONLY CSS for the given HTML fragment.

Role description:
${cssEngineerRole.description}

Rules:
1. Output ONLY CSS
2. Must be responsive (desktop + mobile)
3. Prefer selectors using existing ids/data-role/classes from HTML
4. Include styles for clear CTA hierarchy and pricing/payment blocks when present
5. Do not include explanations

Requirement:
${requirement}${approvedPlan ? `\n\nApproved plan:\n${approvedPlan}` : ''}

HTML Fragment:
${htmlFragment}`;

const isValidCss = (css: string) => {
  const text = (css || '').trim();
  if (!text) return false;
  if (/<[a-z][\s\S]*>/i.test(text)) return false;
  return /\{[\s\S]*\}/.test(text);
};

export const generateCssCode = async (
  htmlFragment: string,
  requirement: string,
  approvedPlan = ''
) => {
  const prompt = buildCssPrompt(htmlFragment, requirement, approvedPlan);
  const content = unwrapCodeFence(await askModel(prompt));

  if (!isValidCss(content)) {
    throw new Error('CSS engineer output is invalid.');
  }

  return content;
};

export const validateCssCode = isValidCss;
