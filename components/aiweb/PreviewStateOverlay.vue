<template>
  <div
    v-if="state !== 'none'"
    class="absolute inset-0 flex items-center justify-center"
    :class="overlayClass"
  >
    <div class="flex flex-col items-center px-6 text-center">
      <div v-if="state === 'generating'" class="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-3"></div>
      <Icon v-else :icon="icon" class="h-16 w-16 mb-4" :class="iconClass" />
      <p class="text-base font-medium mb-2" :class="titleClass">{{ title }}</p>
      <p class="text-sm" :class="descClass">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  state: 'none' | 'project-locked' | 'project-context' | 'no-page' | 'initializing' | 'generating';
}>();

const baseBg = 'bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95';

const overlayClass = computed(() => {
  switch (props.state) {
    case 'project-locked':
      return `z-30 ${baseBg} backdrop-blur-sm`;
    case 'project-context':
      return `z-25 ${baseBg} backdrop-blur-sm`;
    case 'generating':
      return `z-20 ${baseBg} backdrop-blur-[1px]`;
    case 'no-page':
    case 'initializing':
      return `z-10 ${baseBg} backdrop-blur-sm`;
    default:
      return '';
  }
});

const icon = computed(() => {
  switch (props.state) {
    case 'project-locked':
      return 'mdi:robot-outline';
    case 'project-context':
      return 'mdi:folder-open-outline';
    case 'no-page':
      return 'mdi:file-document-outline';
    case 'initializing':
      return 'mdi:loading';
    default:
      return 'mdi:information-outline';
  }
});

const title = computed(() => {
  switch (props.state) {
    case 'project-locked':
      return 'Project not generated yet';
    case 'project-context':
      return 'Project context is active';
    case 'no-page':
      return 'Please select a page';
    case 'initializing':
      return 'Initializing editor...';
    case 'generating':
      return 'Generating website code...';
    default:
      return '';
  }
});

const description = computed(() => {
  switch (props.state) {
    case 'project-locked':
      return 'Please complete generation in AI Assistant first. Other actions are temporarily disabled.';
    case 'project-context':
      return 'Click blank area in left page list to enter this mode. You can ask AI to continue generating next planned page.';
    case 'no-page':
      return 'Select a page from the left panel to start editing.';
    case 'initializing':
      return 'Please wait while the preview editor is being prepared.';
    case 'generating':
      return 'Please wait, generating code and updating preview...';
    default:
      return '';
  }
});

const iconClass = computed(() => {
  if (props.state === 'initializing') return 'text-blue-300 animate-spin';
  if (props.state === 'project-locked') return 'text-blue-400';
  if (props.state === 'no-page') return 'text-gray-400';
  return 'text-blue-300';
});

const titleClass = computed(() => {
  if (props.state === 'project-locked') return 'text-blue-300';
  if (props.state === 'project-context') return 'text-blue-300';
  if (props.state === 'no-page') return 'text-blue-300';
  return 'text-blue-200';
});

const descClass = computed(() => {
  if (props.state === 'project-locked') return 'text-gray-300';
  if (props.state === 'no-page') return 'text-gray-400';
  return 'text-gray-300';
});
</script>
