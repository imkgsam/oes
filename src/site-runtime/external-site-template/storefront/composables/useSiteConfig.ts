import type { PublicSiteConfig } from '../types/public-view'

// useSiteConfig reads public-safe site config through Nuxt server routes.
export async function useSiteConfig() {
  return useAsyncData<PublicSiteConfig>('site-config', () => $fetch('/api/public/site-config'))
}
