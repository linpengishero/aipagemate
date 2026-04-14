import { ref, computed, onMounted } from 'vue';
import {
  SUPPORTED_AI_MODELS,
  getModelDisplayName as getMModelDisplayName,
  updateModelSettings,
  setCurrentModel as setModelCurrent,
  checkModelAvailable as checkModelIsAvailable,
  getCurrentModelConfig
} from '~/utils/modelManager';

export interface AIModel {
  id: string;
  name: string;
  apiKey: string;
  baseURL: string;
  displayName?: string;
}

export function useAIModelSettings() {
  // 当前模型信息
  const currentModel = ref<AIModel>({
    id: '',
    name: '未设置',
    apiKey: '',
    baseURL: ''
  });

  // 加载模型设置
  const loadSettings = () => {
    const config = getCurrentModelConfig();
    if (config) {
      currentModel.value = {
        id: config.model,
        name: config.modelName || getMModelDisplayName(config.model),
        apiKey: config.apiKey,
        baseURL: config.baseURL
      };
    }
  };

  // 在组件挂载时加载设置
  onMounted(() => {
    loadSettings();
  });

  // 获取当前模型信息
  const getCurrentModelInfo = (): AIModel => {
    return currentModel.value;
  };

  // 获取模型显示名称
  const getModelDisplayName = (modelId: string): string => {
    return getMModelDisplayName(modelId);
  };

  // 获取当前选择的模型ID
  const getCurrentSelectedModel = (): string => {
    return currentModel.value.id;
  };

  // 检查模型是否可用（是否有API Key）
  const isModelAvailable = (modelId?: string): boolean => {
    const checkId = modelId || currentModel.value.id;
    return checkModelIsAvailable(checkId);
  };

  // 设置当前模型
  const setCurrentModel = (modelId: string, apiKey: string, baseURL: string): void => {
    // 更新模型设置
    updateModelSettings(modelId, apiKey, baseURL);
    // 设置为当前模型
    setModelCurrent(modelId);
    // 更新本地状态
    currentModel.value = {
      id: modelId,
      name: getModelDisplayName(modelId),
      apiKey: apiKey,
      baseURL: baseURL
    };
  };

  // 所有支持的模型列表
  const supportedModels = computed(() => SUPPORTED_AI_MODELS);

  return {
    currentModel,
    supportedModels,
    getCurrentModelInfo,
    getModelDisplayName,
    getCurrentSelectedModel,
    isModelAvailable,
    setCurrentModel,
    loadSettings
  };
} 