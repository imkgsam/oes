import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  PermissionCheckAll,
  SALES_MANAGEMENT_PERMISSION_CODES,
  SALES_PRICING_PERMISSION_CODES
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { SalesService } from '../../../sales.service'
import {
  AuditReasonDto,
  ChangePriceListStatusDto,
  CreateCustomerPriceAgreementDto,
  CreatePriceListDto,
  CreateQuoteDto,
  GetActiveCustomerPriceAgreementDto,
  GetCustomerPriceAgreementDto,
  GetPriceListLinesDto,
  ListCustomerPriceAgreementVersionsDto,
  ListQuoteVersionsDto,
  PreviewQuoteLinePricingDto,
  ReplacePriceListLinesDto,
  SearchPriceListsDto,
  SearchQuotesDto,
  SearchSalesOrdersDto,
  UpdateCustomerPriceAgreementDraftDto,
  UpdatePriceListDto,
  UpdateQuoteDraftDto
} from '../dtos/sales.dto'

@ApiBearerAuth('JWT')
@ApiTags('sales')
@Controller('sales/tenants/:tenantId')
// Exposes the quote, order, and pricing BFF surface needed to manually test the sales-service phase 1 foundation.
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

  @Get('pricing/price-lists')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.READ_PRICE_LIST])
  @ApiOperation({ summary: 'Search price lists for the tenant sales pricing workspace' })
  async searchPriceLists(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchPriceListsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.searchPriceLists(
      tenantId,
      {
        currencyCode: query.currencyCode,
        effectiveAt: query.effectiveAt,
        keyword: query.keyword,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        priceListType: query.priceListType,
        status: query.status
      },
      source
    )
  }

  @Get('pricing/price-lists/:priceListId')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.READ_PRICE_LIST])
  @ApiOperation({ summary: 'Get one selected price list header' })
  async getPriceList(
    @Param('tenantId') tenantId: string,
    @Param('priceListId') priceListId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.getPriceList(tenantId, priceListId, source)
  }

  @Get('pricing/price-lists/:priceListId/lines')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.READ_PRICE_LIST])
  @ApiOperation({ summary: 'Get the paged line set for one selected price list' })
  async getPriceListLines(
    @Param('tenantId') tenantId: string,
    @Param('priceListId') priceListId: string,
    @Query() query: GetPriceListLinesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.getPriceListLines(
      tenantId,
      priceListId,
      {
        itemId: query.itemId,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('pricing/customer-price-agreements/active')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.READ_CUSTOMER_AGREEMENT])
  @ApiOperation({ summary: 'Get the active customer price agreement for one customer and currency' })
  async getActiveCustomerPriceAgreement(
    @Param('tenantId') tenantId: string,
    @Query() query: GetActiveCustomerPriceAgreementDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.getActiveCustomerPriceAgreement(tenantId, query, source)
  }

  @Get('pricing/customer-price-agreements/:customerPriceAgreementId')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.READ_CUSTOMER_AGREEMENT])
  @ApiOperation({ summary: 'Get one customer price agreement head or explicit version' })
  async getCustomerPriceAgreement(
    @Param('tenantId') tenantId: string,
    @Param('customerPriceAgreementId') customerPriceAgreementId: string,
    @Query() query: GetCustomerPriceAgreementDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.getCustomerPriceAgreement(
      tenantId,
      customerPriceAgreementId,
      query,
      source
    )
  }

  @Get('pricing/customer-price-agreements/:customerPriceAgreementId/versions')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.READ_CUSTOMER_AGREEMENT])
  @ApiOperation({ summary: 'List one customer price agreement family version history' })
  async listCustomerPriceAgreementVersions(
    @Param('tenantId') tenantId: string,
    @Param('customerPriceAgreementId') customerPriceAgreementId: string,
    @Query() query: ListCustomerPriceAgreementVersionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.listCustomerPriceAgreementVersions(
      tenantId,
      customerPriceAgreementId,
      {
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Post('pricing/quote-line-preview')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.PREVIEW_QUOTE_LINE])
  @ApiOperation({ summary: 'Preview one quote-line pricing snapshot without mutating sales state' })
  @ApiBody({ type: PreviewQuoteLinePricingDto })
  async previewQuoteLinePricing(
    @Param('tenantId') tenantId: string,
    @Body() body: PreviewQuoteLinePricingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.previewQuoteLinePricing(tenantId, body, source)
  }

  @Post('pricing/price-lists')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_PRICE_LIST])
  @ApiOperation({ summary: 'Create one price list through the tenant sales pricing workspace' })
  @ApiBody({ type: CreatePriceListDto })
  async createPriceList(
    @Param('tenantId') tenantId: string,
    @Body() body: CreatePriceListDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.createPriceList(tenantId, body, source)
  }

  @Put('pricing/price-lists/:priceListId')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_PRICE_LIST])
  @ApiOperation({ summary: 'Update one selected price list header' })
  @ApiBody({ type: UpdatePriceListDto })
  async updatePriceList(
    @Param('tenantId') tenantId: string,
    @Param('priceListId') priceListId: string,
    @Body() body: UpdatePriceListDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.updatePriceList(tenantId, priceListId, body, source)
  }

  @Put('pricing/price-lists/:priceListId/lines')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_PRICE_LIST])
  @ApiOperation({ summary: 'Replace the full line set for one selected price list' })
  @ApiBody({ type: ReplacePriceListLinesDto })
  async replacePriceListLines(
    @Param('tenantId') tenantId: string,
    @Param('priceListId') priceListId: string,
    @Body() body: ReplacePriceListLinesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.replacePriceListLines(tenantId, priceListId, body, source)
  }

  @Post('pricing/price-lists/:priceListId/status')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_PRICE_LIST])
  @ApiOperation({ summary: 'Change the lifecycle status of one selected price list' })
  @ApiBody({ type: ChangePriceListStatusDto })
  async changePriceListStatus(
    @Param('tenantId') tenantId: string,
    @Param('priceListId') priceListId: string,
    @Body() body: ChangePriceListStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.changePriceListStatus(tenantId, priceListId, body.targetStatus, source)
  }

  @Post('pricing/customer-price-agreements')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_CUSTOMER_AGREEMENT])
  @ApiOperation({ summary: 'Create one customer price agreement draft family' })
  @ApiBody({ type: CreateCustomerPriceAgreementDto })
  async createCustomerPriceAgreement(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateCustomerPriceAgreementDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.createCustomerPriceAgreement(tenantId, body, source)
  }

  @Put('pricing/customer-price-agreements/:customerPriceAgreementId/draft')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_CUSTOMER_AGREEMENT])
  @ApiOperation({ summary: 'Update one customer price agreement current draft version' })
  @ApiBody({ type: UpdateCustomerPriceAgreementDraftDto })
  async updateCustomerPriceAgreementDraft(
    @Param('tenantId') tenantId: string,
    @Param('customerPriceAgreementId') customerPriceAgreementId: string,
    @Body() body: UpdateCustomerPriceAgreementDraftDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.updateCustomerPriceAgreementDraft(
      tenantId,
      customerPriceAgreementId,
      body,
      source
    )
  }

  @Post('pricing/customer-price-agreements/:customerPriceAgreementId/publish')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_CUSTOMER_AGREEMENT])
  @ApiOperation({ summary: 'Publish one customer price agreement current draft version' })
  @ApiBody({ type: AuditReasonDto })
  async publishCustomerPriceAgreementVersion(
    @Param('tenantId') tenantId: string,
    @Param('customerPriceAgreementId') customerPriceAgreementId: string,
    @Body() body: AuditReasonDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.publishCustomerPriceAgreementVersion(
      tenantId,
      customerPriceAgreementId,
      body.auditReason,
      source
    )
  }

  @Post('pricing/customer-price-agreements/from-sales-order-lines/:salesOrderLineId')
  @PermissionCheckAll([SALES_PRICING_PERMISSION_CODES.MANAGE_CUSTOMER_AGREEMENT])
  @ApiOperation({ summary: 'Create or update one customer agreement draft from one frozen sales order line' })
  @ApiBody({ type: AuditReasonDto })
  async createCustomerPriceAgreementFromSalesOrderLine(
    @Param('tenantId') tenantId: string,
    @Param('salesOrderLineId') salesOrderLineId: string,
    @Body() body: AuditReasonDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.salesService.createCustomerPriceAgreementFromSalesOrderLine(
      tenantId,
      salesOrderLineId,
      body.auditReason,
      source
    )
  }
}
