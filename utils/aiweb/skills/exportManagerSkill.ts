import { CodeProcessorTool, SEOProcessorTool } from '~/utils/aiweb/tools';
import type { ExportSettings, AIProcessResult } from '~/utils/aiweb/dto/exportDto';

export interface ExportResult {
  success: boolean;
  code?: string;
  error?: string;
}

export const processCodeConversion = async (
  sourceCode: string,
  framework: string,
  cssFramework: string,
  prompt: string,
  aiProcessor: (prompt: string) => Promise<AIProcessResult>
): Promise<ExportResult> => {
  let retryCount = 0;
  const maxRetries = 3;
  let lastError = '';

  while (retryCount < maxRetries) {
    try {
      let currentPrompt = prompt;
      if (retryCount > 0) {
        currentPrompt = `之前的代码转换存在问题：${currentPrompt}，请修复以下问题并重新生成：${lastError}`;
      }

      const result = await aiProcessor(currentPrompt);
      if (!result.success || !result.content) {
        throw new Error(result.error || '转换代码失败');
      }

      let code = result.content.replace(/^```[\w]*\n/gm, '').replace(/```$/gm, '').trim();

      let validationResult;
      if (framework === 'vue3' || framework === 'vue2') {
        validationResult = CodeProcessorTool.validateVueCode(code);
      } else if (framework === 'react') {
        validationResult = CodeProcessorTool.validateReactCode(code);
      } else if (framework === 'html') {
        code = CodeProcessorTool.generateCompleteHtml(code);
        validationResult = { isValid: true };
      } else {
        validationResult = { isValid: true };
      }

      if (!validationResult.isValid) {
        lastError = validationResult.error || '结构验证失败';
        retryCount++;
        continue;
      }

      if (framework === 'vue3' || framework === 'vue2') {
        code = CodeProcessorTool.formatCode(code, 'html');
      } else if (framework === 'react') {
        code = CodeProcessorTool.formatCode(code, 'js');
      }

      return { success: true, code };
    } catch (error: any) {
      lastError = error.message || '处理失败';
      retryCount++;

      if (retryCount >= maxRetries) {
        return { success: false, error: `多次尝试后代码转换失败: ${lastError}` };
      }
    }
  }

  return { success: false, error: '达到最大重试次数，代码转换失败' };
};

export const processExport = async (
  settings: ExportSettings,
  sourceCode: string,
  aiProcessor: (prompt: string) => Promise<AIProcessResult>
): Promise<ExportResult> => {
  try {
    if (!sourceCode) {
      return { success: false, error: '源代码为空' };
    }

    const description = CodeProcessorTool.generateExportDescription(settings);
    let exportedCode = sourceCode;

    const needAIProcessing = settings.framework !== 'vue3' || settings.cssFramework !== 'css' || settings.typescriptSupport;

    if (settings.framework === 'html') {
      exportedCode = CodeProcessorTool.generateCompleteHtml(sourceCode);
    } else if (needAIProcessing) {
      let prompt = `请将以下Vue 3组件代码转换为${description}`;

      if (settings.framework === 'vue3' && settings.typescriptSupport) {
        prompt += `，请确保代码使用TypeScript，包括：
1. 添加正确的类型声明
2. 使用TypeScript特有的语法（如接口、类型别名等）
3. 正确标注props、emits和函数返回类型`;
      }

      prompt += `，不要添加任何解释，只返回转换后的代码：\n\n${sourceCode}`;

      const result = await processCodeConversion(
        sourceCode,
        settings.framework,
        settings.cssFramework,
        prompt,
        aiProcessor
      );

      if (!result.success) {
        throw new Error(result.error || '转换代码失败');
      }

      exportedCode = result.code || sourceCode;
    } else if (settings.formatHTML) {
      exportedCode = CodeProcessorTool.formatCode(sourceCode, 'html');
    }

    if (settings.generateSEO) {
      try {
        const seoPrompt = SEOProcessorTool.generateSEOPrompt(exportedCode);
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

            exportedCode = SEOProcessorTool.addSEOToCode(exportedCode, seoFramework, seoData);
          }
        }
      } catch {
        // ignore seo failure
      }
    }

    return { success: true, code: exportedCode };
  } catch (error: any) {
    return { success: false, error: error.message || '导出处理失败' };
  }
};

export const downloadCode = (code: string, fileName: string, fileExtension: string): void => {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}${fileExtension}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

const ExportManagerSkill = {
  processCodeConversion,
  processExport,
  downloadCode,
};

export default ExportManagerSkill;
