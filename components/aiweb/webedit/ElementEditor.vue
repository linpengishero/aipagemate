<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-6"
    @click.self="handleClose"
  >
    <div class="bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[88vh] flex flex-col overflow-hidden" :style="dialogStyle">
      <div class="flex justify-between items-center p-4 border-b border-gray-700 cursor-move select-none" @pointerdown="startDrag">
        <h3 class="text-white text-lg font-medium">Edit Element Style</h3>
        <button @click="handleClose" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="h-5 w-5" />
        </button>
      </div>
      
      <div class="p-4 overflow-y-auto">
      <!-- 元素标签信息 -->
      <div class="bg-gray-700 rounded-lg p-2 mb-4 flex items-center justify-between">
        <div class="flex items-center">
          <span class="text-blue-400 text-sm font-mono mr-2">&lt;{{ tagName }}&gt;</span>
          <span v-if="elementId" class="text-yellow-400 text-xs mr-2">#{{ elementId }}</span>
          <span v-if="elementClass" class="text-green-400 text-xs">.{{ elementClass }}</span>
        </div>
        <span class="text-gray-400 text-xs">{{ elementTypeDisplay }}</span>
      </div>
      
      <!-- 样式编辑区域 -->
      <div class="space-y-4">
        <!-- 导航标签 -->
        <div class="flex border-b border-gray-700">
          <button 
            v-for="tab in ['basic', 'background']" 
            :key="tab"
            @click="currentTab = tab"
            class="py-2 px-4 text-sm relative"
            :class="currentTab === tab ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'"
          >
            {{ tab === 'basic' ? 'Basic Styles' : 'Background Image' }}
            <div v-if="currentTab === tab" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
          </button>
        </div>
        
        <!-- 基础样式标签内容 -->
        <div v-if="currentTab === 'basic'" class="space-y-4">
          <!-- Background Color -->
          <div>
            <label class="text-xs text-gray-400 block mb-1">Background Color</label>
            <ColorPicker
              v-model="editData.style.backgroundColor"
              :colorOptions="bgColors"
              :showTransparentOption="true"
            />
          </div>
          
          <!-- Border Radius设置 -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs text-gray-400">Border Radius</label>
              <span class="text-xs text-gray-400">{{ editData.style.borderRadius }}</span>
            </div>
            <input
              type="range"
              v-model="editData.style.borderRadiusValue"
              min="0"
              max="50"
              step="1"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              @input="updateBorderRadius"
            />
          </div>
          
          <!-- Opacity设置 -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs text-gray-400">Opacity</label>
              <span class="text-xs text-gray-400">{{ Math.round(Number(editData.style.opacityValue) * 100) }}%</span>
            </div>
            <input
              type="range"
              v-model="editData.style.opacityValue"
              min="0"
              max="1"
              step="0.01"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              @input="updateOpacity"
            />
          </div>
          
          <!-- 宽高设置 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-400 block mb-1">Width</label>
              <div class="flex">
                <input
                  type="text"
                  v-model="editData.style.width"
                  class="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="auto"
                />
                <select 
                  v-model="editData.style.widthUnit" 
                  class="ml-1 bg-gray-700 text-white text-xs rounded px-1 py-2 border-none focus:outline-none"
                  @change="updateWidthWithUnit"
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="auto">auto</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-xs text-gray-400 block mb-1">Height</label>
              <div class="flex">
                <input
                  type="text"
                  v-model="editData.style.height"
                  class="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="auto"
                />
                <select 
                  v-model="editData.style.heightUnit" 
                  class="ml-1 bg-gray-700 text-white text-xs rounded px-1 py-2 border-none focus:outline-none"
                  @change="updateHeightWithUnit"
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="auto">auto</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 背景图片设置区域 -->
        <div v-if="currentTab === 'background'" class="space-y-4">
          <!-- 图片来源选择 -->
          <div class="bg-gray-850 rounded-lg p-3 border border-gray-600/60">
            <label class="text-sm text-white font-medium mb-2 block">Select Image Source</label>
            <div class="flex space-x-1.5">
              <button 
                v-for="source in ['link', 'upload']"
                :key="source"
                @click="imgSource = source"
                class="flex-1 py-2 px-1 text-xs rounded-md transition-all duration-200 flex items-center justify-center"
                :class="imgSource === source ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
              >
                <Icon v-if="source === 'link'" icon="mdi:link" class="mr-1.5 h-4 w-4" />
                <Icon v-else icon="mdi:cloud-upload" class="mr-1.5 h-4 w-4" />
                {{ source === 'link' ? 'Image URL' : 'Upload Local File' }}
              </button>
            </div>
            
            <!-- 链接输入 -->
            <div v-if="imgSource === 'link'" class="mt-3">
              <div class="relative flex">
                <input
                  type="text"
                  v-model="tempImgUrl"
                  placeholder="请输入图片URL地址"
                  class="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button 
                  @click="applyImageURL"
                  class="ml-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500 flex items-center"
                >
                  <Icon icon="mdi:check" class="mr-1 h-4 w-4" />
                  应用
                </button>
              </div>
            </div>
            
            <!-- 文件上传 -->
            <div v-if="imgSource === 'upload'" class="mt-3">
              <label class="w-full h-24 flex flex-col items-center justify-center border border-dashed border-gray-500 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-900/10 transition-all">
                <Icon icon="mdi:cloud-upload" class="h-8 w-8 text-blue-400 mb-2" />
                <span class="text-sm text-gray-300">点击或拖拽上传图片</span>
                <span class="text-xs text-gray-500 mt-1">支持JPG、PNG、SVG格式</span>
                <input type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
              </label>
            </div>
          </div>
          
          <!-- 无图片提示 -->
          <div v-if="!editData.style.backgroundImage || editData.style.backgroundImage === 'none'" 
              class="bg-gray-850 rounded-lg p-6 border border-gray-600/60 flex flex-col items-center justify-center">
            <Icon icon="mdi:image-off" class="h-12 w-12 text-gray-500 mb-3" />
            <p class="text-gray-300 text-sm font-medium">未设置背景图片</p>
            <p class="text-gray-500 text-xs mt-1 text-center">请从上方选择图片来源添加背景图片</p>
          </div>
          
          <!-- 图片设置区域 -->
          <div v-else class="space-y-4">
            <!-- 背景图片透明度设置 -->
            <div class="bg-gray-850 rounded-lg p-3 border border-gray-600/60">
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm text-white font-medium flex items-center">
                  <Icon icon="mdi:opacity" class="mr-1.5 h-4 w-4 text-blue-400" />
                  背景图片透明度
                </label>
                <div class="flex items-center space-x-2">
                  <span class="text-xs bg-gray-700 px-2 py-0.5 rounded font-mono">{{ Math.round(editData.style.backgroundOpacity * 100) }}%</span>
                  <button @click="clearBackgroundImage" class="text-xs text-red-400 hover:text-red-300 flex items-center">
                    <Icon icon="mdi:delete" class="h-3.5 w-3.5 mr-1" />
                    删除图片
                  </button>
                </div>
              </div>
              <input
                type="range"
                v-model="editData.style.backgroundOpacity"
                min="0"
                max="1"
                step="0.01"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer custom-slider"
                @input="updateBackgroundOpacity"
              />
            </div>
            
            <!-- 背景尺寸和平铺设置 -->
            <div class="grid gap-4 grid-cols-1">
              <!-- 背景尺寸设置 -->
              <div class="bg-gray-850 rounded-lg p-3 border border-gray-600/60">
                <label class="text-sm text-white font-medium flex items-center mb-2">
                  <Icon icon="mdi:image-size-select-large" class="mr-1.5 h-4 w-4 text-blue-400" />
                  背景尺寸
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="size in backgroundSizeOptions"
                    :key="size.value"
                    @click="setBackgroundSize(size.value)"
                    class="py-2 text-xs rounded-md flex items-center justify-center transition-colors"
                    :class="editData.style.backgroundSize === size.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                  >
                    <Icon v-if="size.value === 'contain'" icon="mdi:image-size-select-small" class="mr-1.5 h-4 w-4" />
                    <Icon v-else-if="size.value === 'cover'" icon="mdi:image-size-select-large" class="mr-1.5 h-4 w-4" />
                    <Icon v-else-if="size.value === 'auto'" icon="mdi:image-size-select-actual" class="mr-1.5 h-4 w-4" />
                    <Icon v-else icon="mdi:arrow-expand-all" class="mr-1.5 h-4 w-4" />
                    {{ size.label }}
                  </button>
                </div>
              </div>
              
              <!-- 背景平铺设置 -->
              <div class="bg-gray-850 rounded-lg p-3 border border-gray-600/60">
                <label class="text-sm text-white font-medium flex items-center mb-2">
                  <Icon icon="mdi:view-grid" class="mr-1.5 h-4 w-4 text-blue-400" />
                  背景平铺方式
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="repeat in backgroundRepeatOptions"
                    :key="repeat.value"
                    @click="setBackgroundRepeat(repeat.value)"
                    class="py-2 text-xs rounded-md flex items-center justify-center transition-colors relative"
                    :class="editData.style.backgroundRepeat === repeat.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                  >
                    <Icon v-if="repeat.value === 'no-repeat'" icon="mdi:chart-bubble" class="mr-1.5 h-4 w-4" />
                    <Icon v-else-if="repeat.value === 'repeat'" icon="mdi:view-grid" class="mr-1.5 h-4 w-4" />
                    <Icon v-else-if="repeat.value === 'repeat-x'" icon="mdi:view-array" class="mr-1.5 h-4 w-4" />
                    <Icon v-else-if="repeat.value === 'repeat-y'" icon="mdi:view-column" class="mr-1.5 h-4 w-4" />
                    {{ repeat.label }}
                    <span v-if="editData.style.backgroundRepeat === repeat.value" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      </div>

      <div class="flex justify-end p-4 border-t border-gray-700 bg-gray-800 space-x-3 shrink-0">
        <button 
          @click="handleClose"
          class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          取消
        </button>
        <button 
          @click="handleSave"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          应用
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch } from 'vue';
import ColorPicker from './ColorPicker.vue';
import { Icon } from '@iconify/vue';

// 组件属性
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
    default: false
  },
  element: {
    type: Object as () => HTMLElement | null,
    required: false,
    default: null
  }
});

// 组件事件
const emit = defineEmits(['update:show', 'save', 'close']);

// UI状态
const currentTab = ref('basic');
const imgSource = ref('link');
const tempImgUrl = ref('');

const dragState = reactive({
  dragging: false,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
});

const dialogStyle = computed(() => ({
  transform: `translate(${dragState.offsetX}px, ${dragState.offsetY}px)`,
}));

const startDrag = (event: PointerEvent) => {
  dragState.dragging = true;
  dragState.startX = event.clientX - dragState.offsetX;
  dragState.startY = event.clientY - dragState.offsetY;
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', stopDrag);
};

const onDrag = (event: PointerEvent) => {
  if (!dragState.dragging) return;
  dragState.offsetX = event.clientX - dragState.startX;
  dragState.offsetY = event.clientY - dragState.startY;
};

const stopDrag = () => {
  dragState.dragging = false;
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', stopDrag);
};

// 元素标签和属性信息
const tagName = computed(() => props.element?.tagName.toLowerCase() || 'div');
const elementId = computed(() => props.element?.id || '');
const elementClass = computed(() => {
  const classList = props.element?.className.toString() || '';
  return Array.from(classList.split(' '))
    .filter(cls => cls && !cls.includes('element-selected'))
    .join(' ');
});
const elementTypeDisplay = computed(() => {
  const tag = tagName.value;
  if (tag === 'div') return '容器元素';
  if (tag === 'span') return '行内元素';
  if (tag === 'p') return '段落元素';
  if (tag === 'img') return '图片元素';
  if (tag === 'a') return '链接元素';
  if (tag === 'button') return '按钮元素';
  if (tag === 'ul' || tag === 'ol' || tag === 'li') return '列表元素';
  if (tag.startsWith('h')) return '标题元素';
  return '页面元素';
});

// 预定义背景颜色选项
const bgColors = [
  { name: '透明', value: 'transparent' },
  { name: '白色', value: '#ffffff' },
  { name: '黑色', value: '#000000' },
  { name: '灰色', value: '#6b7280' },
  { name: '红色', value: '#ef4444' },
  { name: '绿色', value: '#10b981' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '黄色', value: '#f59e0b' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '青色', value: '#06b6d4' },
  { name: '粉色', value: '#ec4899' },
];

// 提取单位和数值
const extractUnitAndValue = (value: string): { value: string, unit: string } => {
  if (value === 'auto' || value === '') return { value: '', unit: 'auto' };
  if (value.endsWith('%')) return { value: value.slice(0, -1), unit: '%' };
  if (value.endsWith('px')) return { value: value.slice(0, -2), unit: 'px' };
  return { value, unit: 'px' }; // 默认使用像素
};

// 编辑数据
const editData = reactive({
  element: props.element,
  style: {
    backgroundColor: 'transparent',
    borderRadius: '0px',
    borderRadiusValue: 0,
    opacity: '1',
    opacityValue: 1,
    width: '',
    widthUnit: 'auto',
    height: '',
    heightUnit: 'auto',
    backgroundImage: 'none',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundOpacity: 1
  }
});

// 监听属性变化，更新编辑数据
watch(() => props.show, (newVal) => {
  if (newVal && props.element) {
    // 获取当前元素的样式
    const computedStyle = window.getComputedStyle(props.element);
    
    // 背景颜色
    editData.style.backgroundColor = computedStyle.backgroundColor || 'transparent';
    if (editData.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
      editData.style.backgroundColor = 'transparent';
    }
    
    // 圆角
    const borderRadius = computedStyle.borderRadius;
    editData.style.borderRadius = borderRadius || '0px';
    editData.style.borderRadiusValue = parseInt(borderRadius) || 0;
    
    // 透明度
    const opacity = computedStyle.opacity;
    editData.style.opacity = opacity || '1';
    editData.style.opacityValue = parseFloat(opacity) || 1;
    
    // 宽度
    const width = computedStyle.width;
    const widthData = extractUnitAndValue(width);
    editData.style.width = widthData.value;
    editData.style.widthUnit = widthData.unit;
    
    // 高度
    const height = computedStyle.height;
    const heightData = extractUnitAndValue(height);
    editData.style.height = heightData.value;
    editData.style.heightUnit = heightData.unit;

    // 背景图片
    const bgImage = computedStyle.backgroundImage;
    editData.style.backgroundImage = bgImage === 'none' ? 'none' : bgImage;
    
    // 背景尺寸
    editData.style.backgroundSize = computedStyle.backgroundSize || 'cover';
    
    // 背景重复
    editData.style.backgroundRepeat = computedStyle.backgroundRepeat || 'no-repeat';
    
    // 背景位置 - 保持默认值
    editData.style.backgroundPosition = 'center';
    
    // 背景图片透明度
    editData.style.backgroundOpacity = 1;
    const bgOpacity = props.element.dataset.backgroundOpacity;
    if (bgOpacity) {
      editData.style.backgroundOpacity = parseFloat(bgOpacity);
    }
  }
});

// 修改currentTab监听器，确保每次切换到背景选项卡时刷新背景设置
watch(() => currentTab.value, (newTab) => {
  if (newTab === 'background' && props.element) {
    // 重新读取元素当前的背景样式
    const computedStyle = window.getComputedStyle(props.element);
    
    // 更新背景相关设置
    editData.style.backgroundImage = computedStyle.backgroundImage || 'none';
    editData.style.backgroundSize = computedStyle.backgroundSize || 'cover';
    editData.style.backgroundRepeat = computedStyle.backgroundRepeat || 'no-repeat';
    
    // 设置背景透明度
    const bgOpacity = props.element.dataset.backgroundOpacity;
    editData.style.backgroundOpacity = bgOpacity ? parseFloat(bgOpacity) : 1;
  }
});

// 更新圆角
const updateBorderRadius = () => {
  editData.style.borderRadius = `${editData.style.borderRadiusValue}px`;
};

// 更新透明度
const updateOpacity = () => {
  editData.style.opacity = editData.style.opacityValue.toString();
};

// 更新宽度
const updateWidthWithUnit = () => {
  if (editData.style.widthUnit === 'auto') {
    editData.style.width = '';
  }
};

// 更新高度
const updateHeightWithUnit = () => {
  if (editData.style.heightUnit === 'auto') {
    editData.style.height = '';
  }
};

// 获取带单位的样式值
const getStyleWithUnit = (value: string, unit: string): string => {
  if (unit === 'auto') return 'auto';
  if (!value) return 'auto';
  return `${value}${unit}`;
};

// 应用图片URL
const applyImageURL = () => {
  if (tempImgUrl.value) {
    editData.style.backgroundImage = `url(${tempImgUrl.value})`;
  }
};

// 处理图片上传
const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        editData.style.backgroundImage = `url(${e.target.result})`;
      }
    };
    
    reader.readAsDataURL(file);
  }
};

// 清除背景图片
const clearBackgroundImage = () => {
  editData.style.backgroundImage = 'none';
};

// 背景尺寸选项
const backgroundSizeOptions = [
  { label: '覆盖', value: 'cover' },
  { label: '包含', value: 'contain' },
  { label: '原始', value: 'auto' },
  { label: '拉伸', value: '100% 100%' }
];

// 背景平铺选项
const backgroundRepeatOptions = [
  { label: '不平铺', value: 'no-repeat' },
  { label: '平铺', value: 'repeat' },
  { label: '横向', value: 'repeat-x' },
  { label: '纵向', value: 'repeat-y' }
];

// 设置背景尺寸
const setBackgroundSize = (size: string) => {
  editData.style.backgroundSize = size;
  applyBackgroundSettings();
};

// 设置背景平铺方式
const setBackgroundRepeat = (repeat: string) => {
  editData.style.backgroundRepeat = repeat;
  applyBackgroundSettings();
};

// 应用背景设置到元素
const applyBackgroundSettings = () => {
  if (!props.element || !props.show) return;
  
  if (editData.style.backgroundImage && editData.style.backgroundImage !== 'none') {
    props.element.style.backgroundSize = editData.style.backgroundSize;
    props.element.style.backgroundRepeat = editData.style.backgroundRepeat;
    props.element.style.backgroundPosition = 'center'; // 默认居中
    applyBackgroundOpacity();
  }
};

// 更新背景图片透明度
const updateBackgroundOpacity = () => {
  applyBackgroundOpacity();
};

// 应用背景透明度
const applyBackgroundOpacity = () => {
  if (!props.element) return;
  
  const opacity = editData.style.backgroundOpacity;
  props.element.style.setProperty('--bg-opacity', opacity.toString());
  props.element.dataset.backgroundOpacity = opacity.toString();
  
  if (opacity < 1) {
    props.element.style.position = props.element.style.position || 'relative';
    props.element.setAttribute('data-has-bg-opacity', 'true');
  } else {
    props.element.removeAttribute('data-has-bg-opacity');
  }
};

// 格式化背景图片
const formatBackgroundImage = (backgroundImage: string): string => {
  return backgroundImage !== 'none' ? backgroundImage : 'none';
};

// 处理关闭
const handleClose = () => {
  emit('update:show', false);
  emit('close');
};

// 处理保存
const handleSave = () => {
  const styleData = {
    backgroundColor: editData.style.backgroundColor,
    borderRadius: editData.style.borderRadius,
    opacity: editData.style.opacity,
    width: getStyleWithUnit(editData.style.width, editData.style.widthUnit),
    height: getStyleWithUnit(editData.style.height, editData.style.heightUnit),
    backgroundImage: editData.style.backgroundImage,
    backgroundSize: editData.style.backgroundSize,
    backgroundRepeat: editData.style.backgroundRepeat,
    backgroundPosition: 'center' // 始终使用居中
  };
  
  // 应用所有背景设置
  applyBackgroundSettings();
  
  emit('save', { style: styleData });
  emit('update:show', false);
};
</script>

<style scoped>
/* 自定义range滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

/* 添加棋盘格背景样式，用于预览透明背景图片 */
.bg-checkerboard {
  background-image: 
    linear-gradient(45deg, #3a3a3a 25%, transparent 25%), 
    linear-gradient(-45deg, #3a3a3a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #3a3a3a 75%),
    linear-gradient(-45deg, transparent 75%, #3a3a3a 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  background-color: #2a2a2a;
}

/* 添加自定义背景色 */
.bg-gray-850 {
  background-color: #1e2029;
}

/* 自定义动画和过渡效果 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* 优化滑块样式 */
input[type="range"].custom-slider {
  height: 6px;
  background: linear-gradient(to right, #3b82f6, #6366f1);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) inset;
}

/* 为背景透明度准备的样式 */
[data-has-bg-opacity="true"]::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-image: inherit;
  background-size: inherit;
  background-position: inherit;
  background-repeat: inherit;
  opacity: var(--bg-opacity, 1);
}
</style> 