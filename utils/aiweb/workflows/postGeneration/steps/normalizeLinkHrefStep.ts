const PLACEHOLDER_PREFIX = '__PAGE_LINK_';

const isSafePlaceholderLink = (hrefValue: string) => {
  return hrefValue.startsWith(PLACEHOLDER_PREFIX);
};

const isAllowedSpecialLink = (hrefValue: string) => {
  const raw = hrefValue.trim().toLowerCase();
  return (
    raw === '#' ||
    raw.startsWith('#') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:')
  );
};

const normalizeTemplateHref = (templateCode: string) => {
  return templateCode.replace(/href\s*=\s*(["'])([^"']*)\1/gi, (_full, quote: string, hrefValue: string) => {
    const raw = String(hrefValue || '').trim();

    if (!raw) {
      return `href=${quote}#${quote}`;
    }

    if (isSafePlaceholderLink(raw) || isAllowedSpecialLink(raw)) {
      return `href=${quote}${raw}${quote}`;
    }

    return `href=${quote}#${quote}`;
  });
};

/**
 * 步骤：规范化 template 中的链接 href。
 *
 * 规则：
 * - 允许页面占位符链接：__PAGE_LINK_xxx
 * - 允许锚点/邮件/电话链接：#, #xxx, mailto:, tel:
 * - 其余链接（含 http/https/相对路径）统一替换为 #
 */
export const normalizeLinkHrefStep = (sfcCode: string) => {
  if (!sfcCode) return sfcCode;

  return sfcCode.replace(/<template[\s\S]*?<\/template>/i, (templateBlock) => {
    return normalizeTemplateHref(templateBlock);
  });
};
