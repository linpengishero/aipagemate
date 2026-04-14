import { parse } from '@vue/compiler-sfc';

/**
 * 轻量 SFC 规范化：
 * - 若是 HTML 片段，则包装为标准 SFC
 * - 若缺少 <script> / <style>，自动补齐最小块
 */
export const normalizeToSafeSfc = (rawCode: string): string => {
  const code = (rawCode || '').trim();

  if (!code) {
    return `<template>\n  <div class="page-root"></div>\n</template>\n\n<script setup lang="ts">\n</script>\n\n<style scoped>\n.page-root {}\n</style>`;
  }

  // 非 SFC（纯 HTML）包装
  const looksLikeSfc = code.includes('<template') || code.includes('<script') || code.includes('<style');
  if (!looksLikeSfc) {
    return `<template>\n  <div class="page-root">\n${code}\n  </div>\n</template>\n\n<script setup lang="ts">\n</script>\n\n<style scoped>\n.page-root {}\n</style>`;
  }

  let output = code;

  if (!output.includes('<template')) {
    output = `<template>\n  <div class="page-root"></div>\n</template>\n\n${output}`;
  }

  if (!output.includes('<script')) {
    output = `${output}\n\n<script setup lang="ts">\n</script>`;
  }

  if (!output.includes('<style')) {
    output = `${output}\n\n<style scoped>\n.page-root {}\n</style>`;
  }

  // 最后做一次 parse 验证；失败时兜底为最小安全SFC
  try {
    const { errors } = parse(output, { filename: 'normalize-preview.vue' });
    if (errors && errors.length > 0) {
      return `<template>\n  <div class="page-root">\n${escapeHtml(code)}\n  </div>\n</template>\n\n<script setup lang="ts">\n</script>\n\n<style scoped>\n.page-root { white-space: pre-wrap; }\n</style>`;
    }
    return output;
  } catch {
    return `<template>\n  <div class="page-root">\n${escapeHtml(code)}\n  </div>\n</template>\n\n<script setup lang="ts">\n</script>\n\n<style scoped>\n.page-root { white-space: pre-wrap; }\n</style>`;
  }
};

const escapeHtml = (content: string) => content
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
