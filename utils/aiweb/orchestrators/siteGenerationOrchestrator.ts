import webProjectStore from '~/utils/webDB/WebProjectStorage';
import { compileSourceCode } from '~/utils/complier/vueComplier';
import { runFirstPageGeneration } from './generationOrchestrator';
import { planPageSeo } from '~/utils/aiweb/roles/seoPlanner';
import { SEOProcessorTool } from '~/utils/aiweb/tools';
import { repairSfcStructure } from '~/utils/aiweb/roles/sfcRepairAssistant';
import type { PlannedPage } from '~/utils/aiweb/roles/types';
import { runPostGenerationPipeline, DEFAULT_EXAMPLE_IMAGE_PATH } from '~/utils/aiweb/workflows';
import { ok, err, type Result } from '~/utils/aiweb/types';

export interface SiteGenerationParams {
  requirement: string;
  approvedPlan: string;
  projectId: string;
  plannedPages: PlannedPage[];
  logFlow?: (stage: string, payload?: any) => void;
}

export interface SiteGenerationResult {
  firstPageId: string;
  firstPageCode: string;
  generatedCount: number;
}

export interface GenerateSinglePageParams {
  requirement: string;
  approvedPlan: string;
  projectId: string;
  plannedPages: PlannedPage[];
  page: PlannedPage;
  preferredPageId?: string;
  logFlow?: (stage: string, payload?: any) => void;
}

export interface GenerateSinglePageResult {
  pageId: string;
  pageCode: string;
  pageName: string;
}

const summarizeCompilerError = (reason: string) => {
  const text = String(reason || 'Unknown compile error');
  const lineColMatch = text.match(/\((\d+):(\d+)\)/);
  const tokenMatch = text.match(/Unexpected token[^\n]*/i);
  const line = lineColMatch ? `line ${lineColMatch[1]}, col ${lineColMatch[2]}` : 'line/col unknown';
  const token = tokenMatch ? tokenMatch[0] : 'syntax/compile issue';
  const firstLine = text.split('\n').find(Boolean) || text;
  return `${token} @ ${line}. ${firstLine}`;
};

const validateCode = async (code: string) => {
  try {
    // Validation should not mutate host styles.
    await compileSourceCode(code, { injectStyles: false });
    return { ok: true as const, reason: '' };
  } catch (error: any) {
    const reason = error?.message || String(error);
    return { ok: false as const, reason, summary: summarizeCompilerError(reason) };
  }
};

const toPageLinkPlaceholder = (pageId: string) => {
  const normalized = String(pageId || 'page')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return `__PAGE_LINK_${normalized || 'PAGE'}__`;
};

const normalizeLinksByPlan = (code: string, plannedPages: PlannedPage[]) => {
  const tokenMap = new Map<string, string>();
  plannedPages.forEach((p) => {
    const token = p.linkPlaceholder || toPageLinkPlaceholder(p.id);
    tokenMap.set(p.id.toLowerCase(), token);
    tokenMap.set(p.name.toLowerCase(), token);
    tokenMap.set(p.slug.toLowerCase(), token);
  });

  let normalized = code;

  normalized = normalized.replace(/href=["']([^"']+)["']/gi, (_full, hrefValue) => {
    const raw = String(hrefValue || '').trim();

    if (!raw) {
      return 'href="#"';
    }

    if (raw.startsWith('__PAGE_LINK_')) {
      return `href="${raw}"`;
    }

    const key = raw.replace(/^\//, '').toLowerCase();
    const token = tokenMap.get(key);

    if (token) {
      return `href="${token}"`;
    }

    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
      return 'href="#"';
    }

    if (raw.startsWith('#')) {
      return 'href="#"';
    }

    return 'href="#"';
  });

  return normalized;
};

const isSamePlannedPage = (rawJson: string | undefined, targetPageId: string) => {
  if (!rawJson) return false;
  try {
    const parsed = JSON.parse(rawJson);
    return parsed?.currentPage?.id === targetPageId;
  } catch {
    return false;
  }
};

const findReusablePage = async (projectId: string, page: PlannedPage, preferredPageId?: string) => {
  const existingPages = await webProjectStore.getProjectPages(projectId);

  if (preferredPageId) {
    const exact = existingPages.find((p) => p.id === preferredPageId);
    if (exact) return exact;
  }

  const matchedByPlanId = existingPages.find((p) => isSamePlannedPage(p.generationPagePlanJson, page.id));
  if (matchedByPlanId) return matchedByPlanId;

  const normalizedName = String(page.name || '').trim().toLowerCase();
  if (!normalizedName) return null;

  return existingPages.find((p) => String(p.name || '').trim().toLowerCase() === normalizedName) || null;
};

export const runSinglePageGeneration = async ({
  requirement,
  approvedPlan,
  projectId,
  plannedPages,
  page,
  preferredPageId,
  logFlow,
}: GenerateSinglePageParams): Promise<Result<GenerateSinglePageResult>> => {
  try {
    const pages = (plannedPages.length > 0
      ? plannedPages
      : [{ id: 'home', name: 'Home', slug: '/', purpose: 'Primary conversion page', sectionHints: [], interactionHints: [] }]
    ).map((p) => ({
      ...p,
      linkPlaceholder: p.linkPlaceholder || toPageLinkPlaceholder(p.id),
    }));

    const targetPage = {
      ...page,
      linkPlaceholder: page.linkPlaceholder || toPageLinkPlaceholder(page.id),
    };

    const siteMapText = pages.map((p) => `${p.name} -> ${p.slug} -> ${p.linkPlaceholder}`).join(', ');
    const baseRequirement = `${requirement}\n\nSite pages map: ${siteMapText}\nCurrent page: ${targetPage.name} (${targetPage.slug})\nPurpose: ${targetPage.purpose}\nSection hints: ${targetPage.sectionHints.join(', ')}\nInteraction hints: ${targetPage.interactionHints.join(', ')}`;

    let code = '';
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      const retryHint = lastError
        ? `\n\nPrevious compiler validation error:\n${lastError}\nFix this exact issue.`
        : '';

      const generated = await runFirstPageGeneration({
        requirement: `${baseRequirement}${retryHint}`,
        approvedPlan,
        logFlow,
      });

      if (!generated.ok) {
        lastError = generated.error;
        continue;
      }

      let candidate = normalizeLinksByPlan(generated.data.code, pages);

      try {
        const seo = await planPageSeo(targetPage.name, requirement, candidate);
        candidate = SEOProcessorTool.addSEOToCode(candidate, 'vue3', {
          title: seo.pageTitle,
          description: seo.description,
          keywords: seo.keywords,
        });
      } catch {
        // seo failure should not block generation
      }

      const valid = await validateCode(candidate);
      if (!valid.ok) {
        try {
          const repaired = await repairSfcStructure(requirement, approvedPlan, candidate);
          const revalid = await validateCode(repaired);
          if (revalid.ok) {
            candidate = repaired;
          } else {
            lastError = revalid.summary || revalid.reason;
            continue;
          }
        } catch {
          lastError = valid.summary || valid.reason;
          continue;
        }
      }

      code = runPostGenerationPipeline(candidate, {
        enforceExampleImageSrc: true,
        exampleImagePath: DEFAULT_EXAMPLE_IMAGE_PATH,
      });
      break;
    }

    if (!code) {
      return err(`${targetPage.name}: failed validation after retries. ${lastError}`, 'SITE_GENERATION_FAILED');
    }

    const reusablePage = await findReusablePage(projectId, targetPage, preferredPageId);

    const pageRecord = reusablePage
      ? {
        ...reusablePage,
        name: targetPage.name,
        title: targetPage.purpose || targetPage.name,
      }
      : await webProjectStore.createPage(projectId, targetPage.name, targetPage.purpose || targetPage.name);

    if (!pageRecord) {
      return err(`Failed to create or reuse page: ${targetPage.name}`, 'PAGE_CREATE_FAILED');
    }

    pageRecord.generationRequirement = requirement;
    pageRecord.generationDraftPlan = approvedPlan;
    pageRecord.linkPlaceholder = targetPage.linkPlaceholder || toPageLinkPlaceholder(targetPage.id);
    pageRecord.generationPagePlanJson = JSON.stringify({
      siteMap: pages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        linkPlaceholder: p.linkPlaceholder,
      })),
      currentPage: targetPage,
    });

    await webProjectStore.updatePage(pageRecord);

    const saved = await webProjectStore.savePage(pageRecord.id, code);
    if (!saved) {
      return err(`Failed to save page: ${targetPage.name}`, 'PAGE_SAVE_FAILED');
    }

    return ok({
      pageId: pageRecord.id,
      pageCode: code,
      pageName: targetPage.name,
    });
  } catch (error: any) {
    return err(error?.message || 'Single page generation failed.', 'SITE_GENERATION_FAILED');
  }
};

export const runSiteGeneration = async ({
  requirement,
  approvedPlan,
  projectId,
  plannedPages,
  logFlow,
}: SiteGenerationParams): Promise<Result<SiteGenerationResult>> => {
  try {
    const pages = (plannedPages.length > 0
      ? plannedPages
      : [{ id: 'home', name: 'Home', slug: '/', purpose: 'Primary conversion page', sectionHints: [], interactionHints: [] }]
    ).map((p) => ({
      ...p,
      linkPlaceholder: p.linkPlaceholder || toPageLinkPlaceholder(p.id),
    }));

    let firstPageId = '';
    let firstPageCode = '';

    for (let i = 0; i < pages.length; i++) {
      const generated = await runSinglePageGeneration({
        requirement,
        approvedPlan,
        projectId,
        plannedPages: pages,
        page: pages[i],
        logFlow,
      });

      if (!generated.ok) {
        return err(generated.error, generated.code || 'SITE_GENERATION_FAILED');
      }

      if (i === 0) {
        firstPageId = generated.data.pageId;
        firstPageCode = generated.data.pageCode;
      }
    }

    return ok({ firstPageId, firstPageCode, generatedCount: pages.length });
  } catch (error: any) {
    return err(error?.message || 'Site generation failed.', 'SITE_GENERATION_FAILED');
  }
};
