<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-6"
    @click.self="handleClose"
  >
    <div
      ref="dialogRef"
      class="bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[88vh] flex flex-col overflow-hidden"
      :style="dialogStyle"
    >
      <div
        class="flex justify-between items-center p-4 border-b border-gray-700 cursor-move select-none"
        @pointerdown="startDrag"
      >
        <h3 class="text-white text-lg font-medium">编辑文本内容</h3>
        <button @click="handleClose" class="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div class="p-4 overflow-y-auto">
      <!-- 文本内容编辑区 -->
      <textarea
        v-model="editData.content"
        class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white min-h-[120px] focus:outline-none focus:border-blue-500"
        placeholder="输入新的文本内容..."
      ></textarea>
      
      <!-- 链接编辑区域 (仅当编辑A标签时显示) -->
      <div v-if="isLinkElement" class="mt-3">
        <label class="text-xs text-gray-400 block mb-1">跳转链接 URL</label>
        <div class="flex items-center gap-2">
          <input
            v-model="editData.href"
            type="text"
            class="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="请输入链接地址，留空则不跳转"
          />
          <select 
            v-model="editData.target" 
            class="bg-gray-700 text-white text-xs rounded px-2 py-2 border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="链接打开方式"
          >
            <option value="_self">当前窗口</option>
            <option value="_blank">新窗口</option>
          </select>
        </div>
      </div>
      
      <!-- 样式工具栏 -->
      <div class="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
        <div class="flex flex-wrap gap-3">
          <!-- 文字颜色选择 -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">文字颜色</label>
            <ColorPicker v-model="editData.style.color" :colorOptions="textColors" />
          </div>
          
          <!-- 字体大小选择 -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">字体大小</label>
            <div class="flex items-center gap-2">
              <button 
                @click="decreaseFontSize" 
                class="w-5 h-5 flex items-center justify-center text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
                title="减小字体"
              >-</button>
              <select 
                v-model="editData.style.fontSize" 
                class="bg-gray-700 text-white text-xs rounded px-1 py-0.5 border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}</option>
              </select>
              <button 
                @click="increaseFontSize" 
                class="w-5 h-5 flex items-center justify-center text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
                title="增大字体"
              >+</button>
            </div>
          </div>
          
          <!-- 字体粗细选择 -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">字体粗细</label>
            <select 
              v-model="editData.style.fontWeight" 
              class="bg-gray-700 text-white text-xs rounded px-2 py-0.5 border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="normal">正常</option>
              <option value="bold">粗体</option>
            </select>
          </div>
          
          <!-- 字体选择 -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">字体</label>
            <select 
              v-model="editData.style.fontFamily" 
              class="bg-gray-700 text-white text-xs rounded px-2 py-0.5 border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option v-for="font in fontFamilies" :key="font.value" :value="font.value">{{ font.name }}</option>
            </select>
          </div>
        </div>
        
        <!-- 预览效果 -->
        <div class="mt-3 p-2 bg-gray-700 rounded text-center overflow-hidden">
          <div 
            class="text-white break-words"
            :style="{
              color: editData.style.color,
              fontSize: editData.style.fontSize,
              fontWeight: editData.style.fontWeight,
              fontFamily: editData.style.fontFamily
            }"
          >
            {{ editData.content || '文本预览' }}
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
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch } from 'vue';
import ColorPicker from './ColorPicker.vue';

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
  },
  content: {
    type: String,
    required: false,
    default: ''
  },
  style: {
    type: Object,
    required: false,
    default: () => ({
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif'
    })
  }
});

// 组件事件
const emit = defineEmits(['update:show', 'save', 'close']);

const dialogRef = ref<HTMLElement | null>(null);
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

// 编辑数据
const editData = reactive({
  content: props.content,
  element: props.element,
  href: '',
  target: '_blank',
  style: {
    color: props.style.color || '#ffffff',
    fontSize: props.style.fontSize || '16px',
    fontWeight: props.style.fontWeight || 'normal',
    fontFamily: props.style.fontFamily || 'Arial, sans-serif'
  }
});

// 预定义的文字颜色选项
const textColors = [
  { name: '白色', value: '#ffffff' },
  { name: '灰色', value: '#9ca3af' },
  { name: '黑色', value: '#000000' },
  { name: '红色', value: '#ef4444' },
  { name: '绿色', value: '#10b981' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '黄色', value: '#f59e0b' },
  { name: '紫色', value: '#8b5cf6' },
];

// 字体大小选项
const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '42px', '48px'];

// 字体选项
const fontFamilies = [
  { name: '默认', value: 'Arial, sans-serif' },
  { name: '微软雅黑', value: "'Microsoft YaHei', sans-serif" },
  { name: '宋体', value: "'SimSun', serif" },
  { name: '黑体', value: "'SimHei', sans-serif" },
  { name: '楷体', value: "'KaiTi', serif" },
  { name: '仿宋', value: "'FangSong', serif" },
  { name: '等线', value: "'DengXian', sans-serif" },
  { name: 'Times', value: "'Times New Roman', serif" },
  { name: 'Georgia', value: "'Georgia', serif" },
  { name: 'Courier', value: "'Courier New', monospace" }
];

// 判断是否为链接元素
const isLinkElement = computed(() => {
  return props.element && props.element.tagName === 'A';
});

// 监听属性变化，更新编辑数据
watch(() => props.show, (newVal) => {
  if (newVal) {
    editData.content = props.content;
    editData.element = props.element;
    editData.style.color = props.style.color || '#ffffff';
    editData.style.fontSize = props.style.fontSize || '16px';
    editData.style.fontWeight = props.style.fontWeight || 'normal';
    editData.style.fontFamily = props.style.fontFamily || 'Arial, sans-serif';
    
    // 如果是链接元素，获取链接地址和打开方式
    if (props.element && props.element.tagName === 'A') {
      editData.href = props.element.getAttribute('href') || '';
      editData.target = props.element.getAttribute('target') || '_blank';
    }
  }
});

// 增大字体大小
const increaseFontSize = () => {
  const currentSize = editData.style.fontSize;
  const currentIndex = fontSizes.indexOf(currentSize);
  if (currentIndex < fontSizes.length - 1) {
    editData.style.fontSize = fontSizes[currentIndex + 1];
  }
};

// 减小字体大小
const decreaseFontSize = () => {
  const currentSize = editData.style.fontSize;
  const currentIndex = fontSizes.indexOf(currentSize);
  if (currentIndex > 0) {
    editData.style.fontSize = fontSizes[currentIndex - 1];
  }
};

// 处理关闭
const handleClose = () => {
  emit('update:show', false);
  emit('close');
};

// 处理保存
const handleSave = () => {
  const saveData = {
    content: editData.content,
    style: { ...editData.style }
  };
  
  // 如果是链接元素，添加链接信息
  if (isLinkElement.value) {
    saveData['href'] = editData.href;
    saveData['target'] = editData.target;
  }
  
  emit('save', saveData);
  emit('update:show', false);
};
</script>

<style scoped>
/* 可以添加组件特定的样式 */
</style> 