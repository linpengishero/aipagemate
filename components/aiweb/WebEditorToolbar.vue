<template>
  <div class="flex items-center justify-between p-3 mb-4 bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-xl shadow-gray-900/20 border border-gray-700/30">
    <div class="flex items-center space-x-2">
      <button
        @click="$emit('save')"
        class="group px-3 py-1.5 bg-gray-800/60 rounded-lg flex items-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="pageActionsDisabled"
      >
        <Icon
          icon="mdi:content-save-outline"
          class="w-4 h-4 mr-1.5 text-gray-300 group-hover:text-white transition-colors duration-200"
        />
        <span class="text-xs font-medium text-gray-300 group-hover:text-white transition-colors duration-200">Save</span>
      </button>

      <button
        @click="$emit('download-page')"
        class="group px-3 py-1.5 bg-gray-800/60 rounded-lg flex items-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="pageActionsDisabled"
      >
        <Icon
          icon="mdi:download-outline"
          class="w-4 h-4 mr-1.5 text-gray-300 group-hover:text-white transition-colors duration-200"
        />
        <span class="text-xs font-medium text-gray-300 group-hover:text-white transition-colors duration-200">Download Page</span>
      </button>

      <button
        @click="$emit('package-project')"
        class="group px-3 py-1.5 bg-gray-800/60 rounded-lg flex items-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="packageDisabled"
      >
        <Icon
          icon="mdi:package-variant-closed"
          class="w-4 h-4 mr-1.5 text-gray-300 group-hover:text-white transition-colors duration-200"
        />
        <span class="text-xs font-medium text-gray-300 group-hover:text-white transition-colors duration-200">Package Project</span>
      </button>

      <button
        @click="$emit('preview')"
        class="group px-3 py-1.5 bg-gray-800/60 rounded-lg flex items-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="pageActionsDisabled"
      >
        <Icon
          icon="mdi:eye-outline"
          class="w-4 h-4 mr-1.5 text-gray-300 group-hover:text-white transition-colors duration-200"
        />
        <span class="text-xs font-medium text-gray-300 group-hover:text-white transition-colors duration-200">Preview</span>
      </button>

      <button
        @click="$emit('download-pdf')"
        class="group px-3 py-1.5 bg-gray-800/60 rounded-lg flex items-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="pageActionsDisabled"
      >
        <Icon
          icon="mdi:file-pdf-box"
          class="w-4 h-4 mr-1.5 text-gray-300 group-hover:text-white transition-colors duration-200"
        />
        <span class="text-xs font-medium text-gray-300 group-hover:text-white transition-colors duration-200">Download PDF</span>
      </button>
    </div>

    <div class="flex items-center space-x-2">
      <button
        @click="$emit('toggle-mobile')"
        class="group p-1.5 bg-gray-800/60 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :class="{ 'bg-blue-600/30 border-blue-500/30': isMobileView }"
        :disabled="pageActionsDisabled"
      >
        <Icon
          icon="mdi:cellphone"
          class="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200"
          :class="{ 'text-blue-400': isMobileView }"
        />
      </button>

      <button
        @click="$emit('toggle-inspect')"
        class="group p-1.5 bg-gray-800/60 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :class="{ 'bg-blue-600/30 border-blue-500/30': isInspectMode }"
        :disabled="pageActionsDisabled"
      >
        <Icon
          icon="mdi:selection-search"
          class="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200"
          :class="{ 'text-blue-400': isInspectMode }"
        />
      </button>

      <button
        @click="$emit('toggle-ai-sidebar')"
        class="group p-1.5 bg-gray-800/60 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30"
        :class="{ 'bg-blue-600/30 border-blue-500/30': !isAiSidebarCollapsed }"
      >
        <Icon
          icon="mdi:robot"
          class="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200"
          :class="{ 'text-blue-400': !isAiSidebarCollapsed }"
        />
      </button>

      <button
        @click="$emit('toggle-fullscreen')"
        class="group p-1.5 bg-gray-800/60 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-700/70 border border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed"
        :class="{ 'bg-blue-600/30 border-blue-500/30': isFullscreen }"
        :disabled="pageActionsDisabled"
        title="Toggle fullscreen"
      >
        <Icon
          :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'"
          class="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200"
          :class="{ 'text-blue-400': isFullscreen }"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps<{
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
}>();
</script>
