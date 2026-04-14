<template>
  <div class="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 min-h-screen text-white">
    <NavBar />

    <header class="container mx-auto px-4 pt-16 pb-14 md:pt-24 md:pb-20 text-center">
      <div class="max-w-4xl mx-auto">
        <p class="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm mb-6">
          Built for Landing Pages
        </p>
        <h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Generate conversion-ready pages with AI,
          <span class="bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">then ship faster than ever</span>
        </h1>
        <p class="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-10">
          aipagemate helps creators, indie hackers, and small teams build landing pages with reusable components,
          online visual editing, and production-friendly export workflows including HTML export and Vue project export.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <router-link
            to="/aiwebdesign"
            class="inline-flex items-center justify-center px-7 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-900/40"
          >
            Start Building
            <Icon icon="mdi:arrow-right" class="ml-2" />
          </router-link>
          <a
            href="#roadmap"
            class="inline-flex items-center justify-center px-7 py-3 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-200 hover:text-white transition-colors"
          >
            View SaaS Roadmap
          </a>
        </div>
      </div>
    </header>

    <section class="container mx-auto px-4 pb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
          <p class="text-sm text-gray-400">Current Focus</p>
          <p class="text-blue-300 font-semibold mt-1">Landing Pages (Current Focus)</p>
        </div>
        <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
          <p class="text-sm text-gray-400">Authoring Experience</p>
          <p class="text-indigo-300 font-semibold mt-1">Plan -> Generate -> Edit Online -> Export</p>
        </div>
        <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
          <p class="text-sm text-gray-400">Engineering Output</p>
          <p class="text-purple-300 font-semibold mt-1">Reusable Components + Clean Export</p>
        </div>
      </div>
    </section>

    <section class="py-16 bg-gray-900/70 border-y border-gray-800/80">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Why aipagemate?</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div class="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h3 class="text-lg font-semibold text-red-300 mb-2">Avoid full-page rewrites</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Update exactly what you want with element-level editing instead of regenerating everything.</p>
          </div>
          <div class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h3 class="text-lg font-semibold text-amber-300 mb-2">Export-ready workflows</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Export your generated result as HTML or as a Vue project, with validation and repair safeguards.</p>
          </div>
          <div class="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <h3 class="text-lg font-semibold text-cyan-300 mb-2">Reuse across pages</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Shared component workflow keeps your headers, footers, and blocks consistent across multi-page projects.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="roadmap" class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-4 text-blue-300">SaaS Roadmap</h2>
        <p class="text-center text-gray-400 max-w-3xl mx-auto mb-12">
          We are building toward a full growth engine for creators and product teams.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div class="feature-card">
            <Icon icon="mdi:credit-card-outline" class="feature-icon text-emerald-300" />
            <h3 class="feature-title">Automatic Payment Setup</h3>
            <p class="feature-desc">Future SaaS releases will support built-in payment integration flows for monetized pages.</p>
          </div>

          <div class="feature-card">
            <Icon icon="mdi:cloud-upload-outline" class="feature-icon text-blue-300" />
            <h3 class="feature-title">One-Click Deployment</h3>
            <p class="feature-desc">Publish generated projects directly from the workspace with deployment automation.</p>
          </div>

          <div class="feature-card">
            <Icon icon="mdi:view-grid-outline" class="feature-icon text-indigo-300" />
            <h3 class="feature-title">Template Library</h3>
            <p class="feature-desc">Browse and start from high-quality landing page templates built for different goals and niches.</p>
          </div>

          <div class="feature-card">
            <Icon icon="mdi:store-outline" class="feature-icon text-purple-300" />
            <h3 class="feature-title">Template Marketplace</h3>
            <p class="feature-desc">Publish, share, and monetize templates through a future creator-friendly template marketplace.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-6">
          <div class="feature-card">
            <Icon icon="mdi:puzzle-outline" class="feature-icon text-cyan-300" />
            <h3 class="feature-title">Online Component Library</h3>
            <p class="feature-desc">Maintain reusable component sets that can be edited online and reused across multiple generated pages.</p>
          </div>

          <div class="feature-card">
            <Icon icon="mdi:code-tags" class="feature-icon text-pink-300" />
            <h3 class="feature-title">More Framework Targets</h3>
            <p class="feature-desc">Roadmap includes additional template and export targets such as Shopify, WordPress, and React projects.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="container mx-auto px-4 text-center">
        <div class="max-w-3xl mx-auto rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-10">
          <h2 class="text-3xl md:text-4xl font-bold mb-5">Build now, scale with SaaS later</h2>
          <p class="text-gray-300 text-lg mb-8">
            Start with high-quality landing pages today.
            Grow into template library, template marketplace, online component library, automated payments, and one-click deployment in the upcoming SaaS platform.
          </p>
          <router-link
            to="/aiwebdesign"
            class="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-900/40"
          >
            Open aipagemate Studio
            <Icon icon="mdi:rocket-launch" class="ml-2" />
          </router-link>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import AppFooter from '~/components/AppFooter.vue';

useHead({
  title: 'aipagemate - AI Landing Page Generator',
  htmlAttrs: {
    lang: 'en',
  },
  link: [
    { rel: 'canonical', href: 'https://www.aipagemate.com/' },
  ],
  meta: [
    { name: 'robots', content: 'index, follow' },
    { name: 'author', content: 'aipagemate' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'geo.region', content: 'US' },
    { name: 'geo.placename', content: 'San Francisco' },
    { name: 'geo.position', content: '37.7749;-122.4194' },
    { name: 'ICBM', content: '37.7749, -122.4194' },
    {
      name: 'description',
      content: 'aipagemate focuses on AI generation for landing pages with online visual editing, reusable component workflows, HTML export, and Vue project export. SaaS roadmap includes template library, template marketplace, online component library, payment integration, and one-click deployment.',
    },
    {
      name: 'keywords',
      content: 'AI landing page generator, online visual editor, HTML export, Vue project export, reusable components, template library, template marketplace, component library, one-click deployment, payment integration, Shopify template, WordPress template, React export',
    },
    { property: 'og:title', content: 'aipagemate - AI Landing Page Generator' },
    {
      property: 'og:description',
      content: 'Generate landing pages today. SaaS roadmap includes template library, template marketplace, component library, payment integration, and one-click deployment.',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'aipagemate - AI Landing Page Generator' },
    {
      name: 'twitter:description',
      content: 'Focused AI generator for landing pages. Future SaaS: template ecosystem, payment integration, and one-click deployment.',
    },
  ],
});
</script>

<style scoped>
.feature-card {
  @apply rounded-2xl border border-gray-800 bg-gray-900/70 p-6 transition-all duration-300 hover:border-gray-600 hover:-translate-y-1;
}

.feature-icon {
  @apply text-2xl mb-4;
}

.feature-title {
  @apply text-lg font-semibold mb-2;
}

.feature-desc {
  @apply text-sm text-gray-400 leading-relaxed;
}
</style>
