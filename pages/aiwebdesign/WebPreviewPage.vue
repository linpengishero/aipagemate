<template>
  <div class="web-preview-page" :class="{ 'mobile-view': isMobileView }">
    <div class="preview-container" :class="{ 'mobile-container': isMobileView }">
      <WebPreview ref="webPreviewRef" @element-selected="handleElementSelected" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import WebPreview from "~/components/aiweb/WebPreview.vue";
import webProjectStore from '~/utils/webDB/WebProjectStorage';

const route = useRoute();
const webPreviewRef = ref();
const isMobileView = ref(false);
const pageId = ref(route.query.id as string);

// 加载页面代码
const loadPageCode = async () => {
  if (!pageId.value) {
    console.log('未指定预览页面ID，使用iframe通信方式');
    return;
  }
  
  try {
    // 确保数据库已初始化
    if (!webProjectStore.state.initialized) {
      await webProjectStore.initialize();
    }
    
    // 从新的WebProjectStorage中加载页面
    const page = await webProjectStore.loadPage(pageId.value);
    
    if (!page) {
      console.error('找不到指定的页面');
      return;
    }
    
    // 获取页面代码并渲染
    if (page.content && webPreviewRef.value) {
      console.log("正在渲染页面代码，长度:", page.content.length);
      webPreviewRef.value.compileAndRun(page.content);
    } else {
      console.error('页面内容为空或预览组件未准备好');
    }
  } catch (err) {
    console.error('加载预览页面失败:', err);
  }
};

// 处理元素选择事件
const handleElementSelected = (data: any) => {
  // 将DOM元素转换为可序列化的数据
  const serializableData = {
    element: {
      tagName: data.element.tagName,
      id: data.element.id,
      className: data.element.className,
      textContent: data.element.textContent,
      href: data.element.href,
      src: data.element.src,
      // 添加其他需要的属性
    },
    code: data.code
  };

  // 将事件传递给父窗口
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'element-selected',
      data: serializableData
    }, '*');
  }
};

// 拦截链接点击事件
const handleLinkClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const link = target.closest('a');
  
  if (link) {
    event.preventDefault();
    const href = link.getAttribute('href');
    if (href) {
      // 如果是外部链接，在新窗口打开
      if (href.startsWith('http://') || href.startsWith('https://')) {
        window.open(href, '_blank');
      } else {
        // 如果是内部链接，在当前iframe中打开
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.src = href;
        }
      }
    }
  }
};

// 添加事件监听
onMounted(() => {
  // Disable runtime SEO writes when rendering generated code inside editor preview iframe.
  window.__AIWEB_DISABLE_RUNTIME_SEO__ = true;
  document.addEventListener('click', handleLinkClick, true);
  
  // 如果有指定页面ID，则加载页面
  if (pageId.value) {
    setTimeout(() => {
      loadPageCode();
    }, 500);
  }
});

// 移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleLinkClick, true);
  delete window.__AIWEB_DISABLE_RUNTIME_SEO__;
});

// 切换移动端视图
const toggleMobileView = (value: boolean) => {
  isMobileView.value = value;
  console.log("WebPreviewPage - 切换移动视图:", value);
  if (webPreviewRef.value) {
    webPreviewRef.value.toggleMobileView(value);
  }
};

// 暴露方法给父窗口
const methods = {
  compileAndRun: (code: string) => {
    console.log("compileAndRun", code);
    if (webPreviewRef.value) {
      webPreviewRef.value.compileAndRun(code);
    }
  },
  generationProgress: () => {
    if (webPreviewRef.value) {
      webPreviewRef.value.generationProgress();
    }
  },
  toggleInspectMode: (value?: boolean) => {
    if (webPreviewRef.value) {
      webPreviewRef.value.toggleInspectMode(value);
    }
  },
  getCurrentCode: () => {
    if (webPreviewRef.value) {
      return webPreviewRef.value.getCurrentCode();
    }
    return '';
  },
  toggleMobileView,
  get isInspectMode() {
    return webPreviewRef.value?.isInspectMode;
  },
  get isMobileView() {
    return isMobileView.value;
  },
  set isInspectMode(value: boolean) {
    if (webPreviewRef.value) {
      webPreviewRef.value.isInspectMode = value;
    }
  }
};

// 暴露方法到window对象
if (typeof window !== 'undefined') {
  (window as any).webPreviewMethods = methods;
}
</script>

<style scoped>
.web-preview-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.preview-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.mobile-container {
  max-width: 375px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  height: calc(100% - 40px);
  margin: 20px auto;
}
</style> 