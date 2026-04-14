/**
 * 预览DOM工具
 */

/**
 * 从当前预览DOM提取代码（保留原style块）
 */
export function extractCodeFromDOM(
  previewContainer: HTMLElement | null,
  currentSourceCode: string,
): string {
  if (!previewContainer) {
    return currentSourceCode;
  }

  try {
    const contentEl = previewContainer.querySelector('.preview-content') as HTMLElement | null;
    if (!contentEl) {
      return currentSourceCode;
    }

    const cloned = contentEl.cloneNode(true) as HTMLElement;
    cloned.querySelectorAll('.element-highlight, .element-selected, .editable-text').forEach((el) => {
      el.classList.remove('element-highlight', 'element-selected', 'editable-text');
    });

    const updatedHtml = cloned.innerHTML;
    const styleMatch = currentSourceCode.match(/<style[\s\S]*?<\/style>/i);
    const styleBlock = styleMatch ? styleMatch[0] : '<style></style>';

    return `<template>\n  <div class="static-page">\n    ${updatedHtml}\n  </div>\n</template>\n\n${styleBlock}`;
  } catch {
    return currentSourceCode;
  }
}

/**
 * 获取图片URL
 */
export function getImageUrl(element: HTMLElement): string {
  if (element.tagName === 'IMG') {
    return element.getAttribute('src') || '';
  }

  const bg = window.getComputedStyle(element).backgroundImage;
  if (!bg || bg === 'none') return '';

  const match = bg.match(/^url\(["']?(.*?)["']?\)$/);
  return match?.[1] || '';
}

/**
 * 应用图片到元素
 */
export function applyImageToElement(
  element: HTMLElement,
  imageUrl: string,
  style: { borderRadius: string; opacity: string; backgroundColor?: string },
): void {
  element.style.borderRadius = style.borderRadius;
  element.style.opacity = style.opacity;

  if (style.backgroundColor !== undefined) {
    element.style.backgroundColor = style.backgroundColor;
  }

  if (element.tagName === 'IMG' && imageUrl) {
    element.setAttribute('src', imageUrl);
  } else if (imageUrl) {
    element.style.backgroundImage = `url('${imageUrl}')`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
  }
}

/**
 * 是否链接元素
 */
export function isLinkElement(element: HTMLElement): boolean {
  return element.tagName === 'A';
}

/**
 * 设置链接属性
 */
export function setLinkAttributes(
  element: HTMLElement,
  attributes: { href?: string; target?: string },
): void {
  if (!isLinkElement(element)) return;

  if (attributes.href !== undefined) {
    element.setAttribute('href', attributes.href || '#');
  }

  if (attributes.target !== undefined) {
    element.setAttribute('target', attributes.target || '_self');
  }
}

/**
 * 应用样式到元素
 */
export function applyStylesToElement(
  element: HTMLElement,
  styles: Record<string, string | undefined>,
): void {
  Object.entries(styles).forEach(([key, value]) => {
    if (value !== undefined) {
      (element.style as any)[key] = value;
    }
  });
}
