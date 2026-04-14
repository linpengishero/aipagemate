import type { DesignPlan, SitePagePlan } from './types';
import { askModel, parseJSONFromModel } from './runtime';

export const pagePlannerRole = {
  id: 'page-planner',
  description: 'Plans site pages from confirmed design plan and requirement, including required utility/policy/success pages.',
};

const toPageLinkPlaceholder = (pageId: string) => {
  const normalized = String(pageId || 'page')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return `__PAGE_LINK_${normalized || 'PAGE'}__`;
};

const buildPagePlanPrompt = (requirement: string, designPlan: DesignPlan) => `You are a site information architect.
Create a page plan JSON for a website project based on requirement + design plan.

Role description:
${pagePlannerRole.description}

Requirement:
${requirement}

Confirmed design plan:
${JSON.stringify(designPlan)}

Return STRICT JSON:
{
  "siteSummary": "...",
  "pages": [
    {
      "id": "home",
      "name": "Home",
      "slug": "/",
      "linkPlaceholder": "__PAGE_LINK_HOME__",
      "purpose": "Primary conversion landing page",
      "sectionHints": ["Hero", "Features", "CTA"],
      "interactionHints": ["FAQ accordion", "CTA scroll"]
    }
  ]
}

Rules:
1. Include at least 1 main landing page.
2. If requirement/design mentions payment, include payment success/callback and cancel/failure pages.
3. If requirement/design mentions lead form submission, include submit-success/thank-you page.
4. If legal/compliance/privacy is needed, include privacy/terms (and cookies if applicable).
5. Keep page list practical and non-redundant.
6. Page technical fields (id, name, slug, purpose) must be in English.
7. Only page content copy may use user requested language.
8. Each page must include linkPlaceholder using format __PAGE_LINK_{UPPER_SNAKE_PAGE_ID}__.
9. Ask downstream generators to use linkPlaceholder for all internal links and use # for non-internal links.
10. Output JSON only.`;

export const planPages = async (requirement: string, designPlan: DesignPlan): Promise<SitePagePlan> => {
  const prompt = buildPagePlanPrompt(requirement, designPlan);
  const content = await askModel(prompt);
  const parsed = parseJSONFromModel(content);

  const pages = Array.isArray(parsed?.pages) ? parsed.pages : [];
  const normalized = pages
    .filter((p: any) => p && p.id && p.name && p.slug)
    .map((p: any) => {
      const id = String(p.id);
      return {
        id,
        name: String(p.name),
        slug: String(p.slug),
        linkPlaceholder: String(p.linkPlaceholder || toPageLinkPlaceholder(id)),
        purpose: String(p.purpose || ''),
        sectionHints: Array.isArray(p.sectionHints) ? p.sectionHints.map(String) : [],
        interactionHints: Array.isArray(p.interactionHints) ? p.interactionHints.map(String) : [],
      };
    });

  return {
    siteSummary: String(parsed?.siteSummary || 'Planned site pages for implementation.'),
    pages: normalized.length > 0 ? normalized : [
      {
        id: 'home',
        name: 'Home',
        slug: '/',
        linkPlaceholder: '__PAGE_LINK_HOME__',
        purpose: 'Primary conversion landing page',
        sectionHints: ['Hero', 'Features', 'FAQ', 'CTA'],
        interactionHints: ['FAQ accordion', 'CTA actions'],
      },
    ],
  };
};

export const formatPagePlanForUser = (plan: SitePagePlan) => {
  return `I have prepared the page planning result.\n\n` +
    `Site summary: ${plan.siteSummary}\n\n` +
    `Planned pages:\n${plan.pages.map((p, i) => `${i + 1}. ${p.name} (${p.slug}) - ${p.purpose}`).join('\n')}`;
};
