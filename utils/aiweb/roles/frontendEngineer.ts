import { askModel, unwrapCodeFence } from './runtime';
import { generateHtmlFragment, validateHtmlFragment } from './htmlEngineer';
import { generateCssCode, validateCssCode } from './cssEngineer';
import { generateJsCode, validateJsCode } from './jsEngineer';

const MAX_ROLE_RETRIES = 3;

const isLikelyCompleteSfc = (code: string) => {
  const text = unwrapCodeFence(code);
  if (!text) return false;

  const requiredPairs: Array<[RegExp, RegExp]> = [
    [/<template[\s>]/g, /<\/template>/g],
    [/<script[\s>]/g, /<\/script>/g],
    [/<style[\s>]/g, /<\/style>/g],
  ];

  return requiredPairs.every(([open, close]) => {
    const openCount = (text.match(open) || []).length;
    const closeCount = (text.match(close) || []).length;
    return openCount > 0 && openCount === closeCount;
  });
};

const EXAMPLE_IMAGE_PATH = '/images/example/img.png';

const replaceExampleImagePlaceholders = (html: string) => {
  let output = html || '';
  output = output.replace(/__EXAMPLE_IMAGE__/g, EXAMPLE_IMAGE_PATH);
  return output;
};

const composeSfc = (html: string, css: string, js: string) => {
  const safeHtml = replaceExampleImagePlaceholders(html);
  const scriptBody = js.trim() || `export default {\n  name: 'LandingPage'\n};`;

  return `<template>\n${safeHtml}\n</template>\n\n<script>\n${scriptBody}\n</script>\n\n<style>\n${css}\n</style>`;
};

const buildWebGenerationPrompt = (requirement: string, approvedPlan = '') => `You are a senior frontend engineer for landing pages.
Please generate a complete Vue 3 Single File Component for a conversion-focused landing page according to the requirement and approved design proposal.

Rules:
1. Use standard Options API format (not <script setup>)
2. Use plain CSS in <style> (no preprocessor)
3. Must be a valid full SFC with template/script/style
4. Focus ONLY on landing page content and sections
5. Include payment CTA placeholders for Stripe/PayPal when requirement asks payment
6. Ensure all user-visible copy follows the language requirement provided by user
7. Do not include explanations

Requirement:
${requirement}${approvedPlan ? `\n\nApproved design proposal:\n${approvedPlan}` : ''}`;

const generateWithRetry = async <T>(
  producer: () => Promise<T>,
  validator: (value: T) => boolean,
  label: string,
) => {
  let lastValue: T | null = null;

  for (let i = 0; i < MAX_ROLE_RETRIES; i++) {
    const value = await producer();
    lastValue = value;
    if (validator(value)) return value;
  }

  throw new Error(`${label} generation failed after ${MAX_ROLE_RETRIES} retries.`);
};

export const frontendEngineerRole = {
  id: 'frontend-engineer',
  description: 'Generates production-ready landing page Vue 3 SFC code from approved requirements.',
};

export const generateWebCode = async (requirement: string, approvedPlan = '') => {
  try {
    const html = await generateWithRetry(
      () => generateHtmlFragment(requirement, approvedPlan),
      validateHtmlFragment,
      'HTML role',
    );

    const css = await generateWithRetry(
      () => generateCssCode(html, requirement, approvedPlan),
      validateCssCode,
      'CSS role',
    );

    const js = await generateWithRetry(
      () => generateJsCode(html, requirement, approvedPlan),
      validateJsCode,
      'JS role',
    );

    const sfc = composeSfc(html, css, js);
    if (isLikelyCompleteSfc(sfc)) {
      return sfc;
    }
    throw new Error('Composed SFC is incomplete.');
  } catch {
    const prompt = buildWebGenerationPrompt(requirement, approvedPlan);
    const firstContent = await askModel(prompt);
    let mergedCode = unwrapCodeFence(firstContent);

    if (!isLikelyCompleteSfc(mergedCode)) {
      const continuePrompt = `The previous Vue SFC output was truncated.
Continue ONLY from where it stopped and output ONLY the remaining code.
Do not repeat already generated content.\n\nAlready generated code:\n${mergedCode}`;

      const continueContent = await askModel(continuePrompt);
      const continuation = unwrapCodeFence(continueContent);
      if (continuation) {
        mergedCode = `${mergedCode}\n${continuation}`.trim();
      }
    }

    return mergedCode;
  }
};
