<template>
  <div class="h-full w-full rounded-xl border border-gray-700/30 bg-gray-800/40 backdrop-blur-xl flex items-center justify-center p-8">
    <div class="max-w-xl text-center">
      <div class="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/30 flex items-center justify-center">
        <Icon icon="mdi:folder-multiple-outline" class="h-8 w-8 text-blue-300" />
      </div>
      <h2 class="text-xl font-semibold text-white mb-3">Select or create a project to begin</h2>
      <p class="text-sm text-gray-300 leading-6">
        You're currently in <span class="text-blue-300 font-medium">My Projects</span> view.
        Create a new project or open an existing one from the left panel.
        Once inside a project, the AI Assistant, toolbar, and live preview workspace will appear automatically.
      </p>
      <div class="mt-6 flex items-center justify-center gap-3">
        <button
          @click="$emit('create-project')"
          class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-colors shadow-sm shadow-blue-900/30"
        >
          <Icon icon="mdi:folder-plus" class="h-4 w-4 mr-2" />
          Create New Project
        </button>
      </div>
      <div class="mt-4 text-xs text-gray-400">
        Tip: Start with a short requirement in AI chat to generate your first page quickly.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineEmits<{
  (e: 'create-project'): void;
}>();
</script>
