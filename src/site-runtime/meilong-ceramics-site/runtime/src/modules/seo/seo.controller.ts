import { Controller, Get } from '@nestjs/common'

import {
  SeoRouteIndexService,
  type SeoRouteIndexResult
} from './seo-route-index.service'

// SeoController exposes the SEO route-index HTTP endpoint through one application-service delegate.
@Controller('/api/public/seo')
export class SeoController {
  constructor(private readonly seoRouteIndex: SeoRouteIndexService) {}

  // routeIndex delegates the complete publication-consistent operation without controller aggregation.
  @Get('/route-index')
  routeIndex(): Promise<SeoRouteIndexResult> {
    return this.seoRouteIndex.getRouteIndex()
  }
}
