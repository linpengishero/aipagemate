<template>
  <div class="flex-1 flex flex-col overflow-hidden" :class="{ 'fixed inset-0 z-[100] p-4 bg-gray-900': isFullscreen }">
    <WebEditorToolbar
      :actions-disabled="actionsDisabled"
      :page-actions-disabled="pageActionsDisabled"
      :package-disabled="packageDisabled"
      :is-mobile-view="isMobileView"
      :is-inspect-mode="isInspectMode"
      :is-ai-sidebar-collapsed="isAiSidebarCollapsed"
      :is-fullscreen="isFullscreen"
      @save="$emit('save')"
      @download-page="$emit('download-page')"
      @package-project="$emit('package-project')"
      @preview="$emit('preview')"
      @download-pdf="$emit('download-pdf')"
      @toggle-mobile="$emit('toggle-mobile')"
      @toggle-inspect="$emit('toggle-inspect')"
      @toggle-ai-sidebar="$emit('toggle-ai-sidebar')"
      @toggle-fullscreen="$emit('toggle-fullscreen')"
    />

    <div class="main-content-area flex-1 overflow-y-auto relative iframe-container rounded-xl" :class="{ 'h-[calc(100vh-110px)]': isFullscreen }">
      <PreviewStateOverlay :state="previewOverlayState" />

      <iframe
        ref="previewFrameEl"
        :src="previewUrl"
        class="w-full h-full border-0"
        @load="$emit('iframe-load')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import WebEditorToolbar from '~/components/aiweb/WebEditorToolbar.vue';
import PreviewStateOverlay from '~/components/aiweb/PreviewStateOverlay.vue';

type OverlayState = 'none' | 'project-locked' | 'project-context' | 'no-page' | 'initializing' | 'generating';

defineProps<{
  previewUrl: string;
  previewOverlayState: OverlayState;
  actionsDisabled: boolean;
  pageActionsDisabled: boolean;
  packageDisabled: boolean;
  isMobileView: boolean;
  isInspectMode: boolean;
  isAiSidebarCollapsed: boolean;
  isFullscreen: boolean;
}>();

defineEmits<{
  (e: 'save'): void;
  (e: 'download-page'): void;
  (e: 'package-project'): void;
  (e: 'preview'): void;
  (e: 'download-pdf'): void;
  (e: 'toggle-mobile'): void;
  (e: 'toggle-inspect'): void;
  (e: 'toggle-ai-sidebar'): void;
  (e: 'toggle-fullscreen'): void;
  (e: 'iframe-load'): void;
}>();

const previewFrameEl = ref<HTMLIFrameElement | null>(null);

defineExpose({
  previewFrameEl,
});
</script>

<style scoped>
.main-content-area {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.main-content-area::-webkit-scrollbar {
  display: none;
}

.iframe-container {
  scrollbar-width: none;
  -ms-overflow-style: none;
  overflow: hidden;
}

.iframe-container::-webkit-scrollbar {
  display: none;
}

iframe {
  display: block;
  overflow: hidden;
}
</style>
