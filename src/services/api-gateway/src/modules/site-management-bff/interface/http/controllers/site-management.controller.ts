import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, SITE_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { SiteManagementService } from '../../../site-management.service'
import {
  CreateSiteContentDto,
  CreateSiteDto,
  GenerateSiteCredentialDto,
  IssuePreviewTokenDto,
  UpdateSiteContentLocaleVersionDto,
  UpdateSiteSettingsDto,
  AddPreparingLocaleDto,
  AddProductsToSiteDto,
  CreateSiteCategoryDto,
  UpdateSiteCategoryDto,
  UpdateSiteProductPublicationDto
} from '../dtos/site-management.dto'

/** SiteManagementController exposes Admin Site Management BFF endpoints for tenant-web. */
@ApiTags('site-management')
@ApiBearerAuth('JWT')
@Controller('site-management/tenants/:tenantId')
export class SiteManagementController {
  constructor(private readonly service: SiteManagementService) {}

  /** listSiteCards returns the Site Management card workspace data for one tenant. */
  @Get('sites')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List Site Management workspace cards' })
  listSiteCards(
    @Param('tenantId') tenantId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteCards(tenantId, source)
  }

  /** createSite creates a draft site and one active default locale through site-service. */
  @Post('sites')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Create one managed external site' })
  createSite(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateSiteDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.createSite(tenantId, body, source)
  }

  /** updateSiteSettings updates editable site configuration through site-service. */
  @Post('sites/:siteId/settings')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Update site settings' })
  updateSiteSettings(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: UpdateSiteSettingsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateSiteSettings(tenantId, siteId, body, source)
  }

  /** disableSite disables one managed external site. */
  @Post('sites/:siteId/disable')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Disable one managed site' })
  disableSite(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: { reason?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.disableSite(tenantId, siteId, body?.reason, source)
  }

  /** addPreparingLocale creates a hidden preparing locale. */
  @Post('sites/:siteId/locales')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Add a preparing site locale' })
  addPreparingLocale(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: AddPreparingLocaleDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.addPreparingLocale(tenantId, siteId, body, source)
  }

  /** checkLocaleCompleteness checks whether one locale can be activated. */
  @Get('sites/:siteId/locales/:locale/completeness')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Check locale completeness' })
  checkLocaleCompleteness(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('locale') locale: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.checkLocaleCompleteness(tenantId, siteId, locale, source)
  }

  /** activateLocale activates one prepared locale. */
  @Post('sites/:siteId/locales/:locale/activate')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Activate one site locale' })
  activateLocale(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('locale') locale: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.activateLocale(tenantId, siteId, locale, source)
  }

  /** disableLocale disables one non-default locale. */
  @Post('sites/:siteId/locales/:locale/disable')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Disable one site locale' })
  disableLocale(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('locale') locale: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.disableLocale(tenantId, siteId, locale, source)
  }

  /** listSiteCategories returns site-owned category projections for one managed site. */
  @Get('sites/:siteId/categories')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site category projections' })
  listSiteCategories(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Query('locale') locale: string | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteCategories(tenantId, siteId, locale, source)
  }

  /** createSiteCategory creates one site-owned category projection. */
  @Post('sites/:siteId/categories')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Create one site category projection' })
  createSiteCategory(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: CreateSiteCategoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.createSiteCategory(tenantId, siteId, body, source)
  }

  /** updateSiteCategory updates one site-owned category projection. */
  @Post('sites/:siteId/categories/:categoryId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Update one site category projection' })
  updateSiteCategory(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateSiteCategoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateSiteCategory(tenantId, siteId, categoryId, body, source)
  }

  /** unpublishSiteCategory unpublishes one site category projection. */
  @Post('sites/:siteId/categories/:categoryId/unpublish')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Unpublish one site category projection' })
  unpublishSiteCategory(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: { locale?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.unpublishSiteCategory(tenantId, siteId, categoryId, body.locale ?? '', source)
  }

  /** listSiteProducts returns products already joined to the current site. */
  @Get('sites/:siteId/products')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site product publications' })
  listSiteProducts(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Query('locale') locale: string | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteProducts(tenantId, siteId, locale, source)
  }

  /** searchProductMasterForAdd searches add candidates through the site-service anti-corruption boundary. */
  @Get('sites/:siteId/product-master-candidates')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Search Product Master candidates for adding to a site' })
  searchProductMasterForAdd(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Query() query: { keyword?: string; page?: string; pageSize?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.searchProductMasterForAdd(tenantId, siteId, query, source)
  }

  /** getSiteProductPublication returns one site-owned product display record. */
  @Get('sites/:siteId/products/:publicationId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get one site product publication' })
  getSiteProductPublication(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('publicationId') publicationId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getSiteProductPublication(tenantId, siteId, publicationId, source)
  }

  /** addProductsToSite adds Product Master references to a site. */
  @Post('sites/:siteId/products:add')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Add products to one site' })
  addProductsToSite(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: AddProductsToSiteDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.addProductsToSite(tenantId, siteId, body, source)
  }

  /** updateSiteProductPublication updates site-owned product display configuration. */
  @Post('sites/:siteId/products/:publicationId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Update one site product publication' })
  updateSiteProductPublication(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('publicationId') publicationId: string,
    @Body() body: UpdateSiteProductPublicationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateSiteProductPublication(tenantId, siteId, publicationId, body, source)
  }

  /** unpublishSiteProduct unpublishes one product from the site runtime view. */
  @Post('sites/:siteId/products/:publicationId/unpublish')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Unpublish one site product' })
  unpublishSiteProduct(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('publicationId') publicationId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.unpublishSiteProduct(tenantId, siteId, publicationId, source)
  }

  /** syncAllPendingChanges explicitly publishes pending site changes and triggers webhook dispatch. */
  @Post('sites/:siteId/sync')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.SYNC] })
  @ApiOperation({ summary: 'Sync all pending site changes' })
  syncAllPendingChanges(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.syncAllPendingChanges(tenantId, siteId, source)
  }

  /** getPendingSyncSummary returns pending sync counters. */
  @Get('sites/:siteId/sync/pending-summary')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get pending sync summary' })
  getPendingSyncSummary(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getPendingSyncSummary(tenantId, siteId, source)
  }

  /** listPendingSyncResources returns pending changed resources. */
  @Get('sites/:siteId/sync/pending-resources')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List pending sync resources' })
  listPendingSyncResources(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listPendingSyncResources(tenantId, siteId, source)
  }

  /** listSyncHistory returns sync batch history. */
  @Get('sites/:siteId/sync/history')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List sync history' })
  listSyncHistory(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSyncHistory(tenantId, siteId, source)
  }

  /** getSyncDetail returns one sync batch detail. */
  @Get('sync/:syncId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get sync detail' })
  getSyncDetail(
    @Param('tenantId') tenantId: string,
    @Param('syncId') syncId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getSyncDetail(tenantId, syncId, source)
  }

  /** retryLastSync retries the latest sync webhook path without duplicating views. */
  @Post('sites/:siteId/sync/retry-last')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.SYNC] })
  @ApiOperation({ summary: 'Retry last sync' })
  retryLastSync(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.retryLastSync(tenantId, siteId, source)
  }

  /** resendWebhook resends one sync webhook without creating a new version. */
  @Post('sync/:syncId/webhook:resend')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.SYNC] })
  @ApiOperation({ summary: 'Resend one sync webhook' })
  resendWebhook(
    @Param('tenantId') tenantId: string,
    @Param('syncId') syncId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.resendWebhook(tenantId, syncId, source)
  }

  /** issuePreviewToken creates a short-lived preview token for a saved draft resource. */
  @Post('sites/:siteId/preview-token')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.PREVIEW] })
  @ApiOperation({ summary: 'Issue one Site Runtime preview token' })
  issuePreviewToken(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: IssuePreviewTokenDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.issuePreviewToken(tenantId, siteId, body, source)
  }

  /** generateSiteCredential creates a one-time Site Runtime credential bundle. */
  @Get('sites/:siteId/credentials')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List Site Runtime credential metadata' })
  listSiteCredentials(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteCredentials(tenantId, siteId, source)
  }

  @Post('sites/:siteId/credentials')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Generate one Site Runtime credential' })
  generateSiteCredential(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: GenerateSiteCredentialDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.generateSiteCredential(tenantId, siteId, body, source)
  }

  /** rotateSiteCredential rotates one Site Runtime credential and returns the replacement bundle once. */
  @Post('sites/:siteId/credentials/:credentialId/rotate')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Rotate one Site Runtime credential' })
  rotateSiteCredential(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('credentialId') credentialId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.rotateSiteCredential(tenantId, siteId, credentialId, source)
  }

  /** revokeSiteCredential revokes one Site Runtime credential. */
  @Post('sites/:siteId/credentials/:credentialId/revoke')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Revoke one Site Runtime credential' })
  revokeSiteCredential(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('credentialId') credentialId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.revokeSiteCredential(tenantId, siteId, credentialId, source)
  }

  /** createSiteContent creates a site-scoped Blog or News entry. */
  @Get('sites/:siteId/contents')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site Blog/News entries' })
  listSiteContents(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Query('contentType') contentType: string | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteContents(tenantId, siteId, contentType, source)
  }

  @Post('sites/:siteId/contents')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Create one site Blog/News entry' })
  createSiteContent(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Body() body: CreateSiteContentDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.createSiteContent(tenantId, siteId, body, source)
  }

  /** getSiteContent returns one Blog/News entry. */
  @Get('sites/:siteId/contents/:contentId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get one site Blog/News entry' })
  getSiteContent(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('contentId') contentId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getSiteContent(tenantId, siteId, contentId, source)
  }

  /** updateSiteContentLocaleVersion saves one Blog/News locale draft. */
  @Post('sites/:siteId/contents/:contentId/locale-version')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Save one Blog/News locale draft' })
  updateSiteContentLocaleVersion(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('contentId') contentId: string,
    @Body() body: Omit<UpdateSiteContentLocaleVersionDto, 'contentId'>,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateSiteContentLocaleVersion(tenantId, siteId, { contentId, ...body }, source)
  }

  /** unpublishSiteContent unpublishes one Blog/News locale version. */
  @Post('sites/:siteId/contents/:contentId/unpublish')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Unpublish one Blog/News locale version' })
  unpublishSiteContent(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @Param('contentId') contentId: string,
    @Body() body: { locale: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.unpublishSiteContent(tenantId, siteId, contentId, body.locale, source)
  }

  /** listSiteAuditLogs returns site audit rows for Admin review. */
  @Get('sites/:siteId/audit')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site audit logs' })
  listSiteAuditLogs(
    @Param('tenantId') tenantId: string,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteAuditLogs(tenantId, siteId, source)
  }
}
