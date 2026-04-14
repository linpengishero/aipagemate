<template>
  <div class="w-full h-screen relative">
    <!-- WebPreview组件 -->
    <WebPreview 
      ref="webPreviewRef"
      class="w-full h-full"
    />

    <!-- 错误提示遮罩 -->
    <div
      v-if="errorMessage"
      class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="text-center px-6">
        <p class="text-red-400 text-lg font-medium mb-2">Preview failed to load</p>
        <p class="text-gray-300 text-sm">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import WebPreview from '~/components/aiweb/WebPreview.vue';
import webProjectStore from '~/utils/webDB/WebProjectStorage';

const route = useRoute();
const webPreviewRef = ref();
const errorMessage = ref('');

// 页面ID
const pageId = ref(route.query.id as string);

// 加载页面代码
const loadPageCode = async () => {
  if (!pageId.value) {
    errorMessage.value = 'Missing page ID parameter. Please reopen the preview from the edit page.';
    console.error('未指定预览页面ID');
    return;
  }

  try {
    errorMessage.value = '';

    // 确保数据库已初始化
    if (!webProjectStore.state.initialized) {
      await webProjectStore.initialize();
    }

    // 从新的WebProjectStorage中加载页面
    const page = await webProjectStore.loadPage(pageId.value);

    if (!page) {
      errorMessage.value = 'The corresponding page could not be found and may have been deleted.';
      console.error('找不到指定的页面');
      return;
    }

    // 获取页面代码并渲染
    if (page.content && webPreviewRef.value) {
      console.log("正在渲染页面代码，长度:", page.content.length);
      webPreviewRef.value.compileAndRun(page.content);
    } else {
      errorMessage.value = 'The page content is empty or the preview component is not ready.';
      console.error('页面内容为空或预览组件未准备好');
    }
  } catch (err) {
    errorMessage.value = 'An exception occurred while loading the preview. Please return to the edit page and try again.';
    console.error('加载预览页面失败:', err);
  }
};

// 组件挂载时加载页面
onMounted(async () => {
  // 延迟一点加载，确保组件已完全挂载
  setTimeout(() => {
    loadPageCode();
  }, 500);
});
</script>

<style scoped>
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: rgba(59, 130, 246, 0.8);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 