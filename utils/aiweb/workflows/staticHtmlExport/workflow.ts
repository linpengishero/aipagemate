import JSZip from 'jszip';
import { ImageExporter, CodeProcessorTool } from '~/utils/aiweb/tools';
import { downloadHtmlProject } from '~/utils/aiweb/skills';
import type { PackageProjectContext, PackageWorkflowResponse } from '~/utils/aiweb/workflows/packageProject/types';
import { normalizePagesForStaticHtml, safeName } from './utils/normalizers';
import { splitCssIntoSharedAndPage } from './utils/cssSplitter';

/** 将模块导出语法转为可在浏览器直接执行的对象声明 */
const stripModuleExport = (script: string) => {
  return script
    .replace(/export\s+default\s*\{/g, 'const __pageModule = {')
    .replace(/module\.exports\s*=\s*\{/g, 'const __pageModule = {');
};

/** 安全读取对象路径（a.b.c） */
const getByPath = (obj: Record<string, any>, path: string) => {
  return path.split('.').reduce<any>((acc, key) => (acc && key in acc ? acc[key] : undefined), obj);
};

/** 从脚本块中尽力提取 data() 返回对象，供 mustache/v-for 静态渲染使用 */
const parseDataModelFromScripts = (scriptBlocks: string[]) => {
  const joined = scriptBlocks.join('\n\n');
  const dataMatch = joined.match(/data\s*\(\)\s*\{[\s\S]*?return\s*(\{[\s\S]*?\})\s*;?[\s\S]*?\}/i);
  if (!dataMatch?.[1]) return {} as Record<string, any>;

  try {
    const parsed = new Function(`return (${dataMatch[1]});`)();
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

/** 使用 data 模型替换 {{ ... }} 插值 */
const replaceMustacheWithData = (html: string, model: Record<string, any>) => {
  return html.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_m, expr) => {
    const key = String(expr || '').trim();
    const value = getByPath(model, key);
    if (value === undefined || value === null) return '';
    return String(value);
  });
};

/**
 * 处理简单 v-for（item in list）场景，渲染为重复静态节点。
 * 说明：仅覆盖常见列表模板，不尝试完整 Vue 编译能力。
 */
const renderSimpleVFor = (html: string, model: Record<string, any>) => {
  const vForRegex = /<([a-zA-Z][^\s/>]*)([^>]*?)\s+v-for\s*=\s*"([a-zA-Z_$][\w$]*)\s+in\s+([a-zA-Z0-9_$.]+)"([^>]*)>([\s\S]*?)<\/\1>/g;

  return html.replace(vForRegex, (_m, tag, beforeAttrs, itemVar, listPath, afterAttrs, inner) => {
    const list = getByPath(model, listPath);
    if (!Array.isArray(list) || list.length === 0) return '';

    const attrs = `${beforeAttrs || ''} ${afterAttrs || ''}`.replace(/\s+v-for\s*=\s*"[^"]+"/g, '').trim();

    return list
      .map((item) => {
        const renderedInner = inner.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_mm, expr) => {
          const raw = String(expr || '').trim();
          const normalized = raw.startsWith(`${itemVar}.`) ? raw.slice(itemVar.length + 1) : raw;
          const value = raw === itemVar ? item : getByPath(item, normalized);
          if (value === undefined || value === null) return '';
          return String(value);
        });
        return `<${tag}${attrs ? ` ${attrs}` : ''}>${renderedInner}</${tag}>`;
      })
      .join('');
  });
};

/** 移除无法在纯 HTML 中生效的 Vue 指令与绑定 */
const stripVueTemplateSyntax = (html: string) => {
  return html
    .replace(/\s+v-(?:if|else-if|else|show|once|cloak|html|text|model|bind:[^=\s]+|on:[^=\s]+|slot:[^=\s]+)\s*=\s*"[^"]*"/g, '')
    .replace(/\s+:[a-zA-Z0-9_-]+\s*=\s*"[^"]*"/g, '')
    .replace(/\s+@[a-zA-Z0-9_.:-]+\s*=\s*"[^"]*"/g, '')
    .replace(/\s+v-for\s*=\s*"[^"]*"/g, '');
};

/**
 * 将常见 Vue 模板语法降级为静态 HTML：
 * - v-for（简单模式）
 * - mustache 插值
 * - 指令/绑定属性剥离
 */
const renderVueSyntaxToStaticHtml = (html: string, scriptBlocks: string[]) => {
  const model = parseDataModelFromScripts(scriptBlocks);
  let result = html;
  result = renderSimpleVFor(result, model);
  result = replaceMustacheWithData(result, model);
  result = stripVueTemplateSyntax(result);
  // 兜底：彻底移除残留 mustache，避免页面出现 {{ xxx }}
  result = result.replace(/\{\{[\s\S]*?\}\}/g, '');
  return result;
};

const buildJQueryScript = (scriptBlocks: string[]): string => {
  if (!scriptBlocks.length) return '';

  const rawScript = scriptBlocks.join('\n\n');
  const transformed = stripModuleExport(rawScript).trim();

  return `/* Auto-transformed from Vue/runtime script blocks for static HTML */
(function () {
  if (typeof window === 'undefined') return;

  const runMounted = (moduleLike) => {
    try {
      const mounted = moduleLike?.mounted;
      if (typeof mounted === 'function') {
        mounted.call(window.__AIWEB_STATIC_PAGE_STATE__ || {});
      }
    } catch (error) {
      console.warn('[aiweb][static-html] mounted execution failed:', error);
    }
  };

  const bindMethods = (moduleLike) => {
    if (!moduleLike || typeof moduleLike !== 'object') return;

    const methods = moduleLike.methods || {};
    if (!methods || typeof methods !== 'object') return;

    window.__AIWEB_STATIC_PAGE_METHODS__ = window.__AIWEB_STATIC_PAGE_METHODS__ || {};

    Object.keys(methods).forEach((key) => {
      const fn = methods[key];
      if (typeof fn === 'function') {
        window.__AIWEB_STATIC_PAGE_METHODS__[key] = fn.bind(window.__AIWEB_STATIC_PAGE_STATE__ || {});
      }
    });
  };

  window.__AIWEB_STATIC_PAGE_STATE__ = window.__AIWEB_STATIC_PAGE_STATE__ || {};

  ${transformed}

  if (typeof __pageModule === 'object' && __pageModule) {
    if (typeof __pageModule.data === 'function') {
      try {
        window.__AIWEB_STATIC_PAGE_STATE__ = {
          ...window.__AIWEB_STATIC_PAGE_STATE__,
          ...(__pageModule.data() || {}),
        };
      } catch (error) {
        console.warn('[aiweb][static-html] data init failed:', error);
      }
    }

    bindMethods(__pageModule);

    if (window.jQuery) {
      window.jQuery(function () {
        runMounted(__pageModule);
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => runMounted(__pageModule));
    }
  }
})();`;
};

const buildHtmlDocument = (title: string, bodyHtml: string, sharedCssPath: string, pageCssPath: string, pageJsPath: string, options: PackageProjectContext['options']) => {
  const metadata = options.metadata || {};
  const seoTags = options.seoSupport
    ? `
  <meta name="description" content="${metadata.description || ''}">
  <meta name="keywords" content="${metadata.keywords || ''}">
  <meta name="author" content="${metadata.author || ''}">`
    : '';

  return CodeProcessorTool.formatHtmlCode(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>${seoTags}
  <link rel="stylesheet" href="${sharedCssPath}">
  <link rel="stylesheet" href="${pageCssPath}">
</head>
<body>
${bodyHtml}
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="${pageJsPath}"></script>
</body>
</html>`);
};

const buildStaticHtmlZip = async (context: PackageProjectContext): Promise<Blob> => {
  const pages = normalizePagesForStaticHtml(context.pages);
  const { sharedCss, pageSpecificCss } = splitCssIntoSharedAndPage(pages);

  const exporter = new ImageExporter();
  const zip = new JSZip();

  const cssFolder = zip.folder('css');
  const jsFolder = zip.folder('js');
  const imagesFolder = zip.folder('images');

  if (!cssFolder || !jsFolder || !imagesFolder) {
    throw new Error('Failed to create static HTML package folders.');
  }

  cssFolder.file('style.css', sharedCss || '');

  pages.forEach((page, index) => {
    const fileBase = safeName(page.name || `page-${index + 1}`) || `page-${index + 1}`;
    const pageCssName = `${fileBase}.css`;
    const pageJsName = `${fileBase}.js`;

    const staticResolvedBody = renderVueSyntaxToStaticHtml(page.bodyHtml, page.scriptBlocks);
    const processedBody = exporter.postprocessCode(exporter.preprocessCode(staticResolvedBody), 'html');
    const formattedBody = CodeProcessorTool.formatHtmlCode(processedBody);

    const pageCss = pageSpecificCss.get(page.fileName) || '';
    cssFolder.file(pageCssName, pageCss);

    const pageJs = buildJQueryScript(page.scriptBlocks);
    jsFolder.file(pageJsName, pageJs || '');

    const html = buildHtmlDocument(
      page.title,
      formattedBody,
      './css/style.css',
      `./css/${pageCssName}`,
      `./js/${pageJsName}`,
      context.options,
    );

    zip.file(page.fileName, html);
  });

  await Promise.all(
    Array.from(exporter.imageCacheMap.entries()).map(async ([cacheId, imageData]) => {
      const blob = await exporter.base64ToBlob(imageData.base64Data, `image/${imageData.type}`);
      imagesFolder.file(`img_${cacheId}.${imageData.type}`, blob);
    }),
  );

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
};

export const runStaticHtmlExportWorkflow = async (
  context: PackageProjectContext,
): Promise<PackageWorkflowResponse> => {
  try {
    const zipBlob = await buildStaticHtmlZip(context);
    const fileName = `${context.options.projectName}-html.zip`;

    return {
      ok: true,
      data: {
        zipBlob,
        fileName,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      code: 'PACKAGE_BUILD_FAILED',
      error: error?.message || 'Failed to build static HTML package.',
    };
  }
};

export const downloadStaticHtmlExportPackage = (zipBlob: Blob, projectName: string) => {
  try {
    downloadHtmlProject(zipBlob, projectName);
    return { ok: true as const };
  } catch (error: any) {
    return {
      ok: false as const,
      code: 'PACKAGE_DOWNLOAD_FAILED' as const,
      error: error?.message || 'Failed to download static HTML package.',
    };
  }
};
