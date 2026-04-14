<template>
  <footer class="border-t border-gray-800/80 bg-gray-950/90 mt-8">
    <div class="container mx-auto px-4 py-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <BrandLogo to="/" :show-subtitle="false" />
          <p class="text-gray-400 text-sm mt-2 leading-relaxed">
            AI studio focused on landing pages with reusable components,
            online editing, and export-ready code.
          </p>
        </div>

        <div>
          <h4 class="text-gray-200 font-medium mb-3">Current Capabilities</h4>
          <ul class="space-y-2 text-sm text-gray-400">
            <li>• Online visual editing</li>
            <li>• HTML export</li>
            <li>• Vue project export</li>
            <li>• Multi-page reusable component workflow</li>
          </ul>
        </div>

        <div>
          <h4 class="text-gray-200 font-medium mb-3">SaaS Roadmap</h4>
          <ul class="space-y-2 text-sm text-gray-400">
            <li>• Template library</li>
            <li>• Template marketplace</li>
            <li>• Online component library for editing</li>
            <li>• Automatic payment integration</li>
            <li>• One-click deployment</li>
            <li>• Shopify templates, WordPress templates, and React export</li>
          </ul>
        </div>
      </div>

      <div class="mt-8 pt-5 border-t border-gray-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <p class="text-xs text-gray-500">© {{ year }} aipagemate. All rights reserved.</p>
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <a
            href="https://www.aipagemate.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-300 hover:text-blue-200 transition-colors"
          >
            www.aipagemate.com
          </a>
          <span class="text-gray-600">|</span>
          <a
            href="https://www.toolsgopro.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-300 hover:text-blue-200 transition-colors"
          >
            www.toolsgopro.com
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import BrandLogo from '~/components/BrandLogo.vue';

const year = new Date().getFullYear();
</script>
