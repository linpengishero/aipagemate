export interface PostGenerationPipelineOptions {
  /** 是否强制将模板中的 src 统一为示例图 */
  enforceExampleImageSrc?: boolean;
  /** 示例图路径 */
  exampleImagePath?: string;
  /** 是否强制规范化链接（非占位符链接统一改为 #） */
  enforceSafeLinks?: boolean;
}

export const DEFAULT_EXAMPLE_IMAGE_PATH = '/images/example/img.png';
