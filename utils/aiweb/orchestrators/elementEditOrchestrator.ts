import webProjectStore from '~/utils/webDB/WebProjectStorage';
import {
  editElementByAI,
  editElementByAIWithImagePlaceholders,
} from '~/utils/aiweb/roles/elementEditor';
import { ImageExporter } from '~/utils/aiweb/tools';
import { ok, err, type Result } from '~/utils/aiweb/types';

/**
 * 元素编辑编排入参。
 */
export interface EditElementParams {
  /** 用户的编辑指令 */
  message: string;
  /** 当前页面 ID（用于自动保存） */
  currentPageId: string;
  /** 页面完整源码 */
  sourceCode: string;
  /** 当前选中元素源码 */
  elementCode: string;
}

/**
 * 元素编辑编排结果。
 */
export interface EditElementResult {
  /** 编辑后的完整页面源码 */
  updatedCode: string;
}

/**
 * 元素编辑统一返回结果。
 */
export type EditElementFlowResult = Result<EditElementResult>;

/**
 * 元素编辑编排：负责自动保存、图像占位预处理、AI编辑与图像恢复。
 */
export const runElementEditFlow = async ({
  message,
  currentPageId,
  sourceCode,
  elementCode,
}: EditElementParams): Promise<EditElementFlowResult> => {
  try {
    if (currentPageId && sourceCode) {
      try {
        await webProjectStore.savePage(currentPageId, sourceCode);
      } catch (saveError) {
        console.warn('Auto save page before element edit failed:', saveError);
      }
    }

    const exporter = new ImageExporter();

    if (sourceCode.includes('data:image') && sourceCode.includes('base64')) {
      const preprocessedSourceCode = exporter.preprocessCode(sourceCode);
      const preprocessedElementCode = exporter.preprocessElementCode(elementCode);

      const processedCode = await editElementByAIWithImagePlaceholders(
        preprocessedSourceCode,
        preprocessedElementCode,
        message
      );

      return ok({
        updatedCode: exporter.restoreOriginalImages(processedCode),
      });
    }

    const code = await editElementByAI(sourceCode, elementCode, message);
    return ok({
      updatedCode: code,
    });
  } catch (error: any) {
    return err(error?.message || 'Element edit failed.', 'ELEMENT_EDIT_FAILED');
  }
};
