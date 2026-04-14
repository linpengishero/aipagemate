import type { PageData } from '~/utils/aiweb/skills/htmlProjectExportSkill';
import {
  PAGE_LINK_PLACEHOLDER_REGEX,
  PAGE_LINK_PLACEHOLDER_PREFIX,
  PAGE_LINK_HOME_PLACEHOLDER,
  PAGE_LINK_INDEX_PLACEHOLDER,
} from '~/utils/aiweb/placeholders';

export interface NormalizedStaticHtmlPage {
  name: string;
  title: string;
  fileBase: string;
  fileName: string;
  bodyHtml: string;
  styleBlocks: string[];
  scriptBlocks: string[];
  warnings: string[];
}

/** 文件名安全化（与导出文件名规则保持一致） */
export const safeName = (value: string) => value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/** 由页面名推导链接占位符 token（例：Feature Dashboard -> __PAGE_LINK_FEATURE_DASHBOARD__） */
const toPlaceholderToken = (value: string) => {
  const slug = safeName(value).replace(/-+/g, '_').toUpperCase();
  return slug ? `${PAGE_LINK_PLACEHOLDER_PREFIX}${slug}__` : '';
};

/** 提取指定标签内部内容（首个匹配） */
const extractTagInner = (source: string, tag: string): string | null => {
  const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim() || null;
};

/** 收集某标签的全部原始 block（含标签本身） */
const collectTagBlocks = (source: string, tag: string): string[] => {
  const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
  return source.match(regex) || [];
};

/** 从原始 block 中提取内容（去掉开始/结束标签） */
const extractBlockContent = (block: string, tag: string) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim() || '';
};

/** 移除指定标签 block，返回清理后的代码与移除数量 */
const removeTagBlocks = (source: string, tag: string): { code: string; removed: number } => {
  const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
  const matches = source.match(regex) || [];
  return {
    code: source.replace(regex, ''),
    removed: matches.length,
  };
};

/** 构建占位符到导出文件路径的映射表 */
const buildPlaceholderPathMap = (pages: PageData[]) => {
  const map = new Map<string, string>();

  pages.forEach((page, index) => {
    const fileBase = safeName(page.name || `page-${index + 1}`) || `page-${index + 1}`;
    const fileName = index === 0 ? 'index.html' : `${fileBase}.html`;
    const token = toPlaceholderToken(page.name || fileBase);

    if (token) map.set(token, `./${fileName}`);

    if (index === 0) {
      map.set(PAGE_LINK_HOME_PLACEHOLDER, './index.html');
      map.set(PAGE_LINK_INDEX_PLACEHOLDER, './index.html');
    }
  });

  return map;
};

/** 替换页面链接占位符，并收集未解析 token */
const resolvePlaceholders = (
  source: string,
  map: Map<string, string>,
): { value: string; unresolved: string[] } => {
  const unresolved = new Set<string>();
  const replaced = source.replace(PAGE_LINK_PLACEHOLDER_REGEX, (token) => {
    const target = map.get(token);
    if (target) return target;
    unresolved.add(token);
    return token;
  });
  return {
    value: replaced,
    unresolved: Array.from(unresolved),
  };
};

/** 单页规范化：识别 HTML/SFC、提取 body/style/script、处理占位符并汇总告警 */
const normalizeSinglePage = (
  page: PageData,
  index: number,
  placeholderMap: Map<string, string>,
): NormalizedStaticHtmlPage => {
  const warnings: string[] = [];
  const source = (page.content || '').replace(/^\uFEFF/, '').trim();

  const fileBase = safeName(page.name || `page-${index + 1}`) || `page-${index + 1}`;
  const fileName = index === 0 ? 'index.html' : `${fileBase}.html`;

  if (!source) {
    warnings.push('Empty content detected. Exported fallback placeholder.');
    return {
      name: page.name,
      title: page.name || fileBase,
      fileBase,
      fileName,
      bodyHtml: '<section></section>',
      styleBlocks: [],
      scriptBlocks: [],
      warnings,
    };
  }

  const hasHtmlDocument = /<!doctype\s+html|<html[\s>]/i.test(source);
  const hasSfcTemplate = /<template[\s>]/i.test(source);

  let htmlFragment = source;
  const styleBlocks: string[] = [];
  const scriptBlocks: string[] = [];

  if (hasHtmlDocument) {
    htmlFragment = extractTagInner(source, 'body') || source;
    styleBlocks.push(...collectTagBlocks(source, 'style').map((item) => extractBlockContent(item, 'style')).filter(Boolean));
    scriptBlocks.push(...collectTagBlocks(source, 'script').map((item) => extractBlockContent(item, 'script')).filter(Boolean));
    warnings.push('Detected full HTML document. Extracted <body> content for packaging.');
  }

  if (hasSfcTemplate) {
    const templateInner = extractTagInner(source, 'template');
    if (templateInner) {
      htmlFragment = templateInner;
      warnings.push('Detected Vue SFC content. Extracted <template> content for static HTML.');
    }

    styleBlocks.push(...collectTagBlocks(source, 'style').map((item) => extractBlockContent(item, 'style')).filter(Boolean));
    scriptBlocks.push(...collectTagBlocks(source, 'script').map((item) => extractBlockContent(item, 'script')).filter(Boolean));
  }

  const scriptRemoved = removeTagBlocks(htmlFragment, 'script');
  htmlFragment = scriptRemoved.code;
  if (scriptRemoved.removed > 0) {
    warnings.push(`Removed ${scriptRemoved.removed} inline <script> block(s) from body HTML.`);
  }

  htmlFragment = htmlFragment
    .replace(/<\/?template[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .trim();

  const htmlResolved = resolvePlaceholders(htmlFragment, placeholderMap);
  const scriptResolved = scriptBlocks.map((block) => resolvePlaceholders(block, placeholderMap));

  const unresolved = [...htmlResolved.unresolved, ...scriptResolved.flatMap((item) => item.unresolved)];
  if (unresolved.length > 0) {
    warnings.push(`Unresolved page link placeholder(s): ${Array.from(new Set(unresolved)).join(', ')}`);
  }

  return {
    name: page.name,
    title: page.name || fileBase,
    fileBase,
    fileName,
    bodyHtml: htmlResolved.value || '<section></section>',
    styleBlocks: Array.from(new Set(styleBlocks.map((item) => item.trim()).filter(Boolean))),
    scriptBlocks: scriptResolved.map((item) => item.value).filter(Boolean),
    warnings,
  };
};

/**
 * staticHtmlExport 入口：
 * 将页面集合规范化为可直接组装静态 HTML 的结构化数据。
 */
export const normalizePagesForStaticHtml = (pages: PageData[]): NormalizedStaticHtmlPage[] => {
  const placeholderMap = buildPlaceholderPathMap(pages);
  return pages.map((page, index) => normalizeSinglePage(page, index, placeholderMap));
};
