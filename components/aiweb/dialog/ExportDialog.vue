<template>
  <div v-if="modelValue" class="fixed inset-0 flex items-center justify-center z-50">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="closeDialog"></div>
    
    <!-- 对话框 -->
    <div class="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md mx-4 z-10 overflow-hidden">
      <!-- 标题栏 -->
      <div class="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-medium text-white">导出页面设置</h3>
        <button @click="closeDialog" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-xl" />
        </button>
      </div>
      
      <!-- 表单内容 -->
      <div class="px-5 py-4">
        <!-- 前端框架选择 -->
        <div class="mb-4">
          <label class="block text-gray-300 text-sm font-medium mb-2">前端框架</label>
          <select 
            v-model="selectedFramework" 
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="framework in frameworks" :key="framework.value" :value="framework.value">
              {{ framework.label }}
            </option>
          </select>
          <p class="text-xs text-gray-400 mt-1">{{ getFrameworkDescription(selectedFramework) }}</p>
        </div>
        

        <!-- 样式框架选择 -->
        <div class="mb-4">
          <label class="block text-gray-300 text-sm font-medium mb-2">样式框架</label>
          <select 
            v-model="selectedCssFramework" 
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="framework in availableCssFrameworks" :key="framework.value" :value="framework.value">
              {{ framework.label }}
            </option>
          </select>
          <p class="text-xs text-gray-400 mt-1">{{ getCssFrameworkDescription(selectedCssFramework) }}</p>
        </div>
        
        <!-- SEO选项 -->
        <div class="mb-4">
          <div class="flex items-center">
            <input 
              id="generate-seo" 
              v-model="generateSEO" 
              type="checkbox" 
              class="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            >
            <label for="generate-seo" class="ml-2 block text-sm font-medium text-gray-300">
              生成SEO信息
            </label>
          </div>
          <p class="text-xs text-gray-400 mt-1 ml-6">
            自动添加适合所选框架的元数据、标题和描述标签，优化搜索引擎收录
          </p>
        </div>
        
        <!-- 文件名 -->
        <div class="mb-4">
          <label class="block text-gray-300 text-sm font-medium mb-2">文件名</label>
          <input 
            v-model="fileName" 
            type="text" 
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入文件名（不含扩展名）"
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
          @click="handleExport" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          :disabled="!isFormValid"
        >
          导出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  pageName: {
    type: String,
    default: 'page'
  }
});

const emit = defineEmits(['update:modelValue', 'export']);

// 表单数据
const selectedFramework = ref('vue3');
const selectedCssFramework = ref('css');
const fileName = ref(props.pageName || 'page');
const generateSEO = ref(false);
const typescriptSupport = ref(false);

// 框架选项及描述
const frameworks = [
  {
    label: 'Vue 3',
    value: 'vue3',
    description: 'Vue 3 single-file component export.'
  },
  {
    label: 'Static HTML',
    value: 'html',
    description: 'Pure static HTML page export.'
  }
];

// CSS框架选项及描述
const cssFrameworks = [
  {
    label: 'Native CSS',
    value: 'css',
    description: 'Standard CSS without extra framework.',
    compatibleWith: ['vue3', 'html']
  },
  {
    label: 'Tailwind CSS',
    value: 'tailwindcss',
    description: 'Utility-first CSS framework.',
    compatibleWith: ['vue3', 'html']
  }
];

// 根据当前选择的前端框架筛选可用的CSS框架
const availableCssFrameworks = computed(() => {
  return cssFrameworks.filter(framework => 
    framework.compatibleWith.includes(selectedFramework.value)
  );
});

// 监听前端框架变化，自动调整CSS框架选择
watch(selectedFramework, (newValue) => {
  // 如果当前选择的CSS框架与新的前端框架不兼容，则自动切换为原生CSS
  const isCurrentCssFrameworkCompatible = cssFrameworks.find(
    f => f.value === selectedCssFramework.value
  )?.compatibleWith.includes(newValue);
  
  if (!isCurrentCssFrameworkCompatible) {
    selectedCssFramework.value = 'css';
  }
  
  // 当切换框架时，重置TypeScript支持选项
  if (newValue !== 'vue3') {
    typescriptSupport.value = false;
  }
});

// 表单验证
const isFormValid = computed(() => {
  return fileName.value.trim() !== '';
});

// 获取文件扩展名
const getFileExtension = computed(() => {
  // 如果选择了Vue3并启用TypeScript支持，返回.tsx扩展名
  if (selectedFramework.value === 'vue3' && typescriptSupport.value) {
    return '.vue';
  }
  
  switch (selectedFramework.value) {
    case 'vue3':
    case 'vue2':
      return '.vue';
    case 'react':
      return '.jsx';
    case 'html':
    default:
      return '.html';
  }
});

// 获取框架描述
const getFrameworkDescription = (value: string) => {
  const framework = frameworks.find(f => f.value === value);
  return framework ? framework.description : '';
};

// 获取CSS框架描述
const getCssFrameworkDescription = (value: string) => {
  const cssFramework = cssFrameworks.find(f => f.value === value);
  return cssFramework ? cssFramework.description : '';
};

// 当页面名称改变时，更新文件名
watch(() => props.pageName, (newValue) => {
  if (newValue) {
    fileName.value = newValue;
  }
});

// 关闭对话框
const closeDialog = () => {
  emit('update:modelValue', false);
};

// 处理导出
const handleExport = () => {
  emit('export', {
    framework: selectedFramework.value,
    cssFramework: selectedCssFramework.value,
    fileName: fileName.value,
    fileExtension: getFileExtension.value,
    generateSEO: generateSEO.value,
    typescriptSupport: typescriptSupport.value
  });
  closeDialog();
};
</script> 