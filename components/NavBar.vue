<template>
  <header class="nav-bar border-b border-gray-800/80 bg-gray-950/90 backdrop-blur">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <BrandLogo to="/" />

      <div class="flex items-center gap-3">
        <router-link
          to="/aiwebdesign"
          class="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Open Studio
          <Icon icon="mdi:arrow-right" class="text-sm" />
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import BrandLogo from '~/components/BrandLogo.vue';
</script>

<style scoped>
.nav-bar {
  z-index: 50;
}
</style>
