import { Body, Controller, Get, Header, Param, Post, Query, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import {
  PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES,
  RequirePermissions
} from '@oes/common/authorization'
import { Response } from 'express'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PublicEntryBusinessCardService } from '../../../public-entry-business-card.service'
import {
  EnsurePrimaryBusinessCardDto,
  UpdateBusinessCardConfigDto,
  UpdateBusinessCardContactActionsDto
} from '../dtos/public-entry-business-card.dto'

@ApiTags('public-entry-business-cards')
@Controller()
// PublicEntryBusinessCardController exposes tenant admin, employee self-view, and anonymous public card endpoints.
export class PublicEntryBusinessCardController {
  constructor(private readonly service: PublicEntryBusinessCardService) {}

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/business-cards/ensure-primary')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Ensure one primary BusinessCard for an employee' })
  @ApiBody({ type: EnsurePrimaryBusinessCardDto })
  async ensurePrimaryCard(
    @Param('tenantId') tenantId: string,
    @Body() body: EnsurePrimaryBusinessCardDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.ensurePrimaryCard(tenantId, body, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/business-cards')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List tenant BusinessCards' })
  async listCards(
    @Param('tenantId') tenantId: string,
    @Query() query: { page?: string; pageSize?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listCards(tenantId, query, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/business-cards/:businessCardId')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get one BusinessCard detail' })
  async getCardDetail(
    @Param('tenantId') tenantId: string,
    @Param('businessCardId') businessCardId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getCardDetail(tenantId, businessCardId, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/business-cards/:businessCardId/config')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Update one BusinessCard display configuration' })
  @ApiBody({ type: UpdateBusinessCardConfigDto })
  async updateConfig(
    @Param('tenantId') tenantId: string,
    @Param('businessCardId') businessCardId: string,
    @Body() body: UpdateBusinessCardConfigDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateConfig(tenantId, businessCardId, body, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/business-cards/:businessCardId/contact-actions')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Replace one BusinessCard Contact Action configuration' })
  @ApiBody({ type: UpdateBusinessCardContactActionsDto })
  async updateContactActions(
    @Param('tenantId') tenantId: string,
    @Param('businessCardId') businessCardId: string,
    @Body() body: UpdateBusinessCardContactActionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateContactActions(tenantId, businessCardId, body, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/business-cards/:businessCardId/enable')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.ENABLE] })
  @ApiOperation({ summary: 'Enable one ready BusinessCard' })
  async enableCard(
    @Param('tenantId') tenantId: string,
    @Param('businessCardId') businessCardId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.enableCard(tenantId, businessCardId, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/business-cards/:businessCardId/disable')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.DISABLE] })
  @ApiOperation({ summary: 'Disable one BusinessCard' })
  async disableCard(
    @Param('tenantId') tenantId: string,
    @Param('businessCardId') businessCardId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.disableCard(tenantId, businessCardId, source)
  }

  @ApiBearerAuth('JWT')
  @Post('public-entry/tenants/:tenantId/business-cards/:businessCardId/public-entry')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.PUBLIC_ENTRY_MANAGE] })
  @ApiOperation({ summary: 'Bind or refresh one BusinessCard main public entry' })
  async bindPublicEntry(
    @Param('tenantId') tenantId: string,
    @Param('businessCardId') businessCardId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.bindPublicEntry(tenantId, businessCardId, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/business-cards/:businessCardId/visits')
  @RequirePermissions({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.STATS_READ] })
  @ApiOperation({ summary: 'Get one BusinessCard main public entry visit summary' })
  async getVisitSummary(
    @Param('tenantId') tenantId: string,
    @Param('businessCardId') businessCardId: string,
    @Query() query: { from?: string; to?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getVisitSummary(tenantId, businessCardId, query, source)
  }

  @ApiBearerAuth('JWT')
  @Get('public-entry/tenants/:tenantId/business-cards/self/preview')
  @ApiOperation({ summary: 'Get authenticated employee own BusinessCard preview' })
  async getOwnPreview(
    @Param('tenantId') tenantId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getOwnPreview(tenantId, source)
  }

  @Public()
  @Get('public-entry/public/business-cards/:businessCardId')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Render one anonymous public BusinessCard view' })
  async renderPublicCard(
    @Param('businessCardId') businessCardId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.renderPublicCard(businessCardId, source)
  }

  @Public()
  @Get([
    'public-entry/public/business-cards/:businessCardId.vcf',
    'public-entry/public/business-cards/:businessCardId/vcard.vcf'
  ])
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Download one anonymous public BusinessCard vCard' })
  async downloadVCard(
    @Param('businessCardId') businessCardId: string,
    @DownstreamSource() source: DownstreamRequestSource,
    @Res() response: Response
  ) {
    const vcard = await this.service.generateVCard(businessCardId, source)
    return response
      .status(200)
      .setHeader('Content-Type', vcard.contentType || 'text/vcard')
      .setHeader('Content-Disposition', `attachment; filename="business-card-${businessCardId}.vcf"`)
      .send(vcard.body ?? '')
  }
}
