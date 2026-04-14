/**
 * AIWeb 全局占位符常量中心
 *
 * 说明：
 * - 页面链接占位符：用于页面间跳转占位后再统一替换
 * - 图片占位符：用于导出流程中 base64 资源抽取与回填
 */

/** 页面链接占位符前缀（例：__PAGE_LINK_FEATURE_DASHBOARD__） */
export const PAGE_LINK_PLACEHOLDER_PREFIX = '__PAGE_LINK_';

/** 页面链接占位符匹配规则 */
export const PAGE_LINK_PLACEHOLDER_REGEX = /__PAGE_LINK_[A-Z0-9_]+__/g;

/** 首页占位符别名 */
export const PAGE_LINK_HOME_PLACEHOLDER = '__PAGE_LINK_HOME__';
export const PAGE_LINK_INDEX_PLACEHOLDER = '__PAGE_LINK_INDEX__';

/** 图片占位符前缀 */
export const IMAGE_PLACEHOLDER_PREFIX = 'IMG_';

/** 图片占位符分类前缀（导出链路中使用） */
export const IMAGE_PLACEHOLDER_CSS_PREFIX = `URL_${IMAGE_PLACEHOLDER_PREFIX}`;
export const IMAGE_PLACEHOLDER_HTML_PREFIX = `HTML_${IMAGE_PLACEHOLDER_PREFIX}`;
export const IMAGE_PLACEHOLDER_JS_PREFIX = `JS_${IMAGE_PLACEHOLDER_PREFIX}`;
export const IMAGE_PLACEHOLDER_INLINE_PREFIX = `INLINE_${IMAGE_PLACEHOLDER_PREFIX}`;

/** 图片占位符匹配 */
export const IMAGE_PLACEHOLDER_REGEX = /(?:URL|HTML|JS|INLINE)_IMG_[^)"']+/g;
