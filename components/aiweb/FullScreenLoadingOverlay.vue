<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[120] bg-gray-900/55 backdrop-blur-[2px] flex items-center justify-center"
  >
    <div class="flex flex-col items-center text-center px-6">
      <div class="w-10 h-10 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-3"></div>
      <p class="text-blue-200 text-base font-medium">{{ title }}</p>
      <p v-if="description" class="text-gray-300 text-sm mt-1">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  title?: string;
  description?: string;
}>();
</script>
