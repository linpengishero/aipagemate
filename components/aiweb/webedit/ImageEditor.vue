<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-6"
    @click.self="handleClose"
  >
    <div class="bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[88vh] flex flex-col overflow-hidden" :style="dialogStyle">
      <div class="flex justify-between items-center p-4 border-b border-gray-700 cursor-move select-none" @pointerdown="startDrag">
        <h3 class="text-white text-lg font-medium">Edit Image</h3>
        <button @click="handleClose" class="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div class="p-4 overflow-y-auto">
      <div class="space-y-4">
        <!-- 图片预览 -->
        <div class="flex justify-center">
          <div 
            class="relative bg-gray-900 rounded-lg overflow-auto flex items-center justify-center border border-gray-700"
            style="min-height: 200px; max-height: 300px;"
            :style="{
              borderRadius: editData.style.borderRadius
            }"
          >
            <img 
              v-if="editData.previewUrl" 
              :src="editData.previewUrl" 
              class="object-contain"
              :style="{
                borderRadius: editData.style.borderRadius,
                opacity: editData.style.opacity,
                width: editData.style.width,
                height: editData.style.height
              }"
            />
            <div v-else class="text-gray-500 text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No image preview available</p>
            </div>
          </div>
        </div>
        
        <!-- 上传图片 -->
        <div class="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p class="text-xs text-gray-400 mb-2">Choose a local image to upload</p>
          <input 
            type="file" 
            accept="image/*" 
            @change="handleImageUpload" 
            class="block w-full text-sm text-gray-400
              file:mr-3 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-xs file:font-medium
              file:bg-gray-700 file:text-white
              hover:file:bg-gray-600
              cursor-pointer"
          />
        </div>
        
        <!-- 图片链接 -->
        <div class="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p class="text-xs text-gray-400 mb-2">Or enter an image URL</p>
          <div class="flex gap-2">
            <input 
              v-model="editData.imageUrl" 
              type="text" 
              placeholder="Enter image URL" 
              class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button 
              @click="applyImageUrl" 
              class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              应用
            </button>
          </div>
        </div>
        
        <!-- 图片样式控制 -->
        <div class="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <div class="space-y-3">
            <!-- 尺寸调整 -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs text-gray-400">图片尺寸</label>
                <div class="flex items-center">
                  <input 
                    type="checkbox" 
                    id="maintain-ratio" 
                    v-model="editData.maintainAspectRatio"
                    class="mr-1 h-3 w-3 accent-blue-500"
                  />
                  <label for="maintain-ratio" class="text-xs text-gray-400">保持比例</label>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <div class="flex items-center justify-between">
                    <label class="text-xs text-gray-400">宽度 (px)</label>
                    <span class="text-xs text-white"></span>
                  </div>
                  <input 
                    type="number" 
                    v-model="editData.style.widthValue" 
                    min="10" 
                    max="2000" 
                    step="1"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500 mt-1"
                    @input="updateDimensions('width')"
                  />
                </div>
                <div>
                  <div class="flex items-center justify-between">
                    <label class="text-xs text-gray-400">高度 (px)</label>
                    <span class="text-xs text-white"></span>
                  </div>
                  <input 
                    type="number" 
                    v-model="editData.style.heightValue" 
                    min="10" 
                    max="2000" 
                    step="1"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500 mt-1"
                    @input="updateDimensions('height')"
                  />
                </div>
              </div>
            </div>
            
            <!-- 圆角控制 -->
            <div>
              <div class="flex justify-between items-center">
                <label class="text-xs text-gray-400">圆角 (px)</label>
                <span class="text-xs text-white">{{ editData.style.borderRadius }}</span>
              </div>
              <input 
                type="range" 
                v-model="editData.style.borderRadiusValue" 
                min="0" 
                max="100" 
                step="1"
                class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"
                @input="updateBorderRadius"
              />
            </div>
            
            <!-- 透明度控制 -->
            <div>
              <div class="flex justify-between items-center">
                <label class="text-xs text-gray-400">透明度</label>
                <span class="text-xs text-white">{{ Math.round(editData.style.opacityValue * 100) }}%</span>
              </div>
              <input 
                type="range" 
                v-model="editData.style.opacityValue" 
                min="0.1" 
                max="1" 
                step="0.01"
                class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"
                @input="updateOpacity"
              />
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
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, watch } from 'vue';

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
  imageUrl: {
    type: String,
    required: false,
    default: ''
  },
  style: {
    type: Object,
    required: false,
    default: () => ({
      borderRadiusValue: 0,
      borderRadius: '0px',
      opacityValue: 1,
      opacity: '1'
    })
  }
});

// 组件事件
const emit = defineEmits(['update:show', 'save', 'close']);

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
  element: props.element,
  imageUrl: props.imageUrl,
  previewUrl: props.imageUrl,
  originalUrl: props.imageUrl,
  file: null as File | null,
  imageNaturalWidth: 0,
  imageNaturalHeight: 0,
  aspectRatio: 1,
  maintainAspectRatio: true,
  style: {
    borderRadiusValue: props.style.borderRadiusValue || 0,
    borderRadius: props.style.borderRadius || '0px',
    opacityValue: props.style.opacityValue || 1,
    opacity: props.style.opacity || '1',
    widthValue: props.style.widthValue || 300,
    width: props.style.width || '300px',
    heightValue: props.style.heightValue || 200,
    height: props.style.height || '200px'
  }
});

// 监听属性变化，更新编辑数据
watch(() => props.show, (newVal) => {
  if (newVal) {
    editData.element = props.element;
    editData.imageUrl = props.imageUrl;
    editData.previewUrl = props.imageUrl;
    editData.originalUrl = props.imageUrl;
    editData.file = null;
    editData.style.borderRadiusValue = props.style.borderRadiusValue || 0;
    editData.style.borderRadius = props.style.borderRadius || '0px';
    editData.style.opacityValue = props.style.opacityValue || 1;
    editData.style.opacity = props.style.opacity || '1';
    editData.style.widthValue = props.style.widthValue || 300;
    editData.style.width = props.style.width || '300px';
    editData.style.heightValue = props.style.heightValue || 200;
    editData.style.height = props.style.height || '200px';
    
    // 当图片加载时，获取其原始尺寸和宽高比
    if (editData.previewUrl) {
      const img = new Image();
      img.onload = () => {
        editData.imageNaturalWidth = img.naturalWidth;
        editData.imageNaturalHeight = img.naturalHeight;
        editData.aspectRatio = img.naturalWidth / img.naturalHeight;
      };
      img.src = editData.previewUrl;
    }
  }
});

// 更新圆角值
const updateBorderRadius = () => {
  editData.style.borderRadius = `${editData.style.borderRadiusValue}px`;
};

// 更新透明度值
const updateOpacity = () => {
  editData.style.opacity = editData.style.opacityValue.toString();
};

// 更新尺寸
const updateDimensions = (changedDimension: 'width' | 'height') => {
  // 更新值为像素格式
  editData.style.width = `${editData.style.widthValue}px`;
  editData.style.height = `${editData.style.heightValue}px`;
  
  // 如果需要保持宽高比，则根据改变的维度计算另一维度
  if (editData.maintainAspectRatio && editData.aspectRatio > 0) {
    if (changedDimension === 'width') {
      // 根据宽度计算高度
      editData.style.heightValue = Math.round(editData.style.widthValue / editData.aspectRatio);
      editData.style.height = `${editData.style.heightValue}px`;
    } else {
      // 根据高度计算宽度
      editData.style.widthValue = Math.round(editData.style.heightValue * editData.aspectRatio);
      editData.style.width = `${editData.style.widthValue}px`;
    }
  }
};

// 处理图片上传
const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  editData.file = file;
  editData.imageUrl = '';
  
  // 创建临时URL用于预览
  const reader = new FileReader();
  reader.onload = (e) => {
    editData.previewUrl = e.target?.result as string;
    
    // 获取上传图片的原始尺寸和宽高比
    const img = new Image();
    img.onload = () => {
      editData.imageNaturalWidth = img.naturalWidth;
      editData.imageNaturalHeight = img.naturalHeight;
      editData.aspectRatio = img.naturalWidth / img.naturalHeight;
      
      // 自动调整尺寸滑块到图片实际尺寸
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        // 如果图片尺寸太大，等比例缩小
        const maxPreviewSize = 600;
        if (img.naturalWidth > maxPreviewSize || img.naturalHeight > maxPreviewSize) {
          if (img.naturalWidth > img.naturalHeight) {
            editData.style.widthValue = maxPreviewSize;
            editData.style.heightValue = Math.round(maxPreviewSize / editData.aspectRatio);
          } else {
            editData.style.heightValue = maxPreviewSize;
            editData.style.widthValue = Math.round(maxPreviewSize * editData.aspectRatio);
          }
        } else {
          editData.style.widthValue = img.naturalWidth;
          editData.style.heightValue = img.naturalHeight;
        }
        
        editData.style.width = `${editData.style.widthValue}px`;
        editData.style.height = `${editData.style.heightValue}px`;
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

// 应用图片URL
const applyImageUrl = () => {
  if (!editData.imageUrl) return;
  
  // 清除文件选择
  editData.file = null;
  
  // 设置预览URL
  editData.previewUrl = editData.imageUrl;
};

// 处理关闭
const handleClose = () => {
  emit('update:show', false);
  emit('close');
};

// 处理保存
const handleSave = () => {
  emit('save', {
    previewUrl: editData.previewUrl,
    imageUrl: editData.imageUrl,
    file: editData.file,
    style: {
      borderRadius: editData.style.borderRadius,
      borderRadiusValue: editData.style.borderRadiusValue,
      opacity: editData.style.opacity,
      opacityValue: editData.style.opacityValue,
      width: editData.style.width,
      widthValue: editData.style.widthValue,
      height: editData.style.height,
      heightValue: editData.style.heightValue
    }
  });
  emit('update:show', false);
};
</script>

<style scoped>
/* 可以添加组件特定的样式 */
</style> 