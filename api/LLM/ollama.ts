/**
 * Ollama API 服务
 * 用于查询和管理Ollama模型
 */

// 默认Ollama服务器URL
export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

// 模型类型接口
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

/**
 * 从Ollama服务器获取可用模型列表
 * @param baseURL Ollama服务器地址，默认为localhost:11434
 * @returns 可用模型列表
 */
export const getOllamaModels = async (baseURL: string = DEFAULT_OLLAMA_BASE_URL): Promise<OllamaModel[]> => {
  try {
    const response = await fetch(`${baseURL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('无法连接到Ollama服务');
    }
    
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('获取Ollama模型列表失败:', error);
    return [];
  }
};

/**
 * 检查Ollama服务是否可用
 * @param baseURL Ollama服务器地址，默认为localhost:11434
 * @returns 是否可用
 */
export const isOllamaAvailable = async (baseURL: string = DEFAULT_OLLAMA_BASE_URL): Promise<boolean> => {
  try {
    const response = await fetch(`${baseURL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('检查Ollama服务失败:', error);
    return false;
  }
};

/**
 * 获取多模态（支持图像分析）的Ollama模型
 * @param models Ollama模型列表
 * @returns 支持多模态的模型列表
 */
export const getMultiModalModels = (models: OllamaModel[]): OllamaModel[] => {
  // 通常支持多模态的模型名称包含这些关键词
  const multiModalKeywords = ['llava', 'vision', 'image', 'visual', 'clip', 'multimodal'];
  
  return models.filter(model => 
    multiModalKeywords.some(keyword => model.name.toLowerCase().includes(keyword))
  );
};

/**
 * 格式化Ollama模型大小
 * @param size 字节大小
 * @returns 格式化后的大小字符串
 */
export const formatModelSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};

/**
 * 删除Ollama模型
 * @param modelName 模型名称
 * @param baseURL Ollama服务器地址，默认为localhost:11434
 * @returns 删除结果
 */
export const deleteOllamaModel = async (
  modelName: string, 
  baseURL: string = DEFAULT_OLLAMA_BASE_URL
): Promise<{success: boolean, message: string}> => {
  try {
    // 检查模型名称是否有效
    if (!modelName || typeof modelName !== 'string' || !modelName.trim()) {
      return { success: false, message: '无效的模型名称' };
    }
    
    const response = await fetch(`${baseURL}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: modelName.trim() })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `删除失败: ${errorText}` };
    }
    
    return { success: true, message: `模型 ${modelName} 已成功删除` };
  } catch (error) {
    console.error('删除模型失败:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '删除失败，请检查Ollama服务是否正常运行' 
    };
  }
}; 