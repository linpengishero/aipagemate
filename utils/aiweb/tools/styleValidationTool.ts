/**
 * 样式校验工具：检测生成代码里是否存在有效的 <style> 内容。
 */
export const hasMeaningfulStyleBlock = (code: string) => {
  const matches = Array.from(code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g));
  if (!matches.length) return false;

  return matches.some((match) => {
    const styleText = (match[1] || "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .trim();
    return styleText.length > 0;
  });
};
