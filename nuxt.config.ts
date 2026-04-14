export default defineNuxtConfig({
  ssr: true,
  modules: [
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
    'nuxt-gtag',
    "@nuxtjs/i18n",
    'nuxt-headlessui',
    'nuxt-swiper',
    '@nuxtjs/google-fonts',
    'nuxt-icons',
    '@nuxtjs/tailwindcss',
    "@nuxt/icon"
  ],

  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  css: [
    './assets/css/style.css'
  ],

  colorMode: {
    classSuffix: '',
  },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    prerender: {
      crawlLinks: false,
      routes: ['/'],
    },
  },

  vite: {
    ssr: {
      noExternal: ['@varlet/ui', 'dayjs'],
    },
  },

  devtools: {
    enabled: true,
  },

  headlessui: {
    prefix: '',
  },

  i18n: {
    vueI18n: './locale/i18n.config.ts',
    locales: ['us', 'fr', 'de', 'es'],
    defaultLocale: process.env.NUXT_PUBLIC_LANG || 'us',
    strategy: 'prefix_except_default'
  },

  swiper: 
  {
    modules: ['navigation', 'pagination', 'effect-creative' ]
  },

  runtimeConfig: {
    public: {
      routeId: '',
      countryCode: '',
      country: '',
      submitFormUrl: '',
      pixelId: '',
      lang: '',
      ogUrl: '',
      sendTo: '',
      gadsId: '',
      gtagId: ''
    },
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  compatibilityDate: '2025-04-12',
})