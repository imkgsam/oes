import { Controller, Get, Param, Query, Res } from '@nestjs/common'
import { OesSiteRuntimeService } from '@oes/site-runtime-kit'
import type { Response } from 'express'

type PreviewResourceType = 'product' | 'blog' | 'news'

// PreviewController bridges Storefront preview requests to runtime-kit without writing local store.
@Controller('/api/preview')
export class PreviewController {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // getPreview returns draft preview data with noindex and no-store semantics.
  @Get(':resourceType/:resourceId')
  async getPreview(
    @Param('resourceType') resourceType: PreviewResourceType,
    @Param('resourceId') resourceId: string,
    @Query('locale') locale: string,
    @Query('token') previewToken: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<Record<string, unknown>> {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Robots-Tag', 'noindex, nofollow')
    try {
      return await this.runtimeService.getRuntime().getPreviewView({
        preview_token: previewToken,
        resource_type: resourceType,
        resource_id: resourceId,
        locale
      })
    } catch {
      response.status(503)
      return {
        preview_view: {
          status: 'draft_preview',
          payload: {
            title: 'Preview unavailable',
            summary: 'The OES draft preview API is unavailable for this local request.'
          }
        },
        noindex: true,
        cache_policy: 'no-store'
      }
    }
  }
}
