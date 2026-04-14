/**
 * 代码处理工具（aiweb原生实现）
 */

const validateVueCode = (code: string): { isValid: boolean; error?: string } => {
  try {
    if (!code.includes('<template')) return { isValid: false, error: 'Vue SFC missing <template>' };
    const hasScript = code.includes('<script');
    if (!hasScript) return { isValid: false, error: 'Vue SFC missing <script>' };

    const templateOpen = (code.match(/<template[\s>]/g) || []).length;
    const templateClose = (code.match(/<\/template>/g) || []).length;
    if (templateOpen !== templateClose) return { isValid: false, error: 'Unclosed template tag' };

    const scriptOpen = (code.match(/<script[\s>]/g) || []).length;
    const scriptClose = (code.match(/<\/script>/g) || []).length;
    if (scriptOpen !== scriptClose) return { isValid: false, error: 'Unclosed script tag' };

    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, error: error?.message || String(error) };
  }
};

const validateReactCode = (code: string): { isValid: boolean; error?: string } => {
  try {
    if (!code.includes('export default')) return { isValid: false, error: 'React code missing export default' };
    if (!code.includes('return') && !code.includes('=>')) return { isValid: false, error: 'React code missing render return' };
    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, error: error?.message || String(error) };
  }
};

const formatCode = (code: string, type: 'html' | 'css' | 'js' = 'html'): string => {
  if (!code) return '';
  if (type === 'js') return code.trim();

  const lines = code.replace(/\r\n/g, '\n').split('\n').map(l => l.trim());
  return lines.filter(Boolean).join('\n');
};

const formatHtmlCode = (htmlCode: string): string => formatCode(htmlCode, 'html');

const generateCompleteHtml = (content: string): string => {
  if (content.includes('<!DOCTYPE html>') || (content.includes('<html') && !content.includes('<template'))) {
    return formatHtmlCode(content);
  }

  let htmlContent = content;
  let styleContent = '';

  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/i);
  if (templateMatch?.[1]) htmlContent = templateMatch[1].trim();

  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch?.[1]) styleContent = styleMatch[1].trim();

  return formatHtmlCode(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export Page</title>
  <style>
${styleContent}
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`);
};

const generateExportDescription = (settings: {
  framework: string;
  cssFramework: string;
  generateSEO?: boolean;
  typescriptSupport?: boolean;
}): string => {
  const frameworkLabels: Record<string, string> = {
    vue3: 'Vue 3',
    vue2: 'Vue 2',
    react: 'React',
    html: 'HTML',
  };

  const cssLabels: Record<string, string> = {
    css: 'Native CSS',
    tailwindcss: 'Tailwind CSS',
    unocss: 'UnoCSS',
    scss: 'SCSS',
  };

  let desc = `convert code to ${frameworkLabels[settings.framework] || settings.framework}`;

  if (settings.typescriptSupport && settings.framework === 'vue3') {
    desc += ' (TypeScript)';
  }

  if (settings.cssFramework !== 'css') {
    desc += ` with ${cssLabels[settings.cssFramework] || settings.cssFramework}`;
  }

  if (settings.generateSEO) {
    desc += ' and SEO metadata';
  }

  return desc;
};

const extractCodeParts = (code: string): { template: string; script: string; style: string } => {
  const template = code.match(/<template>([\s\S]*?)<\/template>/i)?.[1]?.trim() || '';
  const script = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim() || '';
  const style = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1]?.trim() || '';
  return { template, script, style };
};

export const CodeProcessorTool = {
  validateVueCode,
  validateReactCode,
  formatCode,
  formatHtmlCode,
  generateCompleteHtml,
  generateExportDescription,
  extractCodeParts,
};
