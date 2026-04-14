<template>
  <section>
    <NuxtPage />
  </section>
</template>
<script setup lang="ts">

const { $isMobile } = useNuxtApp();
const { t } = useI18n();

// useSeoMeta({
//   title: t('seo.title'),
//   ogTitle: t('seo.title'),
//   description: t('seo.description'),
//   ogDescription: t('seo.description'),
//   ogImage: './pwa-512x512.png',
//   keywords: t('seo.keywords'),
// })

</script>