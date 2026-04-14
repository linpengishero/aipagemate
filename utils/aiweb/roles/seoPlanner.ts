import { askModel, parseJSONFromModel } from './runtime';

export interface SeoPlan {
  pageTitle: string;
  description: string;
  keywords: string;
}

export const seoPlannerRole = {
  id: 'seo-planner',
  description: 'Generates page-level SEO metadata based on page intent and generated code.',
};

const buildSeoPrompt = (pageName: string, requirement: string, code: string) => `You are an SEO planner.
Generate SEO metadata for this page.

Page: ${pageName}
Requirement context: ${requirement}
Code:
${code}

Return STRICT JSON:
{
  "pageTitle": "...",
  "description": "...",
  "keywords": "k1,k2,k3"
}

Rules:
1. Keep title <= 60 chars if possible.
2. Keep description <= 160 chars if possible.
3. Output JSON only.`;

export const planPageSeo = async (pageName: string, requirement: string, code: string): Promise<SeoPlan> => {
  const content = await askModel(buildSeoPrompt(pageName, requirement, code));
  const parsed = parseJSONFromModel(content);

  return {
    pageTitle: String(parsed?.pageTitle || pageName),
    description: String(parsed?.description || `${pageName} page`),
    keywords: String(parsed?.keywords || ''),
  };
};
