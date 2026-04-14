/**
 * 预览桥接工具：封装与 iframe 内 webPreviewMethods 的交互。
 */

export interface WebPreviewMethods {
  compileAndRun: (code: string) => void;
  getCurrentCode: () => string;
  generationProgress?: () => void;
  resetGenerationProgress?: () => void;
  toggleInspectMode: (value?: boolean) => void;
  toggleMobileView: (isMobile: boolean) => void;
  isInspectMode: boolean;
  isMobileView: boolean;
}

/**
 * 获取预览方法对象。
 */
export const getPreviewMethods = (previewFrame: HTMLIFrameElement | null) => {
  if (!previewFrame?.contentWindow) return null;
  return (previewFrame.contentWindow as any).webPreviewMethods as WebPreviewMethods | null;
};

/**
 * 调用预览编译渲染。
 */
export const compilePreviewCode = (previewFrame: HTMLIFrameElement | null, code: string) => {
  const methods = getPreviewMethods(previewFrame);
  if (methods) {
    methods.compileAndRun(code);
  }
};

/**
 * 读取预览中的最新代码。
 */
export const getPreviewCurrentCode = (previewFrame: HTMLIFrameElement | null) => {
  const methods = getPreviewMethods(previewFrame);
  if (!methods) return "";
  return methods.getCurrentCode();
};

/**
 * 通知预览进入生成中状态。
 */
export const startPreviewGeneration = (previewFrame: HTMLIFrameElement | null) => {
  const methods = getPreviewMethods(previewFrame);
  if (methods?.generationProgress) {
    methods.generationProgress();
  }
};

/**
 * 通知预览重置生成状态。
 */
export const resetPreviewGeneration = (previewFrame: HTMLIFrameElement | null) => {
  const methods = getPreviewMethods(previewFrame);
  if (methods?.resetGenerationProgress) {
    methods.resetGenerationProgress();
  }
};
