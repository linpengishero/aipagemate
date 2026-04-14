/**
 * SEO 处理工具（aiweb原生实现）
 */

interface SEOData {
  title: string;
  description: string;
  keywords: string;
  additionalMeta?: Record<string, string>;
}

const escapeQuotes = (text: string) => (text || '').replace(/"/g, '\\"');

const generateSEOPrompt = (pageContent: string): string => `请分析以下网页内容，并生成适合的SEO元数据，包括标题、描述和关键词。
只返回JSON格式，不要有其他解释：
{
  "title": "页面标题 (不超过60字符)",
  "description": "页面描述 (不超过160字符)",
  "keywords": "关键词1,关键词2,关键词3 (5-8个关键词)"
}

页面内容：
${pageContent}`;

const parseSEOResponse = (aiResponse: string): SEOData | null => {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const seoData = JSON.parse(jsonMatch[0]);
    if (!seoData.title || !seoData.description || !seoData.keywords) return null;

    return seoData as SEOData;
  } catch {
    return null;
  }
};

const addSEOToHTML = (htmlCode: string, seoData: SEOData): string => {
  if (!htmlCode.includes('<head>')) return htmlCode;

  const seoTags = `
  <title>${seoData.title}</title>
  <meta name="description" content="${seoData.description}">
  <meta name="keywords" content="${seoData.keywords}">`;

  const additionalMetaTags = seoData.additionalMeta
    ? Object.entries(seoData.additionalMeta)
      .map(([name, content]) => `  <meta name="${name}" content="${content}">`)
      .join('\n')
    : '';

  return htmlCode.replace(/<head>/, `<head>${seoTags}\n${additionalMetaTags}`);
};

const addSEOToVue3 = (vueCode: string, seoData: SEOData): string => {
  if (vueCode.includes('__applySeoMeta(') || vueCode.includes('name="description"') || vueCode.includes("name='description'")) {
    return vueCode;
  }

  const seoRuntimeCode = `
const __applySeoMeta = () => {
  if (typeof document === 'undefined') return;
  if (typeof window !== 'undefined' && window.__AIWEB_DISABLE_RUNTIME_SEO__) return;

  document.title = "${escapeQuotes(seoData.title)}";

  const ensureMeta = (name, content) => {
    let el = document.head.querySelector(\`meta[name="\${name}"][data-aiweb-runtime-seo="true"]\`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('data-aiweb-runtime-seo', 'true');
      document.head.appendChild(el);
    }
    el.setAttribute('content', content || '');
  };

  ensureMeta('description', "${escapeQuotes(seoData.description)}");
  ensureMeta('keywords', "${escapeQuotes(seoData.keywords)}");
};

__applySeoMeta();
`;

  if (vueCode.includes('<script setup')) {
    return vueCode.replace(/<script setup([^>]*)>([\s\S]*?)<\/script>/, (_m, attrs, content) => {
      return `<script setup${attrs}>${seoRuntimeCode}\n${content}</script>`;
    });
  }

  if (vueCode.includes('<script')) {
    return vueCode.replace(/<script([^>]*)>([\s\S]*?)<\/script>/, (_m, attrs, content) => {
      return `<script${attrs}>${seoRuntimeCode}\n${content}</script>`;
    });
  }

  return `${vueCode}\n\n<script>${seoRuntimeCode}\nexport default { name: 'SeoPage' }\n</script>`;
};

const addSEOToCode = (code: string, framework?: 'html' | 'vue3' | 'react', seoData?: SEOData): string => {
  if (!seoData) return code;
  if (framework === 'html') return addSEOToHTML(code, seoData);
  if (framework === 'vue3') return addSEOToVue3(code, seoData);
  return code;
};

export const SEOProcessorTool = {
  generateSEOPrompt,
  parseSEOResponse,
  addSEOToCode,
};
