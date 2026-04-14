<template>
  <div class="inline-block">
    <button
      @click="openDialog"
      class="py-2 focus:outline-none"
      title="AI Model Settings"
    >
      <Icon name="heroicons:cog-6-tooth" class="h-5 w-5 text-blue-400 hover:text-blue-300" />
    </button>

    <Teleport to="body">
      <div
        v-if="isDialogOpen"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="closeDialog"
      >
        <div class="bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
          <div class="bg-gradient-to-r from-blue-900/60 to-gray-800/60 p-4 flex justify-between items-center border-b border-gray-800">
            <h3 class="text-lg font-semibold text-blue-300">AI Model Settings</h3>
            <button @click="closeDialog" class="text-gray-400 hover:text-white">
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </button>
          </div>

          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Model Source</label>
              <div class="flex space-x-2">
                <button
                  @click="setModelType('remote')"
                  :class="[
                    'flex-1 py-2 px-4 rounded-md transition-colors',
                    modelType === 'remote'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  ]"
                >
                  <span class="flex items-center justify-center">
                    <Icon name="heroicons:globe-alt" class="mr-2 h-4 w-4" />
                    Official Models
                  </span>
                </button>
                <button
                  @click="setModelType('custom')"
                  :class="[
                    'flex-1 py-2 px-4 rounded-md transition-colors',
                    modelType === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  ]"
                >
                  <span class="flex items-center justify-center">
                    <Icon name="heroicons:wrench-screwdriver" class="mr-2 h-4 w-4" />
                    Custom Model
                  </span>
                </button>
              </div>
            </div>

            <div v-if="modelType === 'remote'">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-300 mb-1">AI Model</label>
                <Listbox v-model="selectedModelValue" @update:model-value="handleModelChange">
                  <div class="relative">
                    <ListboxButton class="relative w-full py-2 pl-3 pr-10 text-left bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-lg shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm">
                      <span class="block truncate text-gray-200">{{ selectedModelName }}</span>
                      <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <Icon name="heroicons:chevron-down" class="h-4 w-4 text-gray-400" />
                      </span>
                    </ListboxButton>

                    <transition
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <ListboxOptions class="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                        <ListboxOption
                          v-for="model in aiModels"
                          :key="model.id"
                          :value="model.id"
                          v-slot="{ active, selected }"
                        >
                          <div :class="[
                            active ? 'text-white bg-blue-600' : 'text-gray-300',
                            'cursor-pointer select-none relative py-2 pl-10 pr-4'
                          ]">
                            <span :class="[
                              selected ? 'font-medium' : 'font-normal',
                              'block truncate'
                            ]">
                              {{ model.name }}
                            </span>
                            <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-300">
                              <Icon name="heroicons:check" class="h-4 w-4" />
                            </span>
                          </div>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>
              </div>

              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="api-key" class="block text-sm font-medium text-gray-300">API Key</label>
                  <a
                    v-if="getApiKeyUrl(selectedModelValue)"
                    :href="getApiKeyUrl(selectedModelValue)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    <Icon name="heroicons:key" class="h-3 w-3 mr-1" />
                    Get API Key
                  </a>
                </div>
                <div class="relative rounded-md shadow-sm">
                  <input
                    id="api-key"
                    :type="showApiKey ? 'text' : 'password'"
                    v-model="apiKeyValue"
                    class="block w-full bg-gray-800 border border-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-500/30 rounded-lg shadow-sm py-2 px-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none transition-colors duration-200"
                    placeholder="Enter API Key"
                  />
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Icon
                      :name="showApiKey ? 'heroicons:eye-slash' : 'heroicons:eye'"
                      class="h-5 w-5 text-gray-400 cursor-pointer"
                      @click="toggleApiKeyVisibility"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label for="base-url" class="block text-sm font-medium text-gray-300 mb-1">API Base URL</label>
                <div class="relative rounded-md shadow-sm">
                  <input
                    id="base-url"
                    type="text"
                    v-model="baseURLValue"
                    class="block w-full bg-gray-800 border border-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-500/30 rounded-lg shadow-sm py-2 px-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none transition-colors duration-200"
                    placeholder="API Base URL"
                  />
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Icon name="heroicons:globe-alt" class="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="modelType === 'custom'" class="space-y-4">
              <div>
                <label for="custom-model-name" class="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                <input
                  id="custom-model-name"
                  v-model="customModelName"
                  type="text"
                  class="block w-full bg-gray-800 border border-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-500/30 rounded-lg shadow-sm py-2 px-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none transition-colors duration-200"
                  placeholder="Example: my-gpt-proxy-model"
                />
              </div>

              <div>
                <label for="custom-api-url" class="block text-sm font-medium text-gray-300 mb-1">Custom URL</label>
                <input
                  id="custom-api-url"
                  v-model="customBaseURL"
                  type="text"
                  class="block w-full bg-gray-800 border border-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-500/30 rounded-lg shadow-sm py-2 px-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none transition-colors duration-200"
                  placeholder="Example: https://your-proxy.com/v1"
                />
              </div>

              <div>
                <label for="custom-api-key" class="block text-sm font-medium text-gray-300 mb-1">Custom API Key</label>
                <div class="relative rounded-md shadow-sm">
                  <input
                    id="custom-api-key"
                    :type="showApiKey ? 'text' : 'password'"
                    v-model="customApiKey"
                    class="block w-full bg-gray-800 border border-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-500/30 rounded-lg shadow-sm py-2 px-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none transition-colors duration-200"
                    placeholder="Enter custom API key"
                  />
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Icon
                      :name="showApiKey ? 'heroicons:eye-slash' : 'heroicons:eye'"
                      class="h-5 w-5 text-gray-400 cursor-pointer"
                      @click="toggleApiKeyVisibility"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-800/50 px-5 py-4 flex justify-end">
            <button
              @click="closeDialog"
              class="px-4 py-2 bg-gray-700 text-gray-300 rounded-md mr-2 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveSettingsAndClose"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <span class="flex items-center">
                <Icon name="heroicons:check-circle" class="mr-2 h-4 w-4" />
                Save Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import {
  SUPPORTED_AI_MODELS,
  getModelDisplayName,
  getDefaultBaseURL,
  getApiKeyUrl,
  loadModelSettings,
  updateModelSettings,
  setCurrentModel,
  checkModelAvailable as checkModelAvailableUtil
} from '~/utils/modelManager';

const emit = defineEmits(['model-changed', 'settings-saved']);

const isDialogOpen = ref(false);
const aiModels = SUPPORTED_AI_MODELS;
const modelType = ref<'remote' | 'custom'>('remote');
const { showToast } = useToast();

const selectedModelValue = ref('');
const apiKeyValue = ref('');
const baseURLValue = ref('');
const modelSettings = ref<Record<string, { apiKey: string, baseURL: string, modelName?: string }>>({});
const showApiKey = ref(false);

const customModelName = ref('');
const customApiKey = ref('');
const customBaseURL = ref('');

const CUSTOM_MODEL_ID = '__custom_model__';

const selectedModelName = computed(() => getModelDisplayName(selectedModelValue.value));

const toggleApiKeyVisibility = () => {
  showApiKey.value = !showApiKey.value;
};

const openDialog = () => {
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
};

const saveSettingsAndClose = () => {
  saveSettings();
  closeDialog();
};

const setModelType = (type: 'remote' | 'custom') => {
  modelType.value = type;
};

const handleModelChange = (newValue: string) => {
  selectedModelValue.value = newValue;

  if (modelSettings.value[newValue]) {
    apiKeyValue.value = modelSettings.value[newValue].apiKey || '';
    baseURLValue.value = modelSettings.value[newValue].baseURL || getDefaultBaseURL(newValue);
  } else {
    apiKeyValue.value = '';
    baseURLValue.value = getDefaultBaseURL(newValue);
  }

  emit('model-changed', {
    model: newValue,
    modelName: getModelDisplayName(newValue),
    apiKey: apiKeyValue.value,
    baseURL: baseURLValue.value,
    isCustom: false
  });
};

onMounted(() => {
  const settings = loadModelSettings();
  selectedModelValue.value = settings.selectedModel;
  modelSettings.value = settings.modelSettings;

  if (settings.modelSettings[settings.selectedModel]) {
    const currentSettings = settings.modelSettings[settings.selectedModel];
    apiKeyValue.value = currentSettings.apiKey || '';
    baseURLValue.value = currentSettings.baseURL || getDefaultBaseURL(settings.selectedModel);
  }

  const customSettings = settings.modelSettings[CUSTOM_MODEL_ID];
  if (customSettings) {
    customModelName.value = customSettings.modelName || '';
    customApiKey.value = customSettings.apiKey || '';
    customBaseURL.value = customSettings.baseURL || '';
  }

  emit('model-changed', {
    model: settings.selectedModel,
    modelName: getModelDisplayName(settings.selectedModel),
    apiKey: apiKeyValue.value,
    baseURL: baseURLValue.value,
    isCustom: settings.selectedModel === CUSTOM_MODEL_ID
  });
});

const saveSettings = () => {
  if (modelType.value === 'remote') {
    updateModelSettings(selectedModelValue.value, apiKeyValue.value, baseURLValue.value);
    setCurrentModel(selectedModelValue.value);

    showToast({ type: 'success', message: 'Remote model settings saved.' });

    emit('settings-saved', {
      model: selectedModelValue.value,
      modelName: getModelDisplayName(selectedModelValue.value),
      apiKey: apiKeyValue.value,
      baseURL: baseURLValue.value,
      isCustom: false
    });
    return;
  }

  if (!customModelName.value.trim()) {
    showToast({ type: 'error', message: 'Please enter a custom model name.' });
    return;
  }

  if (!customBaseURL.value.trim()) {
    showToast({ type: 'error', message: 'Please enter a custom URL.' });
    return;
  }

  updateModelSettings(CUSTOM_MODEL_ID, customApiKey.value, customBaseURL.value, customModelName.value.trim());
  setCurrentModel(CUSTOM_MODEL_ID);

  showToast({ type: 'success', message: 'Custom model settings saved.' });

  emit('settings-saved', {
    model: CUSTOM_MODEL_ID,
    modelName: customModelName.value.trim(),
    apiKey: customApiKey.value,
    baseURL: customBaseURL.value,
    isCustom: true
  });
};

const getSelectedModel = (): string => {
  return modelType.value === 'custom' ? CUSTOM_MODEL_ID : selectedModelValue.value;
};

const setSelectedModel = (modelId: string): void => {
  if (modelId === CUSTOM_MODEL_ID) {
    modelType.value = 'custom';
    return;
  }

  modelType.value = 'remote';
  handleModelChange(modelId);
};

const getApiKey = (): string => {
  return modelType.value === 'custom' ? customApiKey.value : apiKeyValue.value;
};

const setApiKey = (apiKey: string): void => {
  if (modelType.value === 'custom') {
    customApiKey.value = apiKey;
  } else {
    apiKeyValue.value = apiKey;
  }
};

const getBaseURL = (): string => {
  return modelType.value === 'custom' ? customBaseURL.value : baseURLValue.value;
};

const setBaseURL = (baseURL: string): void => {
  if (modelType.value === 'custom') {
    customBaseURL.value = baseURL;
  } else {
    baseURLValue.value = baseURL;
  }
};

const checkModelAvailable = (modelId?: string, autoShowDialog = true): boolean => {
  const targetModelId = modelId || getSelectedModel();

  if (targetModelId === CUSTOM_MODEL_ID) {
    const isAvailable = !!customModelName.value.trim() && !!customBaseURL.value.trim();
    if (!isAvailable && autoShowDialog) {
      openDialog();
      showToast({ type: 'warning', message: 'Please complete the custom model name and URL.' });
    }
    return isAvailable;
  }

  const isAvailable = checkModelAvailableUtil(targetModelId);
  if (!isAvailable && autoShowDialog) {
    openDialog();
    showToast({ type: 'warning', message: `Please set an API key for ${getModelDisplayName(targetModelId)}.` });
  }

  return isAvailable;
};

defineExpose({
  aiModels,
  getModelDisplayName,
  getDefaultBaseURL,
  getApiKeyUrl,
  openDialog,
  closeDialog,
  checkModelAvailable,
  getSelectedModel,
  setSelectedModel,
  getApiKey,
  setApiKey,
  getBaseURL,
  setBaseURL
});
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.2);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.7);
}

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

input:focus,
button:focus:not(:first-child) {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.transform {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
