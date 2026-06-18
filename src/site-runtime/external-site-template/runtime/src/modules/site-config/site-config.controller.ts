import { Controller, Get } from '@nestjs/common'

import { type PublicSiteConfig, SiteConfigService } from './site-config.service'

// SiteConfigController exposes public-safe domain and locale config for Nuxt SSR.
@Controller('/api/public/site-config')
export class SiteConfigController {
  constructor(private readonly siteConfig: SiteConfigService) {}

  // getSiteConfig returns only non-secret config needed for SEO and locale routing.
  @Get()
  getSiteConfig(): PublicSiteConfig {
    return this.siteConfig.getPublicConfig()
  }
}
