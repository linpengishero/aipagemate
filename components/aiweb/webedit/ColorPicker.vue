<template>
  <div class="color-picker">
    <!-- 当前选择的颜色预览 -->
    <div v-if="showSelectedColor" class="flex items-center gap-2 mb-2">
      <div 
        class="w-6 h-6 rounded-full border border-gray-600 shadow-inner"
        :style="{backgroundColor: modelValue}"
        :title="getCurrentColorName()"
      ></div>
      <span class="text-xs text-gray-400">{{ getCurrentColorName() }}</span>
    </div>
    
    <!-- 预设颜色选择 -->
    <div class="flex flex-wrap gap-1.5">
      <button 
        v-for="color in colorOptions" 
        :key="color.value"
        @click="selectColor(color.value)"
        class="w-6 h-6 rounded-full border border-gray-600 transition-transform hover:scale-110 shadow-sm"
        :class="{
          'ring-2 ring-white ring-offset-1 ring-offset-gray-800': modelValue === color.value,
          'opacity-30': color.value === 'transparent'
        }"
        :style="{backgroundColor: color.value !== 'transparent' ? color.value : '#ffffff'}"
        :title="color.name"
      >
        <span v-if="color.value === 'transparent'" class="block w-full h-full relative">
          <span class="absolute inset-0 flex items-center justify-center">
            <svg class="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </span>
        </span>
      </button>
      
      <!-- 自定义颜色选择器 -->
      <div class="relative w-6 h-6">
        <input 
          type="color" 
          :value="modelValue !== 'transparent' ? modelValue : '#ffffff'"
          @input="selectColor($event.target.value)"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="自定义颜色"
        >
        <div 
          class="w-6 h-6 rounded-full border border-gray-600 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 flex items-center justify-center"
          :class="{'ring-2 ring-white ring-offset-1 ring-offset-gray-800': isCustomColor}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
    
    <!-- 透明选项 -->
    <div v-if="showTransparentOption" class="mt-2">
      <button 
        @click="selectColor('transparent')"
        class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        :class="{'text-blue-400 hover:text-blue-300': modelValue === 'transparent'}"
      >
        <span 
          class="block w-4 h-4 rounded border border-gray-600 relative"
          :class="{'ring-1 ring-blue-400': modelValue === 'transparent'}"
        >
          <span class="absolute inset-0 bg-gray-300 bg-opacity-20"></span>
          <span class="absolute inset-0 flex items-center justify-center">
            <svg v-if="modelValue === 'transparent'" class="w-3 h-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </span>
        </span>
        透明
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  colorOptions: {
    type: Array as () => Array<{name: string, value: string}>,
    default: () => [
      { name: '白色', value: '#ffffff' },
      { name: '黑色', value: '#000000' },
      { name: '灰色', value: '#6b7280' },
      { name: '红色', value: '#ef4444' },
      { name: '橙色', value: '#f97316' },
      { name: '黄色', value: '#f59e0b' },
      { name: '绿色', value: '#10b981' },
      { name: '青色', value: '#06b6d4' },
      { name: '蓝色', value: '#3b82f6' },
      { name: '紫色', value: '#8b5cf6' },
      { name: '粉色', value: '#ec4899' }
    ]
  },
  showTransparentOption: {
    type: Boolean,
    default: true
  },
  showSelectedColor: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

// 判断当前是否为自定义颜色
const isCustomColor = computed(() => {
  if (props.modelValue === 'transparent') return false;
  return !props.colorOptions.some(color => color.value === props.modelValue);
});

// 获取当前颜色名称
const getCurrentColorName = () => {
  if (props.modelValue === 'transparent') return '透明';
  
  const foundColor = props.colorOptions.find(color => color.value === props.modelValue);
  if (foundColor) return foundColor.name;
  
  return '自定义颜色';
};

// 选择颜色
const selectColor = (color: string) => {
  emit('update:modelValue', color);
};
</script>

<style scoped>
/* 自定义颜色选择器样式 */
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}
input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
}
input[type="color"]::-moz-color-swatch {
  border: none;
  border-radius: 50%;
}
</style> 