<template>
  <Teleport to="body">
    <div
      v-if="noticeState.visible"
      class="fixed top-6 left-1/2 -translate-x-1/2 z-[1200] px-4 py-2 rounded-lg shadow-xl text-sm border"
      :class="noticeClass"
    >
      {{ noticeState.message }}
    </div>

    <div v-if="confirmState.visible" class="fixed inset-0 z-[1201] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-sm" @click="resolveConfirm(false)"></div>
      <div class="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-5">
        <h3 class="text-white text-lg font-medium mb-2">{{ confirmState.title }}</h3>
        <p class="text-gray-300 text-sm leading-6 mb-5 whitespace-pre-wrap">{{ confirmState.message }}</p>

        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
            @click="resolveConfirm(false)"
          >
            {{ confirmState.cancelText }}
          </button>
          <button
            class="px-4 py-2 rounded-lg text-white transition-colors"
            :class="confirmState.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'"
            @click="resolveConfirm(true)"
          >
            {{ confirmState.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePrompt } from '~/composables/usePrompt';

const { noticeState, confirmState, resolveConfirm } = usePrompt();

const noticeClass = computed(() => {
  switch (noticeState.type) {
    case 'success':
      return 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200';
    case 'error':
      return 'bg-red-500/15 border-red-400/40 text-red-200';
    case 'warning':
      return 'bg-amber-500/15 border-amber-400/40 text-amber-200';
    default:
      return 'bg-blue-500/15 border-blue-400/40 text-blue-200';
  }
});
</script>
