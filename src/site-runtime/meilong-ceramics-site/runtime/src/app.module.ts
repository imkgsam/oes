import { Module } from '@nestjs/common'
import { OesSiteRuntimeModule } from '@oes/site-runtime-kit'

import { PublicDataController } from './modules/public-data/public-data.controller'
import { PublicDataService } from './modules/public-data/public-data.service'
import { ContentCategoryArchiveService } from './modules/public-data/content-category-archive.service'
import { ContentCategoryArchiveController } from './modules/public-data/content-category-archive.controller'
import { ContentArchiveController } from './modules/public-data/content-archive.controller'
import { ContentArchiveService } from './modules/public-data/content-archive.service'
import { PreviewController } from './modules/preview/preview.controller'
import { SeoController } from './modules/seo/seo.controller'
import { SeoRouteIndexService } from './modules/seo/seo-route-index.service'
import { MeilongPublishedDataSeedService } from './modules/seed/meilong-published-data-seed.service'
import { SiteConfigController } from './modules/site-config/site-config.controller'
import { SiteConfigService } from './modules/site-config/site-config.service'
import { SiteExposureService } from './modules/site-exposure/site-exposure.service'
import { SiteExposureController } from './modules/site-exposure/site-exposure.controller'
import { MEILONG_RUNTIME_MODULE_OPTIONS } from './site-runtime-options'

// AppModule composes runtime-kit endpoints with Meilong local public data, SEO, and preview APIs.
@Module({
  imports: [
    OesSiteRuntimeModule.forRootFromEnv(MEILONG_RUNTIME_MODULE_OPTIONS)
  ],
  controllers: [
    PublicDataController,
    ContentArchiveController,
    ContentCategoryArchiveController,
    PreviewController,
    SeoController,
    SiteConfigController,
    SiteExposureController
  ],
  providers: [
    SiteConfigService,
    SiteExposureService,
    PublicDataService,
    ContentArchiveService,
    ContentCategoryArchiveService,
    SeoRouteIndexService,
    MeilongPublishedDataSeedService
  ]
})
export class AppModule {}

export const runtimeKitEndpointBoundary = [
  '/api/oes/webhook',
  '/api/oes/runtime-status',
  '/health/live',
  '/health/ready'
]
