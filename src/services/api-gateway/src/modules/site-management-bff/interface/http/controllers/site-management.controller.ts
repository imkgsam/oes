import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common'
import type { Request } from 'express'
import { isObservable, Observable } from 'rxjs'
import { UploadSiteMediaRequest } from '@oes/common/generated/asset_service'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, SITE_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import {
  RequireTenantTargetBinding,
  VerifiedTenantTarget
} from '../../../../../common/tenant-target'
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
  CreateContentCategoryDto,
  UpdateSiteCategoryDto,
  UpdateContentCategoryLocaleVersionDto,
  UpdateSiteProductPublicationDto,
  UpdateFaqCategoryLocaleVersionDto,
  CreateFaqEntryDto,
  UpdateFaqEntryLocaleVersionDto
} from '../dtos/site-management.dto'

/** SiteManagementController exposes Admin Site Management BFF endpoints for tenant-web. */
@ApiTags('site-management')
@ApiBearerAuth('JWT')
@RequireTenantTargetBinding()
@Controller('site-management/tenants/:tenantId')
export class SiteManagementController {
  constructor(private readonly service: SiteManagementService) {}

  /** listSiteCards returns the Site Management card workspace data for one tenant. */
  @Get('sites')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List Site Management workspace cards' })
  listSiteCards(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteCards(tenantId, source)
  }

  /** listLocaleOptions returns fixed system-supported locale options for Site Management. */
  @Get('locale-options')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List fixed system locale options' })
  listLocaleOptions() {
    return this.service.listLocaleOptions()
  }

  /** createSite creates a draft site and one active default locale through site-service. */
  @Post('sites')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Create one managed external site' })
  createSite(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('locale') locale: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.disableLocale(tenantId, siteId, locale, source)
  }

  /** listSitePages returns discovered page identities and page-wide governance state. */
  @Get('sites/:siteId/pages')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List discovered site pages' })
  listSitePages(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSitePages(tenantId, siteId, source)
  }

  /** updateSitePageGovernance changes page-wide enabled/index intent without a page-locale matrix. */
  @Post('sites/:siteId/pages/:pageKey/governance')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Update site page governance' })
  updateSitePageGovernance(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('pageKey') pageKey: string,
    @Body() body: { enabled: boolean; indexable: boolean },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateSitePageGovernance(tenantId, siteId, pageKey, body, source)
  }

  /** listSiteCategories returns site-owned category projections for one managed site. */
  @Get('sites/:siteId/categories')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site category projections' })
  listSiteCategories(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: { locale?: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.unpublishSiteCategory(
      tenantId,
      siteId,
      categoryId,
      body.locale ?? '',
      source
    )
  }

  /** listSiteProducts returns products already joined to the current site. */
  @Get('sites/:siteId/products')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site product publications' })
  listSiteProducts(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteCredentials(tenantId, siteId, source)
  }

  @Post('sites/:siteId/credentials')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Generate one Site Runtime credential' })
  generateSiteCredential(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
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
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('contentId') contentId: string,
    @Body() body: Omit<UpdateSiteContentLocaleVersionDto, 'contentId'>,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateSiteContentLocaleVersion(
      tenantId,
      siteId,
      { contentId, ...body },
      source
    )
  }

  /** unpublishSiteContent unpublishes one Blog/News locale version. */
  @Post('sites/:siteId/contents/:contentId/unpublish')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Unpublish one Blog/News locale version' })
  unpublishSiteContent(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('contentId') contentId: string,
    @Body() body: { locale: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.unpublishSiteContent(tenantId, siteId, contentId, body.locale, source)
  }

  /** listContentCategories returns site-scoped Blog/News Categories for selection and management. */
  @Get('sites/:siteId/content-categories')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site Blog/News Categories' })
  listContentCategories(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Query('locale') locale: string | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listContentCategories(tenantId, siteId, locale, source)
  }

  /** getContentCategory returns one site-scoped Category. */
  @Get('sites/:siteId/content-categories/:categoryId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'Get one site Blog/News Category' })
  getContentCategory(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('categoryId') categoryId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.getContentCategory(tenantId, siteId, categoryId, source)
  }

  /** createContentCategory creates one site-scoped Blog/News Category. */
  @Post('sites/:siteId/content-categories')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Create one site Blog/News Category' })
  createContentCategory(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Body() body: CreateContentCategoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.createContentCategory(tenantId, siteId, body, source)
  }

  /** updateContentCategoryLocaleVersion saves one Category locale version. */
  @Post('sites/:siteId/content-categories/:categoryId/locale-version')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Save one Blog/News Category locale version' })
  updateContentCategoryLocaleVersion(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateContentCategoryLocaleVersionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.updateContentCategoryLocaleVersion(
      tenantId,
      siteId,
      categoryId,
      body,
      source
    )
  }

  /** publishContentCategoryLocale approves one locale draft for the next Site Sync. */
  @Post('sites/:siteId/content-categories/:categoryId/publish')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  @ApiOperation({ summary: 'Publish one Blog/News Category locale' })
  publishContentCategoryLocale(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @Param('categoryId') categoryId: string, @Body() body: { locale: string },
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.publishContentCategoryLocale(tenantId, siteId, categoryId, body.locale, source)
  }

  /** reorderContentCategories writes the one site-wide Category rank order. */
  @Post('sites/:siteId/content-categories/reorder')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  reorderContentCategories(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Body() body: { orderedCategoryIds: string[] }, @DownstreamSource() source: DownstreamRequestSource) { return this.service.reorderContentCategories(tenantId, siteId, body.orderedCategoryIds, source) }
  /** deleteContentCategory invokes draft and published reference blockers. */
  @Post('sites/:siteId/content-categories/:categoryId/delete')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  deleteContentCategory(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('categoryId') categoryId: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.deleteContentCategory(tenantId, siteId, categoryId, source) }
  /** listVisibleContentCategories exposes usage-derived archive candidates. */
  @Get('sites/:siteId/content-categories/visible')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  listVisibleContentCategories(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Query('contentType') contentType: string, @Query('locale') locale: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.listVisibleContentCategories(tenantId, siteId, contentType, locale, source) }
  /** checkContentCategoryCompleteness reports non-blocking locale readiness. */
  @Get('sites/:siteId/content-categories/:categoryId/completeness')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  checkContentCategoryCompleteness(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('categoryId') categoryId: string, @Query('locale') locale: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.checkContentCategoryCompleteness(tenantId, siteId, categoryId, locale, source) }
  /** listContentCategoryUsage returns published and draft Article counts. */
  @Get('sites/:siteId/content-categories/:categoryId/usage')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  listContentCategoryUsage(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('categoryId') categoryId: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.listContentCategoryUsage(tenantId, siteId, categoryId, source) }

  /** listFaqCategories returns site-owned FAQ Categories. */
  @Get('sites/:siteId/faqs/categories')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  listFaqCategories(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Query('locale') locale: string | undefined, @DownstreamSource() source: DownstreamRequestSource) { return this.service.listFaqCategories(tenantId, siteId, locale, source) }
  /** createFaqCategory creates one flat FAQ Category. */
  @Post('sites/:siteId/faqs/categories')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  createFaqCategory(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.createFaqCategory(tenantId, siteId, source) }
  /** updateFaqCategoryLocaleVersion saves Category locale content. */
  @Post('sites/:siteId/faqs/categories/:categoryId/locale-version')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  updateFaqCategoryLocaleVersion(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('categoryId') categoryId: string, @Body() body: UpdateFaqCategoryLocaleVersionDto, @DownstreamSource() source: DownstreamRequestSource) { return this.service.updateFaqCategoryLocaleVersion(tenantId, siteId, categoryId, body, source) }
  /** getFaqCategory reads one FAQ Category. */
  @Get('sites/:siteId/faqs/categories/:categoryId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  getFaqCategory(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('categoryId') categoryId: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.getFaqCategory(tenantId, siteId, categoryId, source) }
  /** disableFaqCategory enforces Entry publication safety. */
  @Post('sites/:siteId/faqs/categories/:categoryId/disable')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  disableFaqCategory(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('categoryId') categoryId: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.disableFaqCategory(tenantId, siteId, categoryId, source) }
  /** listFaqEntries returns site-owned FAQ Entries. */
  @Get('sites/:siteId/faqs/entries')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  listFaqEntries(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Query('categoryId') categoryId: string | undefined, @Query('locale') locale: string | undefined, @DownstreamSource() source: DownstreamRequestSource) { return this.service.listFaqEntries(tenantId, siteId, categoryId, locale, source) }
  /** createFaqEntry creates one Category-bound Entry. */
  @Post('sites/:siteId/faqs/entries')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  createFaqEntry(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Body() body: CreateFaqEntryDto, @DownstreamSource() source: DownstreamRequestSource) { return this.service.createFaqEntry(tenantId, siteId, body, source) }
  /** updateFaqEntryLocaleVersion saves Entry locale content. */
  @Post('sites/:siteId/faqs/entries/:entryId/locale-version')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  updateFaqEntryLocaleVersion(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('entryId') entryId: string, @Body() body: UpdateFaqEntryLocaleVersionDto, @DownstreamSource() source: DownstreamRequestSource) { return this.service.updateFaqEntryLocaleVersion(tenantId, siteId, entryId, body, source) }
  /** getFaqEntry reads one FAQ Entry. */
  @Get('sites/:siteId/faqs/entries/:entryId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  getFaqEntry(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('entryId') entryId: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.getFaqEntry(tenantId, siteId, entryId, source) }
  /** unpublishFaqEntry withdraws one locale revision. */
  @Post('sites/:siteId/faqs/entries/:entryId/unpublish')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  unpublishFaqEntry(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('entryId') entryId: string, @Body() body: { locale: string }, @DownstreamSource() source: DownstreamRequestSource) { return this.service.unpublishFaqEntry(tenantId, siteId, entryId, body.locale, source) }
  /** checkFaqCompleteness returns locale-specific FAQ publish readiness. */
  @Get('sites/:siteId/faqs/completeness')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  checkFaqCompleteness(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Query('locale') locale: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.checkFaqCompleteness(tenantId, siteId, locale, source) }
  /** listSiteAuditLogs returns site audit rows for Admin review. */
  @Get('sites/:siteId/audit')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  @ApiOperation({ summary: 'List site audit logs' })
  listSiteAuditLogs(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Param('siteId') siteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.service.listSiteAuditLogs(tenantId, siteId, source)
  }

  /** Site Media Admin routes preserve stream/protocol boundaries and delegate target authorization to Gateway guards. */
  @Post('sites/:siteId/media')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  uploadSiteMedia(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Req() request: Request, @DownstreamSource() source: DownstreamRequestSource) { return this.service.uploadSiteMedia(mediaUploadStream(request, siteId), source) }
  @Get('sites/:siteId/media')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  listAuthorizedSiteMedia(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Query() query: SiteMediaListQuery, @DownstreamSource() source: DownstreamRequestSource) { return this.service.listAuthorizedSiteMedia(tenantId, { siteId, ...query }, source) }
  @Post('sites/:siteId/media/delivery/prepare')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  prepareSiteMediaRemoteDelivery(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Body() body: SiteMediaPrepareBody, @DownstreamSource() source: DownstreamRequestSource) { return this.service.prepareSiteMediaRemoteDelivery(tenantId, { ...body, siteId }, source) }
  @Post('sites/:siteId/media/delivery/activate')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  activateSiteMediaRemoteDelivery(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Body() body: SiteMediaActivateBody, @DownstreamSource() source: DownstreamRequestSource) { return this.service.activateSiteMediaRemoteDelivery(tenantId, { ...body, siteId }, source) }
  @Post('sites/:siteId/media/:assetId/archive')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  archiveSiteMedia(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('assetId') assetId: string, @Body() body: SiteMediaIdempotencyBody, @DownstreamSource() source: DownstreamRequestSource) { return this.service.archiveSiteMedia(tenantId, { ...body, siteId, assetId }, source) }
  @Post('sites/:siteId/media/:assetId/takedown')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  takeDownSiteMedia(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('assetId') assetId: string, @Body() body: SiteMediaTakeDownBody, @DownstreamSource() source: DownstreamRequestSource) { return this.service.takeDownSiteMedia(tenantId, { ...body, siteId, assetId }, source) }
  @Get('sites/:siteId/media/:assetId/status')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.READ] })
  getSiteMediaDeliveryStatus(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('assetId') assetId: string, @DownstreamSource() source: DownstreamRequestSource) { return this.service.getSiteMediaDeliveryStatus(tenantId, siteId, assetId, source) }
  @Delete('sites/:siteId/media/:assetId')
  @RequirePermissions({ all: [SITE_MANAGEMENT_PERMISSION_CODES.MANAGE] })
  deleteSiteMedia(@VerifiedTenantTarget() tenantId: VerifiedTenantTarget, @Param('siteId') siteId: string, @Param('assetId') assetId: string, @Body() body: SiteMediaDeleteBody, @DownstreamSource() source: DownstreamRequestSource) { return this.service.deleteSiteMedia(tenantId, { ...body, siteId, assetId }, source) }
}

type SiteMediaListQuery = { query?: string; mediaKindFilter?: string; pageSize?: number; pageToken?: string }
type SiteMediaPrepareBody = { idempotencyKey: string; mediaHost: string }
type SiteMediaActivateBody = { idempotencyKey: string }
type SiteMediaIdempotencyBody = { idempotencyKey: string }
type SiteMediaTakeDownBody = SiteMediaIdempotencyBody & { reasonCode: string; reasonNote?: string }
type SiteMediaDeleteBody = SiteMediaIdempotencyBody & { deletionReason: string }
type SiteMediaStreamRequest = Request & { siteMediaStream?: unknown }

/** mediaUploadStream accepts only the gateway's bounded decoded gRPC frame stream and never aggregates raw bytes. */
function mediaUploadStream(request: Request, siteId: string): Observable<UploadSiteMediaRequest> {
  const stream = (request as SiteMediaStreamRequest).siteMediaStream
  if (!isObservable(stream)) throw new Error('SITE_MEDIA_STREAM_REQUIRED')
  return stream as Observable<UploadSiteMediaRequest>
}
