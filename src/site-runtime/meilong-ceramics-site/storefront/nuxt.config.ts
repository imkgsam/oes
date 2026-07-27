import tailwindcss from '@tailwindcss/vite'

// Keeps governance and crawler surfaces revalidated so a committed exposure switch cannot serve stale page policy.
const routeRules = {
  '/preview/**': {
    headers: {
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow'
    }
  },
  '/sitemap.xml': { headers: { 'cache-control': 'no-cache' } },
  '/robots.txt': { headers: { 'cache-control': 'no-cache' } }
}

// Prevents browser history navigation from reusing CSS responses for Vite's JS style-module imports in local dev.
const viteServerHeaders =
  process.env.NODE_ENV === 'production'
    ? undefined
    : {
        'cache-control': 'no-store, max-age=0',
        vary: 'Origin, Sec-Fetch-Dest, Sec-Fetch-Mode, Accept'
      }

export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: false },
  modules: ['@nuxt/image', '@nuxt/icon'],
  css: ['~/assets/css/main.css', '~/assets/css/dxv-home.css', '~/assets/css/kohler-pdp.css'],
  runtimeConfig: {
    siteRuntimeBaseUrl: process.env.SITE_RUNTIME_BASE_URL ?? 'http://127.0.0.1:4301',
    public: {
      sitePublicBaseUrl: process.env.SITE_PUBLIC_BASE_URL ?? 'https://meilong-ceramics.com'
    }
  },
  nitro: {
    routeRules
  },
  image: {
    domains: ['maidstonedxv.com', 'cdn.shopify.com', 'res.cloudinary.com']
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: viteServerHeaders
    }
  },
  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  compatibilityDate: '2026-06-16'
})
