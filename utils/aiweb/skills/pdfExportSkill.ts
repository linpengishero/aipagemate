import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * PDF 导出技能参数。
 */
export interface DownloadPreviewPdfParams {
  /** iframe 文档对象（预览页 document） */
  iframeDocument: Document;
  /** 导出文件名（不含扩展名也可） */
  fileName?: string;
  /** 预览内容选择器，默认 .preview-content */
  contentSelector?: string;
}

/**
 * PDF 导出技能：
 * 将预览 DOM 内容渲染为图片，并分页写入 A4 PDF。
 */
const sanitizeUnsupportedColorFunctions = (root: Document) => {
  const styleTags = root.querySelectorAll('style');
  styleTags.forEach((tag) => {
    if (!tag.textContent) return;
    // html2canvas parser 对 oklch 支持不完整，导出时降级为可解析的 rgb。
    tag.textContent = tag.textContent.replace(/oklch\([^\)]*\)/gi, 'rgb(0, 0, 0)');
  });

  const styledNodes = root.querySelectorAll<HTMLElement>('[style]');
  styledNodes.forEach((node) => {
    const inlineStyle = node.getAttribute('style');
    if (!inlineStyle) return;
    node.setAttribute('style', inlineStyle.replace(/oklch\([^\)]*\)/gi, 'rgb(0, 0, 0)'));
  });
};

const renderPreviewToCanvas = async (previewContent: HTMLElement) => {
  try {
    // 优先走 foreignObjectRendering，提高对现代 CSS（含 Tailwind 颜色函数）的兼容性。
    return await html2canvas(previewContent, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      foreignObjectRendering: true,
      windowWidth: previewContent.scrollWidth,
      windowHeight: previewContent.scrollHeight,
    });
  } catch (error: any) {
    const message = String(error?.message || error || '');
    if (!/oklch/i.test(message)) {
      throw error;
    }

    // 遇到 oklch 解析异常时，降级替换后重试。
    return await html2canvas(previewContent, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: previewContent.scrollWidth,
      windowHeight: previewContent.scrollHeight,
      onclone: (clonedDoc) => {
        sanitizeUnsupportedColorFunctions(clonedDoc);
      },
    });
  }
};

export const downloadPreviewAsPdf = async ({
  iframeDocument,
  fileName = 'web-preview',
  contentSelector = '.preview-content',
}: DownloadPreviewPdfParams) => {
  const previewContent = iframeDocument.querySelector(contentSelector) as HTMLElement | null;

  if (!previewContent) {
    throw new Error('Preview content not found.');
  }

  const canvas = await renderPreviewToCanvas(previewContent);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  const finalName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(finalName);
};
