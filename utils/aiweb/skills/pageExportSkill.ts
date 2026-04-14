import ExportManagerSkill from '~/utils/aiweb/skills/exportManagerSkill';
import type { ExportSettings, AIProcessResult } from '~/utils/aiweb/dto/exportDto';
import { ok, err, type Result } from '~/utils/aiweb/types';
import {
  SEOProcessorTool,
  CodeProcessorTool,
  createImageExporter,
} from '~/utils/aiweb/tools';

/**
 * 导出流程通知类型。
 */
export type ExportNotifyType = 'success' | 'error' | 'warning' | 'info';

/**
 * 单页导出技能入参。
 */
export interface PageExportParams {
  /** 导出配置（框架、文件名、SEO、格式化等） */
  settings: ExportSettings;
  /** 待导出的页面源码 */
  sourceCode: string;
  /** AI 处理器（用于框架转换与SEO生成） */
  aiProcessor: (prompt: string) => Promise<AIProcessResult>;
  /** 可选通知回调（用于页面 toast） */
  notify?: (message: string, type?: ExportNotifyType) => void;
}

/**
 * 单页导出技能返回结果。
 */
export type PageExportResult = Result<null>;

/**
 * 空通知函数：当调用方未传入 notify 时避免空值判断。
 */
const noopNotify = () => undefined;

/**
 * 单页导出技能：封装导出流程（含Base64图片处理、框架转换、SEO与下载）。
 */
export const exportPageCode = async ({
  settings,
  sourceCode,
  aiProcessor,
  notify = noopNotify,
}: PageExportParams): Promise<PageExportResult> => {
  try {
    if (!sourceCode) {
      return err('Page content is empty.', 'EMPTY_SOURCE');
    }

    const description = CodeProcessorTool.generateExportDescription(settings);
    notify(`Processing ${description}...`, 'info');

    if (sourceCode.includes('data:image') && sourceCode.includes('base64')) {
      notify('Base64 images detected, starting processing...', 'info');
      try {
        const exporter = createImageExporter();

        const preprocessedCode = exporter.preprocessCode(sourceCode);
        const imageCount = exporter.getImageCount();
        notify(`${imageCount} images extracted. Processing with AI...`, 'info');

        const frameworkDesc = CodeProcessorTool.generateExportDescription(settings);
        const conversionPrompt = `请将以下代码转换为${frameworkDesc}，保持功能完全一致，不要添加任何解释，只返回转换后的代码：\n\n${preprocessedCode}`;

        notify(`Converting code to ${frameworkDesc}...`, 'info');

        const conversionResult = await aiProcessor(conversionPrompt);
        if (!conversionResult.success || !conversionResult.content) {
          throw new Error(conversionResult.error || '代码转换失败');
        }

        let processedCode = conversionResult.content
          .replace(/^```[\w]*\n/gm, '')
          .replace(/```$/gm, '')
          .trim();

        let validationResult;
        if (settings.framework === 'vue3' || settings.framework === 'vue2') {
          validationResult = CodeProcessorTool.validateVueCode(processedCode);
        } else if (settings.framework === 'react') {
          validationResult = CodeProcessorTool.validateReactCode(processedCode);
        } else if (settings.framework === 'html') {
          processedCode = CodeProcessorTool.generateCompleteHtml(processedCode);
          validationResult = { isValid: true };
        } else {
          validationResult = { isValid: true };
        }

        if (!validationResult.isValid) {
          notify(`Code validation failed: ${validationResult.error}`, 'warning');
          if (settings.framework === 'html') {
            processedCode = CodeProcessorTool.generateCompleteHtml(processedCode);
          }
        }

        if (settings.formatHTML || settings.framework === 'html') {
          processedCode = CodeProcessorTool.formatCode(processedCode, 'html');
        } else if (settings.framework === 'react') {
          processedCode = CodeProcessorTool.formatCode(processedCode, 'js');
        } else if (settings.framework === 'vue3' || settings.framework === 'vue2') {
          processedCode = CodeProcessorTool.formatCode(processedCode, 'html');
        }

        if (settings.generateSEO) {
          notify('Adding SEO metadata...', 'info');
          const seoPrompt = SEOProcessorTool.generateSEOPrompt(processedCode);
          const seoResult = await aiProcessor(seoPrompt);

          if (seoResult.success && seoResult.content) {
            const seoData = SEOProcessorTool.parseSEOResponse(seoResult.content);
            if (seoData) {
              const seoFramework: 'html' | 'vue3' | 'react' | undefined =
                settings.framework === 'vue2'
                  ? 'vue3'
                  : settings.framework === 'html' || settings.framework === 'vue3' || settings.framework === 'react'
                    ? settings.framework
                    : undefined;

              processedCode = SEOProcessorTool.addSEOToCode(
                processedCode,
                seoFramework,
                seoData
              );
            }
          }
        }

        const finalCode = exporter.postprocessCode(
          processedCode,
          settings.framework === 'vue2' ? 'vue3' : settings.framework,
        );

        notify(`Packaging files and ${imageCount} images...`, 'info');
        const zipBlob = await exporter.createZipPackage(
          finalCode,
          settings.framework,
          settings.fileName
        );

        exporter.downloadZip(zipBlob, `${settings.fileName}.zip`);
        notify(`Exported ${settings.fileName}.zip successfully (including ${imageCount} images)`, 'success');
        return ok(null);
      } catch (imageError: any) {
        notify(`Image processing failed: ${imageError.message}. Falling back to standard export.`, 'warning');
      }
    }

    const result = await ExportManagerSkill.processExport(settings, sourceCode, aiProcessor);
    if (!result.success || !result.code) {
      throw new Error(result.error || '导出处理失败');
    }

    ExportManagerSkill.downloadCode(result.code, settings.fileName, settings.fileExtension);
    notify('Export completed successfully.', 'success');
    return ok(null);
  } catch (error: any) {
    notify(`Export failed: ${error.message || error}`, 'error');
    return err(error.message || error, 'EXPORT_FAILED');
  }
};
