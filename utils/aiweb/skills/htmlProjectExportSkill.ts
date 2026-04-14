import JSZip from 'jszip';
import { ImageExporter, CodeProcessorTool } from '~/utils/aiweb/tools';

export interface PageData {
  name: string;
  content: string;
}

export interface HtmlExportOptions {
  seoSupport?: boolean;
  metadata?: {
    description?: string;
    author?: string;
    keywords?: string;
  };
}

const safeName = (value: string) => value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const wrapHtml = (title: string, content: string, options: HtmlExportOptions) => {
  const metadata = options.metadata || {};
  const seoTags = options.seoSupport
    ? `
    <meta name="description" content="${metadata.description || ''}">
    <meta name="keywords" content="${metadata.keywords || ''}">
    <meta name="author" content="${metadata.author || ''}">`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>${seoTags}
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
  <main>
${content}
  </main>
  <script src="./js/main.js"></script>
</body>
</html>`;
};

const createBaseCss = () => `
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, Arial, sans-serif; color: #111827; background: #ffffff; }
main { max-width: 1200px; margin: 0 auto; padding: 24px; }
img { max-width: 100%; height: auto; display: block; }
`;

const createBaseJs = () => `
document.addEventListener('DOMContentLoaded', () => {
  console.log('HTML project ready');
});
`;

export async function generateHtmlProject(
  _projectName: string,
  pages: PageData[],
  options: HtmlExportOptions = {}
): Promise<Blob> {
  const zip = new JSZip();
  const cssFolder = zip.folder('css');
  const jsFolder = zip.folder('js');
  const imagesFolder = zip.folder('images');

  if (!cssFolder || !jsFolder || !imagesFolder) {
    throw new Error('Failed to create project folders.');
  }

  cssFolder.file('style.css', createBaseCss());
  jsFolder.file('main.js', createBaseJs());

  const exporter = new ImageExporter();

  pages.forEach((page, index) => {
    const fileBase = safeName(page.name || `page-${index + 1}`) || `page-${index + 1}`;
    const fileName = index === 0 ? 'index.html' : `${fileBase}.html`;

    const preprocessed = exporter.preprocessCode(page.content || '');
    const htmlContent = CodeProcessorTool.formatHtmlCode(exporter.postprocessCode(preprocessed, 'html'));
    const fullHtml = wrapHtml(page.name || fileBase, htmlContent, options);

    zip.file(fileName, fullHtml);
  });

  await Promise.all(
    Array.from(exporter.imageCacheMap.entries()).map(async ([cacheId, imageData]) => {
      const blob = await exporter.base64ToBlob(imageData.base64Data, `image/${imageData.type}`);
      imagesFolder.file(`img_${cacheId}.${imageData.type}`, blob);
    })
  );

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

export function downloadHtmlProject(zipBlob: Blob, projectName: string): void {
  const name = safeName(projectName || 'html-project') || 'html-project';
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-html.zip`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
