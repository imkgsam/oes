import { Module } from '@nestjs/common'
import { OesSiteRuntimeModule } from '@oes/site-runtime-kit'

import { PublicDataController } from './modules/public-data/public-data.controller'
import { PreviewController } from './modules/preview/preview.controller'
import { SeoController } from './modules/seo/seo.controller'
import { TemplatePublishedDataSeedService } from './modules/seed/template-published-data-seed.service'
import { SiteConfigController } from './modules/site-config/site-config.controller'
import { SiteConfigService } from './modules/site-config/site-config.service'

// AppModule composes runtime-kit endpoints with template-local public data, SEO, and preview APIs.
@Module({
  imports: [
    OesSiteRuntimeModule.forRootFromEnv({
      pullIntervalMs: parseOptionalInteger(process.env.OES_SITE_PULL_INTERVAL_MS)
    })
  ],
  controllers: [PublicDataController, PreviewController, SeoController, SiteConfigController],
  providers: [SiteConfigService, TemplatePublishedDataSeedService]
})
export class AppModule {}

// parseOptionalInteger keeps deployment knobs local without changing runtime-kit contracts.
function parseOptionalInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

export const runtimeKitEndpointBoundary = [
  '/api/oes/webhook',
  '/api/oes/runtime-status',
  '/health/live',
  '/health/ready'
]
