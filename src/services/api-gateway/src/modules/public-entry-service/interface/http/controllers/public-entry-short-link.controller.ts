import { Body, Controller, Get, Header, Param, Post, Query, Req, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import {
  PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES,
  RequirePermissions
} from '@oes/common/authorization'
import { Request, Response } from 'express'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { getHeaderValue } from '../../../../../common/http/http-request.util'
import { PublicEntryShortLinkService } from '../../../public-entry-short-link.service'
import {
  ChangeShortLinkStatusDto,
  CreateShortLinkDto,
  UpdateShortLinkMetadataDto,
  UpdateShortLinkTargetDto
} from '../dtos/public-entry-short-link.dto'

@ApiTags('public-entry-short-links')
@Controller()
// PublicEntryShortLinkController exposes anonymous redirect and tenant-scoped ShortLink admin endpoints.
export class PublicEntryShortLinkController {
  constructor(private readonly service: PublicEntryShortLinkService) {}

  @Public()
  @Get('c/:shortCode')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Resolve an anonymous ShortLink public redirect' })
  async resolvePublicRedirect(
    @Param('shortCode') shortCode: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    const result = await this.service.resolvePublicRedirect(shortCode, {
      userAgent: getHeaderValue(request, 'user-agent'),
      ipAddress: resolveIpAddress(request),
      acceptLanguage: getHeaderValue(request, 'accept-language'),
      referrer: getHeaderValue(request, 'referer'),
      requestId: getHeaderValue(request, 'x-request-id'),
      traceId: getHeaderValue(request, 'x-trace-id'),
      traceparent: getHeaderValue(request, 'traceparent'),
      tracestate: getHeaderValue(request, 'tracestate')
    })

    if (result.type === 'REDIRECT') {
      return response.redirect(302, result.location)
    }
    if (result.type === 'NOT_FOUND') {
      return response.status(404).type('html').send(renderUnavailablePage('该链接不存在或不可用。'))
    }
    return response.status(200).type('html').send(renderUnavailablePage('该链接当前不可用。'))
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/short-links')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.CREATE] })
  @ApiOperation({ summary: 'Create one tenant ShortLink' })
  @ApiBody({ type: CreateShortLinkDto })
  async createShortLink(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateShortLinkDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.createShortLink(tenantId, body, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/short-links')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List tenant ShortLinks across all target kinds' })
  async listShortLinks(
    @Param('tenantId') tenantId: string,
    @Query()
    query: { targetKind?: string; targetType?: string; page?: string; pageSize?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listShortLinks(tenantId, query, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/short-links/by-target')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List tenant ShortLinks for one target reference' })
  async listByTarget(
    @Param('tenantId') tenantId: string,
    @Query()
    query: { targetType?: string; targetResourceId?: string; page?: string; pageSize?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listByTarget(tenantId, query, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/short-links/:shortLinkId')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get one ShortLink detail' })
  async getShortLink(
    @Param('tenantId') tenantId: string,
    @Param('shortLinkId') shortLinkId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getShortLink(tenantId, shortLinkId, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/short-links/:shortLinkId/target')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.UPDATE] })
  @ApiOperation({ summary: 'Update one ShortLink target without changing public URL' })
  @ApiBody({ type: UpdateShortLinkTargetDto })
  async updateTarget(
    @Param('tenantId') tenantId: string,
    @Param('shortLinkId') shortLinkId: string,
    @Body() body: UpdateShortLinkTargetDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateTarget(tenantId, shortLinkId, body, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/short-links/:shortLinkId/metadata')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.UPDATE] })
  @ApiOperation({ summary: 'Update one ShortLink display metadata and expiry' })
  @ApiBody({ type: UpdateShortLinkMetadataDto })
  async updateMetadata(
    @Param('tenantId') tenantId: string,
    @Param('shortLinkId') shortLinkId: string,
    @Body() body: UpdateShortLinkMetadataDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateMetadata(tenantId, shortLinkId, body, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/short-links/:shortLinkId/status')
  @RequirePermissions({
    any: [
      PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.UPDATE,
      PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.DISABLE,
      PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.ARCHIVE
    ]
  })
  @ApiOperation({ summary: 'Change one ShortLink status' })
  @ApiBody({ type: ChangeShortLinkStatusDto })
  async changeStatus(
    @Param('tenantId') tenantId: string,
    @Param('shortLinkId') shortLinkId: string,
    @Body() body: ChangeShortLinkStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.changeStatus(tenantId, shortLinkId, body, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/short-links/:shortLinkId/stats')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.STATS_READ] })
  @ApiOperation({ summary: 'Get VisitEvent-derived ShortLink statistics' })
  async getStats(
    @Param('tenantId') tenantId: string,
    @Param('shortLinkId') shortLinkId: string,
    @Query() query: { from?: string; to?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getStats(tenantId, shortLinkId, query, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/short-links/:shortLinkId/qr.png')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Download one basic ShortLink QR PNG' })
  async downloadQr(
    @Param('tenantId') tenantId: string,
    @Param('shortLinkId') shortLinkId: string,
    @DownstreamSource() source: DownstreamRequestSource,
    @Res() response: Response
  ) {
    const qr = await this.service.generateQr(tenantId, shortLinkId, source)
    return response
      .status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Content-Disposition', `attachment; filename="short-link-${shortLinkId}.png"`)
      .send(Buffer.from(qr.imageBase64 ?? '', 'base64'))
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/short-links/:shortLinkId/qr')
  @RequirePermissions({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get one ShortLink QR payload' })
  async getQr(
    @Param('tenantId') tenantId: string,
    @Param('shortLinkId') shortLinkId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.generateQr(tenantId, shortLinkId, source)
  }
}

// resolveIpAddress extracts the best public request IP candidate without trusting it as identity.
function resolveIpAddress(request: Request): string {
  const forwarded = getHeaderValue(request, 'x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.ip || ''
}

// renderUnavailablePage returns a generic public response that does not leak target internals.
function renderUnavailablePage(message: string): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>链接不可用</title><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#182230;display:grid;min-height:100dvh;place-items:center}.panel{max-width:420px;padding:32px;text-align:center}.title{font-size:22px;font-weight:700;margin:0 0 10px}.copy{font-size:15px;line-height:1.6;color:#536174;margin:0}</style></head><body><main class="panel"><h1 class="title">链接不可用</h1><p class="copy">${message}</p></main></body></html>`
}
