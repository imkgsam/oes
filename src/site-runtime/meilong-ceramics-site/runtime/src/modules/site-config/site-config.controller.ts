import { Controller, Get } from '@nestjs/common'

import { type PublicSiteConfig, SiteConfigService } from './site-config.service'
import { SiteExposureService } from '../site-exposure/site-exposure.service'

// SiteConfigController exposes public-safe domain and locale config for Nuxt SSR.
@Controller('/api/public/site-config')
export class SiteConfigController {
  constructor(
    private readonly siteConfig: SiteConfigService,
    private readonly siteExposure: SiteExposureService
  ) {}

  // getSiteConfig returns only non-secret config needed for SEO and locale routing.
  @Get()
  async getSiteConfig(): Promise<PublicSiteConfig> {
    return this.siteConfig.getPublicConfig(await this.siteExposure.getCommittedPublication())
  }
}
