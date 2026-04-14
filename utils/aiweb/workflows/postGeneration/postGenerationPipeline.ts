import type { PostGenerationPipelineOptions } from './types';
import {
  DEFAULT_EXAMPLE_IMAGE_PATH,
} from './types';
import {
  normalizeImageSrcStep,
  normalizeLinkHrefStep,
} from './steps';

/**
 * 生成后的统一后处理流水线。
 *
 * 当前包含步骤：
 * 1) 可选：强制将 template 中图片 src 规范化为示例图路径
 * 2) 可选：强制将非占位符 href 规范化为 #（避免真实外链）
 *
 * 说明：
 * - 该流水线位于“页面生成成功但入库前”阶段。
 * - 适合承载稳定性修复、结构规范化、风险兜底等后处理逻辑。
 */
export const runPostGenerationPipeline = (
  sfcCode: string,
  options: PostGenerationPipelineOptions = {},
) => {
  const {
    enforceExampleImageSrc = true,
    exampleImagePath = DEFAULT_EXAMPLE_IMAGE_PATH,
    enforceSafeLinks = true,
  } = options;

  let output = sfcCode;

  if (enforceExampleImageSrc) {
    output = normalizeImageSrcStep(output, exampleImagePath);
  }

  if (enforceSafeLinks) {
    output = normalizeLinkHrefStep(output);
  }

  return output;
};
