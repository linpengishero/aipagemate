<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="closeDialog"></div>
    
    <!-- 对话框内容 -->
    <div class="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md mx-4 z-10 overflow-hidden">
      <!-- 标题栏 -->
      <div class="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-medium text-white">项目打包选项</h3>
        <button @click="closeDialog" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-xl" />
        </button>
      </div>
      
      <!-- 选项区域 -->
      <div class="px-5 py-4 space-y-4">
        <!-- 前端框架选择 -->
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">前端框架</label>
          <select 
            v-model="selectedFramework" 
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="vue3">Vue 3</option>
            <option value="html">Static HTML</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">
            选择打包项目使用的前端框架
          </p>
        </div>
        
        <!-- CSS框架选择 -->
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">CSS框架</label>
          <select 
            v-model="selectedCssFramework" 
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="none">Native CSS</option>
            <option value="tailwind">Tailwind CSS</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">
            Only Native CSS and Tailwind CSS are supported.
          </p>
        </div>
        

        <!-- SEO优化 -->
        <div>
          <div class="flex items-center">
            <input 
              id="seo-support" 
              v-model="seoSupport" 
              type="checkbox" 
              class="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            >
            <label for="seo-support" class="ml-2 text-sm font-medium text-gray-300">
              SEO优化
            </label>
          </div>
          <p class="text-xs text-gray-400 mt-1 ml-6">
            添加SEO相关的元标签和优化
          </p>
        </div>
        
        <!-- 项目名称 -->
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">项目名称</label>
          <input 
            v-model="projectName" 
            type="text" 
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入项目名称"
          >
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="px-5 py-4 border-t border-gray-700 flex justify-end space-x-3">
        <button 
          @click="closeDialog" 
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          取消
        </button>
        <button 
          @click="handlePackage" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center transition-colors"
          :disabled="!isFormValid || isProcessing"
        >
          <span>{{ isProcessing ? '处理中...' : '打包项目' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import webProjectStore from '~/utils/webDB/WebProjectStorage';
import { runProjectPackagePipeline, type PackageTarget } from '~/utils/aiweb/workflows';
import { usePrompt } from '~/composables/usePrompt';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'processing-start', 'processing-end']);
const { notify } = usePrompt();

// 表单数据
const selectedFramework = ref('vue3');
const selectedCssFramework = ref('none');
const seoSupport = ref(false);
const projectName = ref('');
const isProcessing = ref(false);


// 表单验证
const isFormValid = computed(() => {
  return projectName.value.trim() !== '';
});

// 监听项目ID变化，自动设置项目名称
watch(() => props.projectId, async (newVal) => {
  if (newVal) {
    const project = await webProjectStore.getProject(newVal);
    if (project) {
      projectName.value = project.name || '';
    }
  }
});

// 监听模态框显示状态，重置选项
watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    selectedFramework.value = 'vue3';
    selectedCssFramework.value = 'none';
    seoSupport.value = false;
    
    // 尝试获取项目信息并设置名称
    if (props.projectId) {
      const project = await webProjectStore.getProject(props.projectId);
      if (project) {
        projectName.value = project.name || '';
      }
    }
  }
});

// 监听前端框架变化，自动调整CSS框架选项
watch(() => selectedFramework.value, () => {
  if (!['none', 'tailwind'].includes(selectedCssFramework.value)) {
    selectedCssFramework.value = 'none';
  }
});

// 初始化时尝试获取项目名称
onMounted(async () => {
  if (props.projectId) {
    const project = await webProjectStore.getProject(props.projectId);
    if (project) {
      projectName.value = project.name || '';
    }
  }
});

// 关闭对话框
const closeDialog = () => {
  emit('processing-end');
  emit('update:modelValue', false);
};

// 显示消息提示（统一提示层）
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  notify(message, type);
};

// 处理打包请求（统一走 packageProject workflow）
const handlePackage = async () => {
  if (!isFormValid.value) return;
  if (!props.projectId) {
    showToast('缺少项目ID，无法打包', 'error');
    return;
  }

  isProcessing.value = true;
  emit('processing-start');

  try {
    const project = await webProjectStore.getProject(props.projectId);
    if (!project) {
      throw new Error('找不到当前项目信息');
    }

    const target = selectedFramework.value as PackageTarget;

    showToast(`开始打包 ${target} 项目...`);

    const result = await runProjectPackagePipeline({
      projectId: props.projectId,
      projectName: projectName.value,
      target,
      cssFramework: selectedCssFramework.value as 'none' | 'tailwind',
      seoSupport: seoSupport.value,
      metadata: {
        description: `${project.name} - ${target} project package`,
        author: '',
        keywords: `${target},web,export`,
      },
    });

    if (!result.ok) {
      throw new Error(`[${result.code}] ${result.error}`);
    }

    showToast(`项目 "${projectName.value}" 打包成功。`, 'success');
    closeDialog();
  } catch (error: any) {
    console.error('项目打包失败:', error);
    showToast(`打包失败: ${error.message || '未知错误'}`, 'error');
  } finally {
    isProcessing.value = false;
    emit('processing-end');
  }
};
</script> 