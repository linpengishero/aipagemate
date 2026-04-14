<template>
  <!-- 安装模型对话框 -->
  <Teleport to="body">
    <div 
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-900/60 to-gray-800/60 p-4 flex justify-between items-center border-b border-gray-800">
          <h3 class="text-lg font-semibold text-blue-300">
            {{ isConfirmOverwrite ? '模型已存在' : '安装Ollama模型' }}
          </h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white">
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </button>
        </div>
        
        <div class="p-5 space-y-4">
          <!-- 确认覆盖对话框 -->
          <div v-if="isConfirmOverwrite" class="py-2">
            <div class="flex items-start mb-4">
              <div class="flex-shrink-0 mr-3">
                <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div>
                <h4 class="text-gray-200 font-medium mb-1">模型已存在</h4>
                <p class="text-gray-400 text-sm">
                  模型"{{ modelName }}"或其变体已存在。继续安装将覆盖现有模型或下载不同的变体，是否继续？
                </p>
              </div>
            </div>
          </div>
          
          <!-- 模型输入界面 -->
          <div v-if="currentStep === 'input' && !isConfirmOverwrite">
            <label for="model-name" class="block text-sm font-medium text-gray-300 mb-1">模型名称</label>
            <div class="relative rounded-md shadow-sm">
              <input
                id="model-name"
                type="text"
                v-model="modelName"
                class="block w-full bg-gray-800 border border-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-500/30 rounded-lg shadow-sm py-2 px-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none transition-colors duration-200"
                placeholder="例如: llama3:8b, mistral:7b, gemma:7b"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Icon name="heroicons:cube" class="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              输入模型名称，如llama3, mistral等。可以访问
              <a href="https://ollama.com/library" target="_blank" class="text-blue-400 hover:underline">Ollama模型库</a>
              查看可用模型
            </p>
          </div>
          
          <!-- 安装进度界面 -->
          <div v-if="currentStep === 'installing'" class="py-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-300">正在安装: <span class="text-blue-400 font-medium">{{ modelName }}</span></span>
              <span class="text-xs text-gray-400">{{ formatProgress() }}</span>
            </div>
            
            <div class="w-full bg-gray-700 rounded-full h-2.5 mb-2">
              <div 
                class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            
            <div class="mt-3 text-sm">
              <div v-if="progressInfo.status" class="text-blue-400 mb-1">{{ progressInfo.status }}</div>
              <div v-if="progressInfo.digest" class="text-gray-300 text-xs">
                <span class="text-gray-500">模型ID:</span> {{ shortenDigest(progressInfo.digest) }}
              </div>
              
              <!-- 显示错误消息 -->
              <div v-if="error" class="mt-3 text-red-400 text-sm">
                {{ error }}
              </div>
            </div>
          </div>
          
          <!-- 完成界面 -->
          <div v-if="currentStep === 'complete'" class="py-4 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <Icon name="heroicons:check" class="h-8 w-8 text-green-600" />
            </div>
            <h3 class="text-lg font-medium text-gray-200 mb-1">安装完成</h3>
            <p class="text-gray-400 text-sm">
              模型 <span class="text-blue-400 font-medium">{{ modelName }}</span> 已成功安装
            </p>
          </div>
        </div>
        
        <div class="bg-gray-800/50 px-5 py-4 flex justify-end">
          <!-- 确认覆盖按钮 -->
          <template v-if="isConfirmOverwrite">
            <button
              @click="cancelOverwrite"
              class="px-4 py-2 bg-gray-700 text-gray-300 rounded-md mr-2 hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
            <button
              @click="confirmOverwrite"
              class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            >
              <span class="flex items-center">
                <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
                继续安装
              </span>
            </button>
          </template>
          
          <!-- 默认按钮 -->
          <template v-else>
            <button
              v-if="currentStep === 'input'"
              @click="$emit('close')"
              class="px-4 py-2 bg-gray-700 text-gray-300 rounded-md mr-2 hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
            <button
              v-if="currentStep === 'input'"
              @click="startInstallation"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              :disabled="!modelName.trim()"
            >
              <span class="flex items-center">
                <Icon name="heroicons:arrow-down-tray" class="mr-2 h-4 w-4" />
                安装模型
              </span>
            </button>
            
            <button
              v-if="currentStep === 'complete'"
              @click="finishInstallation"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              <span class="flex items-center">
                <Icon name="heroicons:check-circle" class="mr-2 h-4 w-4" />
                完成
              </span>
            </button>
            
            <button
              v-if="currentStep === 'installing'"
              @click="cancelInstallation"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <span class="flex items-center">
                <Icon name="heroicons:x-circle" class="mr-2 h-4 w-4" />
                取消安装
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useToast } from '~/composables/useToast';
import { getOllamaModels } from '~/api/LLM/ollama';

// 定义props
const props = defineProps({
  baseUrl: {
    type: String,
    default: 'http://localhost:11434'
  }
});

// 定义事件
const emit = defineEmits(['close', 'model-installed']);

// 实例化toast
const { showToast } = useToast();

// 步骤状态：input（输入）, installing（安装中）, complete（完成）
const currentStep = ref<'input' | 'installing' | 'complete'>('input');
const modelName = ref('');
const progress = ref(0);
const error = ref('');
const isConfirmOverwrite = ref(false);

// 安装进度信息
const progressInfo = ref<{
  status?: string;
  digest?: string;
  total?: number;
  completed?: number;
}>({});

// 事件源对象用于跟踪下载进度
let eventSource: EventSource | null = null;

// 格式化安装进度
const formatProgress = () => {
  if (!progressInfo.value.total) return '0%';
  
  const percentage = progress.value;
  const completed = progressInfo.value.completed || 0;
  const total = progressInfo.value.total || 1;
  
  // 格式化下载字节大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  return `${percentage.toFixed(0)}% (${formatSize(completed)} / ${formatSize(total)})`;
};

// 缩短digest值以便显示
const shortenDigest = (digest: string) => {
  if (!digest) return '';
  return digest.length > 12 ? `${digest.substring(0, 12)}...` : digest;
};

// 开始安装模型
const startInstallation = async () => {
  if (!modelName.value.trim()) {
    showToast({ 
      type: 'warning', 
      message: '请输入模型名称'
    });
    return;
  }
  
  try {
    // 先检查模型是否已存在
    const existingModels = await getOllamaModels(props.baseUrl);
    const modelExists = existingModels.some(model => {
      // 移除可能的标签部分（例如：llama3:8b -> llama3）
      const inputModelName = modelName.value.trim().split(':')[0].toLowerCase();
      const existingModelName = model.name.split(':')[0].toLowerCase();
      return existingModelName === inputModelName;
    });
    
    if (modelExists) {
      // 显示确认对话框
      isConfirmOverwrite.value = true;
      return;
    }
    
    // 继续执行安装
    startModelDownload();
  } catch (error) {
    console.error('检查模型失败:', error);
    showToast({ 
      type: 'error', 
      message: '无法连接到Ollama服务，请确认服务已启动'
    });
  }
};

// 确认覆盖安装模型
const confirmOverwrite = () => {
  isConfirmOverwrite.value = false;
  startModelDownload();
};

// 取消覆盖安装
const cancelOverwrite = () => {
  isConfirmOverwrite.value = false;
};

// 开始模型下载过程
const startModelDownload = () => {
  currentStep.value = 'installing';
  progress.value = 0;
  error.value = '';
  progressInfo.value = {};
  
  // 创建EventSource连接进行Server-Sent Events监听
  eventSource = new EventSource(`${props.baseUrl}/api/pull?name=${encodeURIComponent(modelName.value.trim())}`);
  
  // 监听进度更新事件
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // 更新进度信息
      if (data.status) progressInfo.value.status = data.status;
      if (data.digest) progressInfo.value.digest = data.digest;
      
      // 计算下载进度
      if (data.total && data.completed) {
        progressInfo.value.total = data.total;
        progressInfo.value.completed = data.completed;
        
        // 更新进度百分比
        progress.value = (data.completed / data.total) * 100;
      }
      
      // 完成安装
      if (data.status === 'success') {
        progress.value = 100;
        closeEventSource();
        // 延迟切换到完成状态以展示100%进度
        setTimeout(() => {
          currentStep.value = 'complete';
        }, 500);
      }
    } catch (err) {
      console.error('解析安装进度数据失败:', err);
    }
  };
  
  // 监听错误
  eventSource.onerror = (err) => {
    console.error('安装模型事件流错误:', err);
    error.value = '安装过程中发生错误，请检查Ollama服务是否正常运行';
    closeEventSource();
  };
};

// 取消安装
const cancelInstallation = () => {
  closeEventSource();
  showToast({ type: 'info', message: '已取消安装' });
  emit('close');
};

// 完成安装
const finishInstallation = () => {
  emit('model-installed');
};

// 关闭事件源连接
const closeEventSource = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
};

// 组件卸载前关闭连接
onBeforeUnmount(() => {
  closeEventSource();
});
</script>

<style scoped>
/* 安装进度条动画 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style> 