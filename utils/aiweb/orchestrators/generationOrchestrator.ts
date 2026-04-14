import { parse, compileScript, compileTemplate, compileStyle } from '@vue/compiler-sfc';
import { generateWebCode } from '~/utils/aiweb/roles/frontendEngineer';
import { repairSfcStyle, repairSfcStructure } from '~/utils/aiweb/roles/sfcRepairAssistant';
import { unwrapCodeFence } from '~/utils/aiweb/roles/runtime';
import { hasMeaningfulStyleBlock } from '~/utils/aiweb/tools';
import { ok, err, type Result } from '~/utils/aiweb/types';

const isLikelyCompleteSfc = (code: string) => {
  const text = unwrapCodeFence(code);
  if (!text) return false;

  const pairs: Array<[RegExp, RegExp]> = [
    [/<template[\s>]/g, /<\/template>/g],
    [/<script[\s>]/g, /<\/script>/g],
    [/<style[\s>]/g, /<\/style>/g],
  ];

  return pairs.every(([open, close]) => {
    const openCount = (text.match(open) || []).length;
    const closeCount = (text.match(close) || []).length;
    return openCount > 0 && openCount === closeCount;
  });
};

const validateSfcWithCompiler = (code: string) => {
  try {
    const filename = 'generation-validate.vue';
    const { descriptor, errors } = parse(code, { filename });
    if (errors && errors.length > 0) {
      return { valid: false, reason: `SFC parse failed: ${String(errors[0])}` };
    }

    if (!descriptor.template) {
      return { valid: false, reason: 'SFC template missing' };
    }

    if (!descriptor.script && !descriptor.scriptSetup) {
      return { valid: false, reason: 'SFC script missing' };
    }

    const scriptResult = compileScript(descriptor, {
      id: 'generation-validate',
      inlineTemplate: false,
    });

    const templateResult = compileTemplate({
      id: 'generation-validate',
      filename,
      source: descriptor.template.content,
      scoped: descriptor.styles.some((s) => !!s.scoped),
      compilerOptions: { mode: 'module' },
    });

    if (templateResult.errors && templateResult.errors.length > 0) {
      return { valid: false, reason: `Template compile failed: ${String(templateResult.errors[0])}` };
    }

    for (const style of descriptor.styles) {
      const styleRes = compileStyle({
        id: 'generation-validate',
        filename,
        source: style.content || '',
        scoped: !!style.scoped,
      });
      if (styleRes.errors && styleRes.errors.length > 0) {
        return { valid: false, reason: `Style compile failed: ${String(styleRes.errors[0])}` };
      }
    }

    if (!scriptResult?.content) {
      return { valid: false, reason: 'Script compile empty' };
    }

    return { valid: true as const, reason: '' };
  } catch (error: any) {
    return { valid: false, reason: error?.message || String(error) };
  }
};

export interface GenerationFlowParams {
  requirement: string;
  approvedPlan?: string;
  logFlow?: (stage: string, payload?: any) => void;
}

const repairStyleIfNeeded = async (
  generatedCode: string,
  requirement: string,
  planContext: string,
  logFlow?: (stage: string, payload?: any) => void,
) => {
  const cleanedCode = unwrapCodeFence(generatedCode);
  if (hasMeaningfulStyleBlock(cleanedCode)) {
    return cleanedCode;
  }

  logFlow?.('firstWebGeneration:style-missing-detected');

  try {
    const repairedCode = await repairSfcStyle(requirement, planContext, cleanedCode);
    logFlow?.('firstWebGeneration:style-repair-done', {
      hasStyle: hasMeaningfulStyleBlock(repairedCode),
    });
    return repairedCode;
  } catch (error: any) {
    logFlow?.('firstWebGeneration:style-repair-failed', { error: error?.message || error });
    return cleanedCode;
  }
};

export type FirstPageGenerationResult = Result<{ code: string }>;

export const runFirstPageGeneration = async ({
  requirement,
  approvedPlan = '',
  logFlow,
}: GenerationFlowParams): Promise<FirstPageGenerationResult> => {
  try {
    const planContext = approvedPlan ? `\n\nApproved design proposal:\n${approvedPlan}` : '';

    let code = await generateWebCode(requirement, approvedPlan);

    if (!isLikelyCompleteSfc(code)) {
      logFlow?.('firstWebGeneration:structure-missing-detected');
      code = await repairSfcStructure(requirement, planContext, code);
      logFlow?.('firstWebGeneration:structure-repair-done', {
        isComplete: isLikelyCompleteSfc(code),
      });
    }

    code = await repairStyleIfNeeded(code, requirement, planContext, logFlow);

    if (!isLikelyCompleteSfc(code)) {
      return err('Generated SFC is incomplete after repair.', 'SFC_INCOMPLETE');
    }

    const compilerValidation = validateSfcWithCompiler(code);
    if (!compilerValidation.valid) {
      logFlow?.('firstWebGeneration:compiler-validation-failed', { reason: compilerValidation.reason });
      const repaired = await repairSfcStructure(requirement, planContext, code);
      const revalidated = validateSfcWithCompiler(repaired);
      if (!revalidated.valid) {
        return err(`Generated SFC failed compiler validation: ${revalidated.reason}`, 'SFC_COMPILER_INVALID');
      }
      code = repaired;
    }

    return ok({ code });
  } catch (error: any) {
    return err(error?.message || 'First page generation failed.', 'FIRST_PAGE_GENERATION_FAILED');
  }
};
