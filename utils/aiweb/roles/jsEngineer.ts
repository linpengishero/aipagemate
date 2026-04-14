import { askModel, unwrapCodeFence } from './runtime';

export const jsEngineerRole = {
  id: 'js-engineer',
  description: 'Generates minimal Vue Options API interaction logic for landing page CTAs and UI behavior.',
};

const buildJsPrompt = (htmlFragment: string, requirement: string, approvedPlan = '') => `You are a senior JavaScript engineer in Vue 3 Options API context.
Generate ONLY JavaScript for the content inside <script> (no wrapper tags).

Role description:
${jsEngineerRole.description}

Rules:
1. Output ONLY JavaScript object export code (export default { ... })
2. Use Options API style only
3. Bind interactions only to selectors present in provided HTML
4. Include safe CTA handlers for Stripe/PayPal buttons when payment section exists
5. Do not include explanations
6. Do NOT move static copy into data/computed variables unless absolutely necessary
7. Avoid generating structures that require mustache rendering for normal marketing text

Requirement:
${requirement}${approvedPlan ? `\n\nApproved plan:\n${approvedPlan}` : ''}

HTML Fragment:
${htmlFragment}`;

const isValidJs = (js: string) => {
  const text = (js || '').trim();
  if (!text) return false;
  return /export\s+default\s*\{[\s\S]*\}/.test(text);
};

export const generateJsCode = async (
  htmlFragment: string,
  requirement: string,
  approvedPlan = ''
) => {
  const prompt = buildJsPrompt(htmlFragment, requirement, approvedPlan);
  const content = unwrapCodeFence(await askModel(prompt));

  if (!isValidJs(content)) {
    throw new Error('JS engineer output is invalid.');
  }

  return content;
};

export const validateJsCode = isValidJs;
