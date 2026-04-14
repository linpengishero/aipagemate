import { DEFAULT_EXAMPLE_IMAGE_PATH } from '../types';

/**
 * 在 template 代码块中统一替换图片绑定：
 * - src="..."
 * - :src="..."
 * - v-bind:src="..."
 */
const replaceTemplateImageSrc = (templateCode: string, imagePath: string) => {
  return templateCode
    .replace(/\s(?:v-bind:|:)?src\s*=\s*"[^"]*"/gi, ` src="${imagePath}"`)
    .replace(/\s(?:v-bind:|:)?src\s*=\s*'[^']*'/gi, ` src="${imagePath}"`);
};

/**
 * 步骤：规范化 SFC template 中的图片 src 到示例图。
 *
 * 设计约束：
 * - 仅处理 <template> 范围，避免误改 script/style 字符串。
 * - 为空代码直接返回，保持幂等。
 */
export const normalizeImageSrcStep = (
  sfcCode: string,
  imagePath = DEFAULT_EXAMPLE_IMAGE_PATH,
) => {
  if (!sfcCode) return sfcCode;

  return sfcCode.replace(/<template[\s\S]*?<\/template>/i, (templateBlock) => {
    return replaceTemplateImageSrc(templateBlock, imagePath);
  });
};
