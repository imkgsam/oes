export default defineNuxtConfig({
  ssr: true,
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    siteRuntimeBaseUrl: process.env.SITE_RUNTIME_BASE_URL ?? 'http://127.0.0.1:4301',
    public: {
      sitePublicBaseUrl: process.env.SITE_PUBLIC_BASE_URL ?? 'https://meilong-ceramics.com'
    }
  },
  nitro: {
    routeRules: {
      '/products/**': { swr: 300 },
      '/categories/**': { swr: 300 },
      '/blog/**': { swr: 300 },
      '/news/**': { swr: 300 },
      '/preview/**': {
        headers: {
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex, nofollow'
        }
      },
      '/sitemap.xml': { headers: { 'cache-control': 'no-cache' } },
      '/robots.txt': { headers: { 'cache-control': 'no-cache' } }
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en-US' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  compatibilityDate: '2026-06-16'
})
