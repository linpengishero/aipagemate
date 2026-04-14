/**
 * modelManager.ts
 * 统一管理AI模型设置的工具库
 */

// 支持的AI模型定义（2026更新）
export const SUPPORTED_AI_MODELS = [
  {
    id: 'gpt-4.1',
    name: 'OpenAI GPT-4.1',
    baseURL: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gpt-4.1-mini',
    name: 'OpenAI GPT-4.1 Mini',
    baseURL: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    baseURL: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    baseURL: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Anthropic Claude 3.5 Sonnet',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'claude-3-5-haiku-latest',
    name: 'Anthropic Claude 3.5 Haiku',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'claude-3-opus-latest',
    name: 'Anthropic Claude 3 Opus',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Google Gemini 2.5 Pro',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyUrl: 'https://aistudio.google.com/apikey'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyUrl: 'https://aistudio.google.com/apikey'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    baseURL: 'https://api.deepseek.com',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    baseURL: 'https://api.deepseek.com',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey'
  },
  {
    id: 'qwen-max',
    name: 'Qwen Max',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey'
  }
];

const STORAGE_KEY = 'aiModelSettings';
export const DEFAULT_MODEL_ID = 'gpt-4.1-mini';

export interface ModelSettings {
  selectedModel: string;
  modelSettings: {
    [key: string]: {
      apiKey: string;
      baseURL: string;
      modelName?: string;
    }
  }
}

export interface ModelConfig {
  model: string;
  modelName?: string;
  apiKey: string;
  baseURL: string;
}

export const getModelDisplayName = (modelId: string): string => {
  const model = SUPPORTED_AI_MODELS.find(m => m.id === modelId);
  if (model) {
    return model.name;
  }

  const settings = loadModelSettings();
  const custom = settings.modelSettings?.[modelId]?.modelName;
  if (custom) {
    return custom;
  }

  return modelId;
};

export const getDefaultBaseURL = (modelId: string): string => {
  const model = SUPPORTED_AI_MODELS.find(m => m.id === modelId);
  return model?.baseURL || '';
};

export const getApiKeyUrl = (modelId: string): string => {
  const model = SUPPORTED_AI_MODELS.find(m => m.id === modelId);
  return model?.apiKeyUrl || '';
};

export const loadModelSettings = (): ModelSettings => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as ModelSettings;

      // 兼容：如果默认模型已不在列表中，则迁移到新默认模型
      const modelExists = SUPPORTED_AI_MODELS.some(m => m.id === parsed.selectedModel)
        || !!parsed.modelSettings?.[parsed.selectedModel]?.modelName;

      if (!modelExists) {
        parsed.selectedModel = DEFAULT_MODEL_ID;
      }

      // 补齐新模型字段
      if (!parsed.modelSettings) {
        parsed.modelSettings = {};
      }
      SUPPORTED_AI_MODELS.forEach(model => {
        if (!parsed.modelSettings[model.id]) {
          parsed.modelSettings[model.id] = {
            apiKey: '',
            baseURL: model.baseURL
          };
        }
      });

      return parsed;
    }
  } catch (error) {
    console.error('读取模型设置时出错:', error);
  }

  const defaultSettings: ModelSettings = {
    selectedModel: DEFAULT_MODEL_ID,
    modelSettings: {}
  };

  SUPPORTED_AI_MODELS.forEach(model => {
    defaultSettings.modelSettings[model.id] = {
      apiKey: '',
      baseURL: model.baseURL
    };
  });

  return defaultSettings;
};

export const saveModelSettings = (settings: ModelSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存模型设置时出错:', error);
  }
};

export const getCurrentSelectedModel = (): string => {
  const settings = loadModelSettings();
  return settings.selectedModel;
};

export const getCurrentModelConfig = (): ModelConfig | null => {
  try {
    const settings = loadModelSettings();
    const selectedModel = settings.selectedModel;

    if (selectedModel && settings.modelSettings && settings.modelSettings[selectedModel]) {
      const current = settings.modelSettings[selectedModel];
      return {
        model: selectedModel,
        modelName: current.modelName || getModelDisplayName(selectedModel),
        apiKey: current.apiKey,
        baseURL: current.baseURL
      };
    }
    return null;
  } catch (error) {
    console.error('获取当前模型配置时出错:', error);
    return null;
  }
};

export const updateModelSettings = (
  modelId: string,
  apiKey: string,
  baseURL: string,
  modelName?: string
): void => {
  const settings = loadModelSettings();

  if (!settings.modelSettings) {
    settings.modelSettings = {};
  }

  const modelInfo = SUPPORTED_AI_MODELS.find(m => m.id === modelId);
  const defaultBaseURL = modelInfo?.baseURL || '';

  if (!settings.modelSettings[modelId]) {
    settings.modelSettings[modelId] = {
      apiKey: '',
      baseURL: defaultBaseURL
    };
  }

  settings.modelSettings[modelId].apiKey = apiKey;
  settings.modelSettings[modelId].baseURL = baseURL || defaultBaseURL;
  if (modelName !== undefined) {
    settings.modelSettings[modelId].modelName = modelName;
  }

  saveModelSettings(settings);
};

export const setCurrentModel = (modelId: string): void => {
  const settings = loadModelSettings();
  settings.selectedModel = modelId;
  saveModelSettings(settings);
};

export const checkModelAvailable = (modelId?: string): boolean => {
  const settings = loadModelSettings();
  const checkId = modelId || settings.selectedModel;
  const current = settings.modelSettings?.[checkId];

  if (!current) {
    return false;
  }

  // 自定义模型：至少需要URL和模型名
  if (current.modelName) {
    return !!current.baseURL && !!current.modelName;
  }

  // 远程官方模型：需要API key
  return !!current.apiKey && current.apiKey.trim() !== '';
};

export const getAvailableModels = (): string[] => {
  const settings = loadModelSettings();
  const availableModels: string[] = [];

  if (settings.modelSettings) {
    for (const modelId in settings.modelSettings) {
      const modelConfig = settings.modelSettings[modelId];

      if (modelConfig.modelName && modelConfig.baseURL) {
        availableModels.push(modelId);
      } else if (modelConfig.apiKey && modelConfig.apiKey.trim() !== '') {
        availableModels.push(modelId);
      }
    }
  }

  return availableModels;
};
