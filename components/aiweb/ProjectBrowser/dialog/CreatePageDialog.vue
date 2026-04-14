<template>
  <Teleport to="body">
    <div v-if="modelValue" class="dialog-overlay">
      <div class="dialog-content bg-gray-800 p-6 border border-gray-700/50 rounded-xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white text-lg font-medium">创建新页面</h3>
          <button @click="close" class="text-gray-400 hover:text-white transition-colors">
            <Icon icon="mdi:close" class="h-5 w-5" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 mb-2 text-sm">页面名称</label>
            <input 
              v-model="pageData.name" 
              class="w-full bg-gray-900/50 border border-gray-700/30 rounded-xl p-3 text-gray-300 focus:outline-none focus:border-gray-600/50"
              placeholder="输入页面名称"
            />
          </div>
          
          <div>
            <label class="block text-gray-300 mb-2 text-sm">页面描述</label>
            <textarea 
              v-model="pageData.description" 
              class="w-full bg-gray-900/50 border border-gray-700/30 rounded-xl p-3 text-gray-300 focus:outline-none focus:border-gray-600/50 min-h-[80px]"
              placeholder="简要描述此页面的内容"
            ></textarea>
          </div>
          
          <div class="flex space-x-3 mt-6">
            <button 
              @click="close" 
              class="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              @click="createPage" 
              class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-colors"
            >
              创建页面
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref, reactive, defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'create']);

// 页面数据
const pageData = reactive({
  name: "",
  description: ""
});

// 关闭对话框
const close = () => {
  emit('update:modelValue', false);
  resetForm();
};

// 创建页面
const createPage = () => {
  if (!pageData.name.trim()) {
    alert("请输入页面名称");
    return;
  }
  
  const page = {
    id: Date.now(),
    name: pageData.name,
    description: pageData.description,
    code: `<template>\n  <div>\n    <h1>${pageData.name}</h1>\n    <p>${pageData.description}</p>\n  </div>\n</template>`
  };
  
  emit('create', page);
  close();
};

// 重置表单
const resetForm = () => {
  pageData.name = "";
  pageData.description = "";
};
</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.25s ease-out;
}

.dialog-content {
  width: 95%;
  max-width: 480px;
  background-color: #1e2029;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 