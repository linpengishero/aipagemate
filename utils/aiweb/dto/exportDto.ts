export interface ExportSettings {
  framework: string;
  cssFramework: string;
  fileName: string;
  fileExtension: string;
  generateSEO: boolean;
  typescriptSupport: boolean;
  formatHTML?: boolean;
  processWithAI?: boolean;
}

export interface AIProcessResult {
  success: boolean;
  content?: string;
  error?: string;
}
