import { askModel, unwrapCodeFence } from './runtime';

export const htmlEngineerRole = {
  id: 'html-engineer',
  description: 'Generates semantic HTML structure for a conversion-focused landing page.',
};

const buildHtmlPrompt = (requirement: string, approvedPlan = '') => `You are a senior HTML engineer specialized in landing pages.
Generate ONLY the HTML fragment for a single landing page body.

Role description:
${htmlEngineerRole.description}

Rules:
1. Output ONLY HTML fragment (no markdown, no explanations)
2. No <script>, no <style>, no <html>/<head>/<body>
3. Use semantic sections for landing page: hero, trust/social proof, features, pricing/offer, FAQ, CTA
4. Add stable ids or data-role attributes for key blocks and buttons
5. If payment section is relevant, include placeholders for Stripe and PayPal CTA buttons
6. All user-facing copy must be in English unless requirement explicitly says otherwise
7. Unless absolutely necessary, DO NOT use Vue dynamic syntax for copy/content:
   - avoid mustache like {{ ... }}
   - avoid v-for for plain marketing text blocks
   - avoid binding text from data/computed when text can be written directly
8. Prefer writing final user-visible text directly inside HTML tags

Requirement:
${requirement}${approvedPlan ? `\n\nApproved plan:\n${approvedPlan}` : ''}`;

const isValidHtmlFragment = (html: string) => {
  const text = (html || '').trim();
  if (!text) return false;
  if (/<script[\s>]/i.test(text) || /<style[\s>]/i.test(text)) return false;
  return /<(main|section|div|header|footer)[\s>]/i.test(text);
};

export const generateHtmlFragment = async (requirement: string, approvedPlan = '') => {
  const prompt = buildHtmlPrompt(requirement, approvedPlan);
  const content = unwrapCodeFence(await askModel(prompt));

  if (!isValidHtmlFragment(content)) {
    throw new Error('HTML engineer output is invalid.');
  }

  return content;
};

export const validateHtmlFragment = isValidHtmlFragment;
