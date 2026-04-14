/**
 * WebInspector - 网页元素检查器工具（兼容旧版交互行为）
 * 提供元素悬停虚线高亮、选择和检查功能
 */

export interface HighlightInfo {
  show: boolean;
  tagName: string;
  id: string;
  className: string;
  element: HTMLElement | null;
}

const HIGHLIGHT_STYLES = `
  .element-highlight {
    outline: 2px dashed rgba(59, 130, 246, 0.8) !important;
    outline-offset: 2px !important;
    position: relative;
    transition: outline-color 0.2s ease;
  }

  .element-selected {
    outline: 2px solid rgba(236, 72, 153, 0.8) !important;
    outline-offset: 2px !important;
    position: relative;
  }

  .element-highlight::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    z-index: 1;
  }

  .element-selected::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(236, 72, 153, 0.1);
    pointer-events: none;
    z-index: 1;
  }

  img.element-highlight, .placeholder-image.element-highlight {
    outline: 2px dashed rgba(16, 185, 129, 0.8) !important;
  }

  img.element-highlight::before, .placeholder-image.element-highlight::before {
    background-color: rgba(16, 185, 129, 0.1);
  }

  img.element-selected, .placeholder-image.element-selected {
    outline: 2px solid rgba(16, 185, 129, 0.8) !important;
  }

  img.element-selected::before, .placeholder-image.element-selected::before {
    background-color: rgba(16, 185, 129, 0.1);
  }

  .editable-text {
    cursor: pointer;
  }

  .editable-text:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }
`;

export function sanitizeInspectorClasses(code: string): string {
  code = code.replace(/\s*title="双击编辑此元素"/g, '');
  code = code.replace(/\s*class="[^"]*(element-highlight|element-selected|editable-text)[^"]*"/g, (match) => {
    const classMatch = match.match(/class="([^"]*)"/);
    const classText = classMatch?.[1] || '';
    const classes = classText.split(/\s+/).filter(Boolean);
    const remainingClasses = classes.filter(cls => !['element-highlight', 'element-selected', 'editable-text'].includes(cls));
    return remainingClasses.length > 0 ? ` class="${remainingClasses.join(' ')}"` : '';
  });
  return code;
}

export function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(59, 130, 246, 0.9);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 9999;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

export function isTextNodeElement(element: HTMLElement): boolean {
  const textElements = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'LI', 'A', 'BUTTON', 'LABEL'];
  const tagName = element.tagName;

  if (textElements.includes(tagName)) {
    const hasOnlyTextOrSimpleChildren =
      element.childNodes.length === 0 ||
      (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) ||
      !element.querySelector('div, section, article, nav');

    return hasOnlyTextOrSimpleChildren;
  }

  return false;
}

export function isImageElement(element: HTMLElement): boolean {
  return element.tagName === 'IMG';
}

export function updateHighlightInfo(element: HTMLElement, highlightInfo: HighlightInfo): void {
  const tagName = element.tagName.toLowerCase();
  const id = element.id;
  const className = element.className.toString()
    .replace('element-highlight', '')
    .replace('element-selected', '')
    .trim();

  highlightInfo.show = true;
  highlightInfo.tagName = tagName;
  highlightInfo.id = id;
  highlightInfo.className = className;
  highlightInfo.element = element;
}

export function addHighlightStyles(): void {
  if (document.getElementById('highlight-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'highlight-styles';
  styleEl.textContent = HIGHLIGHT_STYLES;
  document.head.appendChild(styleEl);
}

export function removeAllHighlights(): void {
  document.querySelectorAll('.element-highlight, .element-selected').forEach(el => {
    el.classList.remove('element-highlight', 'element-selected');
  });
}

export function resetHighlightState(highlightInfo: HighlightInfo): void {
  highlightInfo.show = false;
  highlightInfo.tagName = '';
  highlightInfo.id = '';
  highlightInfo.className = '';
  highlightInfo.element = null;
}

export class WebInspector {
  private container: HTMLElement | null = null;
  private highlightInfo: HighlightInfo;
  private isActive = false;
  private mouseMoveFn: ((event: MouseEvent) => void) | null = null;
  private clickFn: ((event: MouseEvent) => void) | null = null;
  private dblClickFn: ((event: MouseEvent) => void) | null = null;
  private keyDownFn: ((event: KeyboardEvent) => void) | null = null;

  public selectedElement: HTMLElement | null = null;

  constructor(container: HTMLElement | null, highlightInfo: HighlightInfo) {
    this.container = container;
    this.highlightInfo = highlightInfo;
  }

  activate(handleClick: (event: MouseEvent) => void, handleDblClick?: (event: MouseEvent) => void): void {
    if (this.isActive || !this.container) return;

    this.isActive = true;
    addHighlightStyles();

    this.mouseMoveFn = this.createMouseMoveHandler();
    this.clickFn = handleClick;
    this.dblClickFn = handleDblClick || null;
    this.keyDownFn = this.createKeyDownHandler();

    const contentEl = this.container.querySelector('.preview-content');
    if (!contentEl) return;

    contentEl.addEventListener('mousemove', this.mouseMoveFn);
    contentEl.addEventListener('click', this.clickFn);
    if (this.dblClickFn) {
      contentEl.addEventListener('dblclick', this.dblClickFn);
    }
    document.addEventListener('keydown', this.keyDownFn);
  }

  deactivate(): void {
    if (!this.isActive || !this.container) return;

    this.isActive = false;
    const contentEl = this.container.querySelector('.preview-content');
    if (!contentEl) return;

    if (this.mouseMoveFn) {
      contentEl.removeEventListener('mousemove', this.mouseMoveFn);
      this.mouseMoveFn = null;
    }

    if (this.clickFn) {
      contentEl.removeEventListener('click', this.clickFn);
      this.clickFn = null;
    }

    if (this.dblClickFn) {
      contentEl.removeEventListener('dblclick', this.dblClickFn);
      this.dblClickFn = null;
    }

    if (this.keyDownFn) {
      document.removeEventListener('keydown', this.keyDownFn);
      this.keyDownFn = null;
    }

    document.querySelectorAll('.element-highlight, .element-selected').forEach(el => {
      el.classList.remove('element-highlight', 'element-selected');
      if ('style' in el) {
        (el as HTMLElement).style.cursor = '';
        (el as HTMLElement).title = '';
      }
    });

    this.selectedElement = null;
    resetHighlightState(this.highlightInfo);
  }

  private createMouseMoveHandler(): (event: MouseEvent) => void {
    return (event: MouseEvent) => {
      if (!this.isActive) return;

      const target = event.target as HTMLElement;
      if (!target || target === this.container) return;

      if (
        target === this.container ||
        target.classList.contains('preview-content') ||
        target.parentElement === this.container
      ) {
        return;
      }

      this.updateHighlightElement(target);
    };
  }

  private updateHighlightElement(element: HTMLElement): void {
    if (!this.isActive) return;

    document.querySelectorAll('.element-highlight').forEach(el => {
      if (el !== this.selectedElement) {
        el.classList.remove('element-highlight');
      }
    });

    if (element !== this.selectedElement) {
      element.classList.add('element-highlight');
    }

    if (isTextNodeElement(element) || isImageElement(element)) {
      element.style.cursor = 'pointer';
      element.title = '双击编辑此元素';
    }

    updateHighlightInfo(element, this.highlightInfo);
  }

  private createKeyDownHandler(): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
      if (!this.isActive) return;
      if (event.key === 'Escape') {
        this.deactivate();
      }
    };
  }
}
