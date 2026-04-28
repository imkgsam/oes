import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PermissionCheckAll, SALES_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { SalesService } from '../../../sales.service'
import {
  AuditReasonDto,
  CreateQuoteDto,
  ListQuoteVersionsDto,
  SearchQuotesDto,
  SearchSalesOrdersDto,
  UpdateQuoteDraftDto
} from '../dtos/sales.dto'

@ApiBearerAuth('JWT')
@ApiTags('sales')
@Controller('sales/tenants/:tenantId')
// Exposes the minimum quote-order BFF surface needed to manually test the sales-service phase 1 foundation.
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('quotes')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.LIST_QUOTE])
  @ApiOperation({ summary: 'Search quote drafts and published carriers for the tenant sales workspace' })
  async searchQuotes(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchQuotesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.searchQuotes(
      tenantId,
      {
        customerTenantPartyId: query.customerTenantPartyId,
        keyword: query.keyword,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        status: query.status
      },
      source
    )
  }

  @Get('quotes/:quoteId')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.GET_QUOTE])
  @ApiOperation({ summary: 'Get one current quote draft carrier' })
  async getQuote(
    @Param('tenantId') tenantId: string,
    @Param('quoteId') quoteId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.getQuote(tenantId, quoteId, source)
  }

  @Post('quotes')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.CREATE_QUOTE])
  @ApiOperation({ summary: 'Create one quote draft carrier' })
  @ApiBody({ type: CreateQuoteDto })
  async createQuote(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateQuoteDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.createQuote(tenantId, body, source)
  }

  @Put('quotes/:quoteId/draft')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.UPDATE_QUOTE_DRAFT])
  @ApiOperation({ summary: 'Replace one quote draft snapshot without creating a published version' })
  @ApiBody({ type: UpdateQuoteDraftDto })
  async updateQuoteDraft(
    @Param('tenantId') tenantId: string,
    @Param('quoteId') quoteId: string,
    @Body() body: UpdateQuoteDraftDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.updateQuoteDraft(tenantId, quoteId, body, source)
  }

  @Post('quotes/:quoteId/publish')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.PUBLISH_QUOTE])
  @ApiOperation({ summary: 'Publish one quote draft into a formal quote version' })
  @ApiBody({ type: AuditReasonDto })
  async publishQuote(
    @Param('tenantId') tenantId: string,
    @Param('quoteId') quoteId: string,
    @Body() body: AuditReasonDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.publishQuote(tenantId, quoteId, body.auditReason, source)
  }

  @Get('quotes/:quoteId/versions')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.GET_QUOTE])
  @ApiOperation({ summary: 'List one quote draft carrier published version history' })
  async listQuoteVersions(
    @Param('tenantId') tenantId: string,
    @Param('quoteId') quoteId: string,
    @Query() query: ListQuoteVersionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.listQuoteVersions(
      tenantId,
      quoteId,
      {
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('quote-versions/:quoteVersionId')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.GET_QUOTE])
  @ApiOperation({ summary: 'Get one published quote version detail' })
  async getQuoteVersion(
    @Param('tenantId') tenantId: string,
    @Param('quoteVersionId') quoteVersionId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.getQuoteVersion(tenantId, quoteVersionId, source)
  }

  @Post('quote-versions/:quoteVersionId/convert-to-order')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.CONVERT_QUOTE_TO_ORDER])
  @ApiOperation({ summary: 'Convert one published quote version into an established sales order' })
  @ApiBody({ type: AuditReasonDto })
  async convertQuoteVersionToOrder(
    @Param('tenantId') tenantId: string,
    @Param('quoteVersionId') quoteVersionId: string,
    @Body() body: AuditReasonDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.convertQuoteVersionToOrder(
      tenantId,
      quoteVersionId,
      body.auditReason,
      source
    )
  }

  @Get('orders')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.LIST_ORDER])
  @ApiOperation({ summary: 'Search established sales orders for the tenant sales workspace' })
  async searchSalesOrders(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchSalesOrdersDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.searchSalesOrders(
      tenantId,
      {
        customerTenantPartyId: query.customerTenantPartyId,
        keyword: query.keyword,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        productionGate: query.productionGate,
        quoteVersionId: query.quoteVersionId,
        shippingGate: query.shippingGate,
        stockingGate: query.stockingGate
      },
      source
    )
  }

  @Get('orders/:salesOrderId')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.VIEW_ORDER_DETAIL])
  @ApiOperation({ summary: 'Get one established sales order detail' })
  async getSalesOrder(
    @Param('tenantId') tenantId: string,
    @Param('salesOrderId') salesOrderId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.getSalesOrder(tenantId, salesOrderId, source)
  }

  @Post('orders/:salesOrderId/submit-fulfillment-handoff')
  @PermissionCheckAll([SALES_MANAGEMENT_PERMISSION_CODES.SUBMIT_FULFILLMENT_HANDOFF])
  @ApiOperation({ summary: 'Submit one sales-side fulfillment handoff for an established order' })
  @ApiBody({ type: AuditReasonDto })
  async submitFulfillmentHandoff(
    @Param('tenantId') tenantId: string,
    @Param('salesOrderId') salesOrderId: string,
    @Body() body: AuditReasonDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.submitFulfillmentHandoff(
      tenantId,
      salesOrderId,
      body.auditReason,
      source
    )
  }
}
