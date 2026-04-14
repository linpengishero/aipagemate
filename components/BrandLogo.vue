<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    class="brand-logo inline-flex items-center gap-2 group"
  >
    <div
      class="h-8 w-8 rounded-lg bg-gradient-to-br  flex items-center justify-center"
      :class="iconClass"
    >
      <!-- Replace this icon with your image later -->
      <!-- <Icon icon="mdi:rocket-launch-outline" class="text-white" /> -->
      <img src="@/assets/images/logo.png" alt="aipagemate" class="h-8 w-8" />
    </div>
    <div>
      <p class="font-semibold leading-tight transition-colors" :class="titleClass">{{ title }}</p>
      <p v-if="showSubtitle" class="text-xs text-gray-400 leading-tight">{{ subtitle }}</p>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = withDefaults(defineProps<{
  to?: string;
  title?: string;
  subtitle?: string;
  showSubtitle?: boolean;
  darkTitle?: boolean;
}>(), {
  to: '',
  title: 'aipagemate',
  subtitle: 'AI Landing Page Studio',
  showSubtitle: true,
  darkTitle: false,
});

const titleClass = computed(() => (props.darkTitle
  ? 'text-gray-900 group-hover:text-blue-700'
  : 'text-white group-hover:text-blue-300'));

const iconClass = computed(() => props.darkTitle ? 'shadow-sm' : '');
</script>

<style scoped>
.brand-logo {
  text-decoration: none;
}
</style>
