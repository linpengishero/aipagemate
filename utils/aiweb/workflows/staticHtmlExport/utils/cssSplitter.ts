import type { NormalizedStaticHtmlPage } from './normalizers';

export interface SplitCssResult {
  sharedCss: string;
  pageSpecificCss: Map<string, string>;
}

/**
 * CSS 归一化（仅用于比较，不用于输出）
 * - 压缩空白
 * - 去注释
 * - 去首尾空格
 */
const normalizeCssForCompare = (css: string) => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * 将 style 文本按“规则块”拆分（{...}）
 * 目的：比按整段 style block 更细粒度识别公共样式
 */
const splitCssRules = (cssBlock: string): string[] => {
  const source = (cssBlock || '').trim();
  if (!source) return [];

  const rules: string[] = [];
  let buffer = '';
  let depth = 0;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    buffer += char;

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const rule = buffer.trim();
        if (rule) rules.push(rule);
        buffer = '';
      }
    }
  }

  const tail = buffer.trim();
  if (tail) rules.push(tail);

  return rules;
};

/**
 * 构建 CSS 规则级索引：
 * - 记录每条规则出现在哪些页面
 * - 保留首次出现的原始规则文本
 */
const buildRuleIndex = (pages: NormalizedStaticHtmlPage[]) => {
  const ruleToPages = new Map<string, Set<string>>();
  const normalizedToOriginal = new Map<string, string>();
  const pageRules = new Map<string, string[]>();

  pages.forEach((page) => {
    const pageRuleList: string[] = [];

    page.styleBlocks.forEach((block) => {
      splitCssRules(block).forEach((rule) => {
        const normalized = normalizeCssForCompare(rule);
        if (!normalized) return;

        pageRuleList.push(rule.trim());

        if (!normalizedToOriginal.has(normalized)) {
          normalizedToOriginal.set(normalized, rule.trim());
        }

        const pageSet = ruleToPages.get(normalized) || new Set<string>();
        pageSet.add(page.fileName);
        ruleToPages.set(normalized, pageSet);
      });
    });

    pageRules.set(page.fileName, pageRuleList);
  });

  return {
    ruleToPages,
    normalizedToOriginal,
    pageRules,
  };
};

/**
 * 规则级 CSS 拆分算法：
 * - 在 2 个及以上页面出现的规则 -> sharedCss
 * - 仅在单页出现的规则 -> pageSpecificCss[fileName]
 */
export const splitCssIntoSharedAndPage = (pages: NormalizedStaticHtmlPage[]): SplitCssResult => {
  const { ruleToPages, normalizedToOriginal, pageRules } = buildRuleIndex(pages);

  const sharedNormalized = new Set(
    Array.from(ruleToPages.entries())
      .filter(([, pageSet]) => pageSet.size > 1)
      .map(([normalized]) => normalized),
  );

  const sharedRules: string[] = [];
  sharedNormalized.forEach((normalized) => {
    const original = normalizedToOriginal.get(normalized);
    if (original) sharedRules.push(original);
  });

  const pageSpecificCss = new Map<string, string>();

  pages.forEach((page) => {
    const seenInPage = new Set<string>();
    const rules = pageRules.get(page.fileName) || [];

    const pageOnlyRules = rules.filter((rule) => {
      const normalized = normalizeCssForCompare(rule);
      if (!normalized || sharedNormalized.has(normalized) || seenInPage.has(normalized)) {
        return false;
      }
      seenInPage.add(normalized);
      return true;
    });

    pageSpecificCss.set(page.fileName, pageOnlyRules.join('\n\n'));
  });

  return {
    sharedCss: sharedRules.join('\n\n'),
    pageSpecificCss,
  };
};
