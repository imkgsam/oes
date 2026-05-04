import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  CustomerPriceAgreementStatus,
  FulfillmentHandoffStatusCode,
  PriceListStatus,
  PriceListType,
  PricingExceptionStatus,
  PricingExceptionType,
  PricingSourceType,
  QuoteStatus,
  SearchQuotesResponse,
  SearchSalesOrdersResponse
} from '@oes/common/generated/sales_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { PricingManagementGrpcAdapter } from './adapters/pricing-management-grpc.adapter'
import { PricingQueryGrpcAdapter } from './adapters/pricing-query-grpc.adapter'
import { SalesManagementGrpcAdapter } from './adapters/sales-management-grpc.adapter'
import { SalesQueryGrpcAdapter } from './adapters/sales-query-grpc.adapter'

interface PriceSnapshotInput {
  currencyCode?: string
  resolvedAt?: string
  sourceLineRefId?: string
  sourceRefId?: string
  sourceType?: string
  sourceVersionNo?: number
  unitPriceAmount?: string
}

interface MoqSnapshotInput {
  moqQuantity?: string
  quantityUomCode?: string
  resolvedAt?: string
  sourceLineRefId?: string
  sourceRefId?: string
  sourceType?: string
  sourceVersionNo?: number
}

interface ExchangeRateSnapshotInput {
  effectiveAt?: string
  exchangeRateValue?: string
  financeRateRef?: string
  fromCurrencyCode?: string
  snapshottedAt?: string
  toCurrencyCode?: string
}

interface ExceptionPlaceholderInput {
  actualValue?: string
  baselineSourceType?: string
  baselineValue?: string
  currencyCode?: string
  detectedAt?: string
  exceptionType?: string
  quantityUomCode?: string
  status?: string
}

interface PriceQuantityDeliverySnapshotInput {
  currencyCode: string
  deliveryTerm?: string
  exceptionPlaceholders?: ExceptionPlaceholderInput[]
  exchangeRateSnapshot?: ExchangeRateSnapshotInput
  moqSnapshot?: MoqSnapshotInput
  priceSnapshot?: PriceSnapshotInput
  quantity: string
  requestedDeliveryDate?: string
  unitPrice: string
}

interface QuoteLineInput {
  customerItemSnapshot: {
    customerDisplayName?: string
    customerModel?: string
    customerSku?: string
  }
  itemId: string
  itemSnapshot: {
    itemCode: string
    itemName: string
  }
  lineNo: number
  packagingRequirementSnapshot: {
    packageLabel: string
    packageMode: string
    specialInstructions?: string
  }
  priceQuantityDeliverySnapshot: PriceQuantityDeliverySnapshotInput
  salesConfigSnapshot: {
    notes?: string
    salesUnitLabel: string
    salesUom: string
  }
}

interface OpportunityRefInput {
  opportunityId?: string
  opportunityName?: string
  opportunityNo?: string
}

interface PriceListLineInput {
  brandKey?: string
  itemId: string
  moqQuantity: string
  quantityUomCode: string
  unitPriceAmount: string
}

interface CustomerPriceAgreementDraftMutationInput {
  removals: Array<{
    brandKey?: string
    itemId: string
  }>
  upserts: PriceListLineInput[]
}

@Injectable()
// Builds the tenant-scoped quote, order, and pricing BFF model on top of the frozen sales-service phase 1 contracts.
export class SalesService {
  constructor(
    private readonly salesQueryAdapter: SalesQueryGrpcAdapter,
    private readonly salesManagementAdapter: SalesManagementGrpcAdapter,
    private readonly pricingQueryAdapter: PricingQueryGrpcAdapter,
    private readonly pricingManagementAdapter: PricingManagementGrpcAdapter
  ) {}

  /** searchQuotes returns the paged quote directory needed by the sales workspace list page. */
  async searchQuotes(
    tenantId: string,
    query: {
      customerTenantPartyId?: string
      keyword?: string
      page?: number
      pageSize?: number
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.salesQueryAdapter.searchQuotes(
      {
        customerTenantPartyId: normalize(query.customerTenantPartyId),
        keyword: normalize(query.keyword),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        status: toGrpcQuoteStatus(query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapQuotePage(result)
  }

  /** getQuote returns one current quote draft carrier for editing. */
  async getQuote(tenantId: string, quoteId: string, source: DownstreamRequestSource) {
    const result = await this.salesQueryAdapter.getQuote(
      {
        quoteId: requireNonBlank(quoteId, 'quoteId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapQuote(result.quote)
  }

  /** createQuote creates one new quote draft carrier without widening the underlying sales contract. */
  async createQuote(
    tenantId: string,
    input: {
      customerTenantPartyId: string
      draftLines?: QuoteLineInput[]
      opportunityRef?: OpportunityRefInput
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.salesManagementAdapter.createQuote(
      {
        customerTenantPartyId: requireNonBlank(
          input.customerTenantPartyId,
          'customerTenantPartyId'
        ),
        draftLines: mapLineInputs(input.draftLines),
        opportunityRef: mapOpportunityRef(input.opportunityRef),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapQuote(result.quote)
  }

  /** updateQuoteDraft replaces one current quote draft snapshot without creating a published version. */
  async updateQuoteDraft(
    tenantId: string,
    quoteId: string,
    input: {
      draftMutation: {
        customerTenantPartyId: string
        lines: QuoteLineInput[]
        opportunityRef?: OpportunityRefInput
      }
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.salesManagementAdapter.updateQuoteDraft(
      {
        draftMutation: {
          customerTenantPartyId: requireNonBlank(
            input.draftMutation.customerTenantPartyId,
            'draftMutation.customerTenantPartyId'
          ),
          lines: mapLineInputs(input.draftMutation.lines),
          opportunityRef: mapOpportunityRef(input.draftMutation.opportunityRef)
        },
        quoteId: requireNonBlank(quoteId, 'quoteId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapQuote(result.quote)
  }

  /** publishQuote publishes one current quote draft and returns both the current carrier and new immutable version. */
  async publishQuote(
    tenantId: string,
    quoteId: string,
    auditReason: string | undefined,
    source: DownstreamRequestSource
  ) {
    const result = await this.salesManagementAdapter.publishQuote(
      {
        auditReason,
        quoteId: requireNonBlank(quoteId, 'quoteId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      quote: mapQuote(result.quote),
      quoteVersion: mapQuoteVersion(result.quoteVersion)
    }
  }

  /** listQuoteVersions returns the paged published quote version history for one quote carrier. */
  async listQuoteVersions(
    tenantId: string,
    quoteId: string,
    query: {
      page?: number
      pageSize?: number
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.salesQueryAdapter.listQuoteVersions(
      {
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        quoteId: requireNonBlank(quoteId, 'quoteId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      quoteVersions: (result.quoteVersions ?? []).map((quoteVersion) =>
        mapQuoteVersion(quoteVersion)
      ),
      total: Number(result.total ?? 0)
    }
  }

  /** getQuoteVersion returns one immutable published quote version snapshot. */
  async getQuoteVersion(
    tenantId: string,
    quoteVersionId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.salesQueryAdapter.getQuoteVersion(
      {
        quoteVersionId: requireNonBlank(quoteVersionId, 'quoteVersionId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapQuoteVersion(result.quoteVersion)
  }

  /** convertQuoteVersionToOrder establishes one sales order from one immutable published quote version. */
  async convertQuoteVersionToOrder(
    tenantId: string,
    quoteVersionId: string,
    auditReason: string | undefined,
    source: DownstreamRequestSource
  ) {
    const result = await this.salesManagementAdapter.convertQuoteVersionToOrder(
      {
        auditReason,
        quoteVersionId: requireNonBlank(quoteVersionId, 'quoteVersionId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapSalesOrder(result.salesOrder)
  }

  /** searchSalesOrders returns the paged sales order directory needed by the sales workspace list page. */
  async searchSalesOrders(
    tenantId: string,
    query: {
      customerTenantPartyId?: string
      keyword?: string
      page?: number
      pageSize?: number
      productionGate?: boolean
      quoteVersionId?: string
      shippingGate?: boolean
      stockingGate?: boolean
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.salesQueryAdapter.searchSalesOrders(
      {
        customerTenantPartyId: normalize(query.customerTenantPartyId),
        keyword: normalize(query.keyword),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        productionGate: query.productionGate,
        quoteVersionId: normalize(query.quoteVersionId),
        shippingGate: query.shippingGate,
        stockingGate: query.stockingGate,
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapSalesOrderPage(result)
  }

  /** getSalesOrder returns one established sales order detail. */
  async getSalesOrder(
    tenantId: string,
    salesOrderId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.salesQueryAdapter.getSalesOrder(
      {
        salesOrderId: requireNonBlank(salesOrderId, 'salesOrderId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapSalesOrder(result.salesOrder)
  }

  /** submitFulfillmentHandoff records one sales-side handoff submission against an established sales order. */
  async submitFulfillmentHandoff(
    tenantId: string,
    salesOrderId: string,
    auditReason: string | undefined,
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const resolvedSalesOrderId = requireNonBlank(salesOrderId, 'salesOrderId')

    await this.salesManagementAdapter.submitFulfillmentHandoff(
      {
        auditReason,
        salesOrderId: resolvedSalesOrderId,
        tenantId: resolvedTenantId
      },
      source
    )

    const orderResult = await this.salesQueryAdapter.getSalesOrder(
      {
        salesOrderId: resolvedSalesOrderId,
        tenantId: resolvedTenantId
      },
      source
    )

    return mapSalesOrder(orderResult.salesOrder)
  }

  /** searchPriceLists returns the paged pricing catalog needed by the sales workspace pricing panel. */
  async searchPriceLists(
    tenantId: string,
    query: {
      currencyCode?: string
      effectiveAt?: string
      keyword?: string
      page?: number
      pageSize?: number
      priceListType?: string
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingQueryAdapter.searchPriceLists(
      {
        currencyCode: normalize(query.currencyCode),
        effectiveAt: normalize(query.effectiveAt),
        keyword: normalize(query.keyword),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        priceListType: toGrpcPriceListType(query.priceListType),
        status: toGrpcPriceListStatus(query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapPriceListPage(result)
  }

  /** getPriceList returns one selected price-list header. */
  async getPriceList(tenantId: string, priceListId: string, source: DownstreamRequestSource) {
    const result = await this.pricingQueryAdapter.getPriceList(
      {
        priceListId: requireNonBlank(priceListId, 'priceListId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapPriceList(result.priceList)
  }

  /** getPriceListLines returns the paged line set for one selected price list. */
  async getPriceListLines(
    tenantId: string,
    priceListId: string,
    query: {
      itemId?: string
      page?: number
      pageSize?: number
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingQueryAdapter.getPriceListLines(
      {
        itemId: normalize(query.itemId),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        priceListId: requireNonBlank(priceListId, 'priceListId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      priceListLines: (result.priceListLines ?? []).map((line) => mapPriceListLine(line)),
      total: Number(result.total ?? 0)
    }
  }

  /** getActiveCustomerPriceAgreement returns the current active agreement for one customer and currency. */
  async getActiveCustomerPriceAgreement(
    tenantId: string,
    query: {
      currencyCode: string
      customerTenantPartyId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingQueryAdapter.getActiveCustomerPriceAgreement(
      {
        currencyCode: requireNonBlank(query.currencyCode, 'currencyCode'),
        customerTenantPartyId: requireNonBlank(
          query.customerTenantPartyId,
          'customerTenantPartyId'
        ),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapCustomerPriceAgreement(result.customerPriceAgreement)
  }

  /** getCustomerPriceAgreement returns one current-head or explicit-version agreement record. */
  async getCustomerPriceAgreement(
    tenantId: string,
    customerPriceAgreementId: string,
    query: {
      versionNo?: number
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingQueryAdapter.getCustomerPriceAgreement(
      {
        customerPriceAgreementId: requireNonBlank(
          customerPriceAgreementId,
          'customerPriceAgreementId'
        ),
        tenantId: this.resolveTenantId(tenantId, source),
        versionNo: query.versionNo ? Number(query.versionNo) : undefined
      },
      source
    )

    return mapCustomerPriceAgreement(result.customerPriceAgreement)
  }

  /** listCustomerPriceAgreementVersions returns the paged version directory for one agreement family. */
  async listCustomerPriceAgreementVersions(
    tenantId: string,
    customerPriceAgreementId: string,
    query: {
      page?: number
      pageSize?: number
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingQueryAdapter.listCustomerPriceAgreementVersions(
      {
        customerPriceAgreementId: requireNonBlank(
          customerPriceAgreementId,
          'customerPriceAgreementId'
        ),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0),
      versions: (result.versions ?? []).map((version) =>
        mapCustomerPriceAgreementVersionSummary(version)
      )
    }
  }

  /** previewQuoteLinePricing returns the read-only pricing preview used by quote draft editing. */
  async previewQuoteLinePricing(
    tenantId: string,
    input: {
      brandKey?: string
      currencyCode: string
      customerTenantPartyId: string
      exchangeRateTargetCurrencyCode?: string
      itemId: string
      manualUnitPriceAmount?: string
      pricingAt?: string
      quantityUomCode: string
      requestedQuantity: string
      selectedPriceListId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingQueryAdapter.previewQuoteLinePricing(
      {
        brandKey: normalize(input.brandKey),
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        customerTenantPartyId: requireNonBlank(
          input.customerTenantPartyId,
          'customerTenantPartyId'
        ),
        exchangeRateTargetCurrencyCode: normalize(input.exchangeRateTargetCurrencyCode),
        itemId: requireNonBlank(input.itemId, 'itemId'),
        manualUnitPriceAmount: normalize(input.manualUnitPriceAmount),
        pricingAt: normalize(input.pricingAt),
        quantityUomCode: requireNonBlank(input.quantityUomCode, 'quantityUomCode'),
        requestedQuantity: requireNonBlank(input.requestedQuantity, 'requestedQuantity'),
        selectedPriceListId: normalize(input.selectedPriceListId),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapPricingPreview(result)
  }

  /** createPriceList creates one tenant-scoped price list through the sales pricing contract. */
  async createPriceList(
    tenantId: string,
    input: {
      currencyCode: string
      effectiveFrom: string
      effectiveTo?: string
      initialLines?: PriceListLineInput[]
      priceListName: string
      priceListType: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingManagementAdapter.createPriceList(
      {
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        effectiveFrom: requireNonBlank(input.effectiveFrom, 'effectiveFrom'),
        effectiveTo: normalize(input.effectiveTo),
        initialLines: mapPriceListLineInputs(input.initialLines),
        priceListName: requireNonBlank(input.priceListName, 'priceListName'),
        priceListType: toGrpcPriceListType(input.priceListType),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapPriceList(result.priceList)
  }

  /** updatePriceList updates one selected price-list header. */
  async updatePriceList(
    tenantId: string,
    priceListId: string,
    input: {
      effectiveFrom?: string
      effectiveTo?: string
      priceListName?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingManagementAdapter.updatePriceList(
      {
        effectiveFrom: normalize(input.effectiveFrom),
        effectiveTo: normalize(input.effectiveTo),
        priceListId: requireNonBlank(priceListId, 'priceListId'),
        priceListName: normalize(input.priceListName),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapPriceList(result.priceList)
  }

  /** replacePriceListLines replaces the full line set of one selected price list. */
  async replacePriceListLines(
    tenantId: string,
    priceListId: string,
    input: {
      lines: PriceListLineInput[]
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingManagementAdapter.replacePriceListLines(
      {
        lines: mapPriceListLineInputs(input.lines),
        priceListId: requireNonBlank(priceListId, 'priceListId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      priceList: mapPriceList(result.priceList),
      priceListLines: (result.priceListLines ?? []).map((line) => mapPriceListLine(line))
    }
  }

  /** changePriceListStatus updates the lifecycle status of one selected price list. */
  async changePriceListStatus(
    tenantId: string,
    priceListId: string,
    input: { targetStatus?: string } | string,
    source: DownstreamRequestSource
  ) {
    const targetStatus = typeof input === 'string' ? input : input.targetStatus
    const result = await this.pricingManagementAdapter.changePriceListStatus(
      {
        priceListId: requireNonBlank(priceListId, 'priceListId'),
        targetStatus: toGrpcPriceListStatus(targetStatus),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapPriceList(result.priceList)
  }

  /** createCustomerPriceAgreement creates one draft agreement family head for a customer and currency. */
  async createCustomerPriceAgreement(
    tenantId: string,
    input: {
      currencyCode: string
      customerTenantPartyId: string
      initialLines?: PriceListLineInput[]
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingManagementAdapter.createCustomerPriceAgreement(
      {
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        customerTenantPartyId: requireNonBlank(
          input.customerTenantPartyId,
          'customerTenantPartyId'
        ),
        initialLines: mapPriceListLineInputs(input.initialLines),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapCustomerPriceAgreement(result.customerPriceAgreement)
  }

  /** updateCustomerPriceAgreementDraft updates one agreement family's current draft version. */
  async updateCustomerPriceAgreementDraft(
    tenantId: string,
    customerPriceAgreementId: string,
    input: {
      draftMutation: CustomerPriceAgreementDraftMutationInput
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingManagementAdapter.updateCustomerPriceAgreementDraft(
      {
        customerPriceAgreementId: requireNonBlank(
          customerPriceAgreementId,
          'customerPriceAgreementId'
        ),
        draftMutation: mapCustomerPriceAgreementDraftMutation(input.draftMutation),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapCustomerPriceAgreement(result.customerPriceAgreement)
  }

  /** publishCustomerPriceAgreementVersion publishes the current draft version of one agreement family. */
  async publishCustomerPriceAgreementVersion(
    tenantId: string,
    customerPriceAgreementId: string,
    auditReason: string | undefined,
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingManagementAdapter.publishCustomerPriceAgreementVersion(
      {
        auditReason,
        customerPriceAgreementId: requireNonBlank(
          customerPriceAgreementId,
          'customerPriceAgreementId'
        ),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapCustomerPriceAgreement(result.customerPriceAgreement)
  }

  /** createCustomerPriceAgreementFromSalesOrderLine creates or updates a draft agreement from one frozen order line. */
  async createCustomerPriceAgreementFromSalesOrderLine(
    tenantId: string,
    salesOrderLineId: string,
    auditReason: string | undefined,
    source: DownstreamRequestSource
  ) {
    const result = await this.pricingManagementAdapter.createCustomerPriceAgreementFromSalesOrderLine(
      {
        auditReason,
        salesOrderLineId: requireNonBlank(salesOrderLineId, 'salesOrderLineId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapCustomerPriceAgreement(result.customerPriceAgreement)
  }

  /** resolveTenantId keeps tenant-scoped sales requests pinned to the operator tenant unless the operator is at system scope. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage sales quotes, orders, and pricing in their current tenant'
      )
    }

    return operatorTenantId
  }
}

/** mapQuotePage converts one generated quote page into the stable tenant-web BFF shape. */
function mapQuotePage(result: SearchQuotesResponse) {
  return {
    page: Number(result.page ?? 1),
    pageSize: Number(result.pageSize ?? 20),
    quotes: (result.quotes ?? []).map((quote) => mapQuote(quote)),
    total: Number(result.total ?? 0)
  }
}

/** mapSalesOrderPage converts one generated sales-order page into the stable tenant-web BFF shape. */
function mapSalesOrderPage(result: SearchSalesOrdersResponse) {
  return {
    page: Number(result.page ?? 1),
    pageSize: Number(result.pageSize ?? 20),
    salesOrders: (result.salesOrders ?? []).map((salesOrder) => mapSalesOrder(salesOrder)),
    total: Number(result.total ?? 0)
  }
}

/** mapPriceListPage converts one generated price-list page into the stable tenant-web BFF shape. */
function mapPriceListPage(result: any) {
  return {
    page: Number(result?.page ?? 1),
    pageSize: Number(result?.pageSize ?? 20),
    priceLists: (result?.priceLists ?? []).map((priceList: any) => mapPriceList(priceList)),
    total: Number(result?.total ?? 0)
  }
}

/** mapQuote flattens one generated quote read model into the tenant-web quote detail shape. */
function mapQuote(quote?: SearchQuotesResponse['quotes'][number]) {
  return {
    customerTenantPartyId: quote?.customerTenantPartyId ?? '',
    latestPublishedVersionId: normalize(quote?.latestPublishedVersionId) ?? '',
    lines: (quote?.lines ?? []).map((line) => mapQuoteLine(line)),
    opportunityRef: quote?.opportunityRef
      ? {
          opportunityId: quote.opportunityRef.opportunityId ?? '',
          opportunityName: quote.opportunityRef.opportunityName ?? '',
          opportunityNo: quote.opportunityRef.opportunityNo ?? ''
        }
      : undefined,
    quoteId: quote?.quoteId ?? '',
    quoteNo: quote?.quoteNo ?? '',
    status: fromGrpcQuoteStatus(quote?.status),
    tenantId: quote?.tenantId ?? ''
  }
}

/** mapQuoteVersion flattens one generated quote version read model into the tenant-web published version shape. */
function mapQuoteVersion(quoteVersion?: {
  customerTenantPartyId?: string
  lines?: any[]
  publishedAt?: string
  quoteId?: string
  quoteNo?: string
  quoteVersionId?: string
  tenantId?: string
  versionNo?: number
}) {
  return {
    customerTenantPartyId: quoteVersion?.customerTenantPartyId ?? '',
    lines: (quoteVersion?.lines ?? []).map((line) => mapQuoteLine(line)),
    publishedAt: quoteVersion?.publishedAt ?? '',
    quoteId: quoteVersion?.quoteId ?? '',
    quoteNo: quoteVersion?.quoteNo ?? '',
    quoteVersionId: quoteVersion?.quoteVersionId ?? '',
    tenantId: quoteVersion?.tenantId ?? '',
    versionNo: Number(quoteVersion?.versionNo ?? 0)
  }
}

/** mapSalesOrder flattens one generated sales order read model into the tenant-web order detail shape. */
function mapSalesOrder(order?: {
  commercialGateSummary?: {
    orderEstablished?: boolean
    productionGate?: boolean
    shippingGate?: boolean
    stockingGate?: boolean
  }
  customerTenantPartyId?: string
  fulfillmentHandoffStatus?: {
    status?: FulfillmentHandoffStatusCode
    submittedAt?: string
  }
  lines?: any[]
  quoteId?: string
  quoteVersionId?: string
  salesOrderId?: string
  salesOrderNo?: string
  tenantId?: string
}) {
  return {
    commercialGateSummary: {
      orderEstablished: Boolean(order?.commercialGateSummary?.orderEstablished),
      productionGate: Boolean(order?.commercialGateSummary?.productionGate),
      shippingGate: Boolean(order?.commercialGateSummary?.shippingGate),
      stockingGate: Boolean(order?.commercialGateSummary?.stockingGate)
    },
    customerTenantPartyId: order?.customerTenantPartyId ?? '',
    fulfillmentHandoffStatus: {
      status: fromGrpcHandoffStatus(order?.fulfillmentHandoffStatus?.status),
      submittedAt: order?.fulfillmentHandoffStatus?.submittedAt ?? ''
    },
    lines: (order?.lines ?? []).map((line) => ({
      customerItemSnapshot: mapCustomerItemSnapshot(line?.customerItemSnapshot),
      itemId: line?.itemId ?? '',
      itemSnapshot: mapItemSnapshot(line?.itemSnapshot),
      lineNo: Number(line?.lineNo ?? 0),
      packagingRequirementSnapshot: mapPackagingRequirementSnapshot(
        line?.packagingRequirementSnapshot
      ),
      priceQuantityDeliverySnapshot: mapPriceQuantityDeliverySnapshot(
        line?.priceQuantityDeliverySnapshot
      ),
      salesConfigSnapshot: mapSalesConfigSnapshot(line?.salesConfigSnapshot),
      salesOrderLineId: line?.salesOrderLineId ?? ''
    })),
    quoteId: order?.quoteId ?? '',
    quoteVersionId: order?.quoteVersionId ?? '',
    salesOrderId: order?.salesOrderId ?? '',
    salesOrderNo: order?.salesOrderNo ?? '',
    tenantId: order?.tenantId ?? ''
  }
}

/** mapQuoteLine flattens one generated quote line into the stable tenant-web line snapshot shape. */
function mapQuoteLine(line?: {
  customerItemSnapshot?: any
  itemId?: string
  itemSnapshot?: any
  lineNo?: number
  packagingRequirementSnapshot?: any
  priceQuantityDeliverySnapshot?: any
  quoteLineId?: string
  salesConfigSnapshot?: any
}) {
  return {
    customerItemSnapshot: mapCustomerItemSnapshot(line?.customerItemSnapshot),
    itemId: line?.itemId ?? '',
    itemSnapshot: mapItemSnapshot(line?.itemSnapshot),
    lineNo: Number(line?.lineNo ?? 0),
    packagingRequirementSnapshot: mapPackagingRequirementSnapshot(
      line?.packagingRequirementSnapshot
    ),
    priceQuantityDeliverySnapshot: mapPriceQuantityDeliverySnapshot(
      line?.priceQuantityDeliverySnapshot
    ),
    quoteLineId: line?.quoteLineId ?? '',
    salesConfigSnapshot: mapSalesConfigSnapshot(line?.salesConfigSnapshot)
  }
}

/** mapPriceList flattens one generated price-list read model into the tenant-web pricing catalog shape. */
function mapPriceList(priceList?: any) {
  return {
    currencyCode: priceList?.currencyCode ?? '',
    effectiveFrom: priceList?.effectiveFrom ?? '',
    effectiveTo: priceList?.effectiveTo ?? '',
    priceListId: priceList?.priceListId ?? '',
    priceListName: priceList?.priceListName ?? '',
    priceListType: fromGrpcPriceListType(priceList?.priceListType),
    status: fromGrpcPriceListStatus(priceList?.status),
    tenantId: priceList?.tenantId ?? ''
  }
}

/** mapPriceListLine flattens one generated price-list line into the tenant-web pricing editor shape. */
function mapPriceListLine(line?: any) {
  return {
    brandKey: line?.brandKey ?? '',
    itemId: line?.itemId ?? '',
    lineNo: Number(line?.lineNo ?? 0),
    moqSnapshot: mapMoqSnapshot(line?.moqSnapshot),
    priceListLineId: line?.priceListLineId ?? '',
    priceSnapshot: mapPriceSnapshot(line?.priceSnapshot)
  }
}

/** mapCustomerPriceAgreement flattens one generated agreement record into the tenant-web pricing editor shape. */
function mapCustomerPriceAgreement(agreement?: any) {
  return {
    currencyCode: agreement?.currencyCode ?? '',
    customerPriceAgreementId: agreement?.customerPriceAgreementId ?? '',
    customerTenantPartyId: agreement?.customerTenantPartyId ?? '',
    lines: (agreement?.lines ?? []).map((line: any) => ({
      brandKey: line?.brandKey ?? '',
      customerPriceAgreementLineId: line?.customerPriceAgreementLineId ?? '',
      itemId: line?.itemId ?? '',
      lineNo: Number(line?.lineNo ?? 0),
      moqSnapshot: mapMoqSnapshot(line?.moqSnapshot),
      priceSnapshot: mapPriceSnapshot(line?.priceSnapshot)
    })),
    publishedAt: agreement?.publishedAt ?? '',
    status: fromGrpcCustomerPriceAgreementStatus(agreement?.status),
    tenantId: agreement?.tenantId ?? '',
    versionNo: Number(agreement?.versionNo ?? 0)
  }
}

/** mapCustomerPriceAgreementVersionSummary flattens one generated version summary into the tenant-web agreement history shape. */
function mapCustomerPriceAgreementVersionSummary(version?: any) {
  return {
    customerPriceAgreementId: version?.customerPriceAgreementId ?? '',
    lineCount: Number(version?.lineCount ?? 0),
    publishedAt: version?.publishedAt ?? '',
    status: fromGrpcCustomerPriceAgreementStatus(version?.status),
    versionNo: Number(version?.versionNo ?? 0)
  }
}

/** mapPricingPreview flattens one generated pricing preview into the stable tenant-web quote-line preview shape. */
function mapPricingPreview(result?: any) {
  return {
    exceptionPlaceholders: (result?.exceptionPlaceholders ?? []).map((item: any) =>
      mapExceptionPlaceholder(item)
    ),
    exchangeRateSnapshot: result?.exchangeRateSnapshot
      ? mapExchangeRateSnapshot(result.exchangeRateSnapshot)
      : undefined,
    moqSnapshot: result?.moqSnapshot ? mapMoqSnapshot(result.moqSnapshot) : undefined,
    priceSnapshot: result?.priceSnapshot ? mapPriceSnapshot(result.priceSnapshot) : undefined
  }
}

/** mapItemSnapshot flattens one generated item snapshot into the tenant-web manual line item summary shape. */
function mapItemSnapshot(snapshot?: { itemCode?: string; itemName?: string }) {
  return {
    itemCode: snapshot?.itemCode ?? '',
    itemName: snapshot?.itemName ?? ''
  }
}

/** mapSalesConfigSnapshot flattens one generated sales config snapshot into the tenant-web manual line config shape. */
function mapSalesConfigSnapshot(snapshot?: {
  notes?: string
  salesUnitLabel?: string
  salesUom?: string
}) {
  return {
    notes: snapshot?.notes ?? '',
    salesUnitLabel: snapshot?.salesUnitLabel ?? '',
    salesUom: snapshot?.salesUom ?? ''
  }
}

/** mapPackagingRequirementSnapshot flattens one generated packaging requirement snapshot into the tenant-web manual line packaging shape. */
function mapPackagingRequirementSnapshot(snapshot?: {
  packageLabel?: string
  packageMode?: string
  specialInstructions?: string
}) {
  return {
    packageLabel: snapshot?.packageLabel ?? '',
    packageMode: snapshot?.packageMode ?? '',
    specialInstructions: snapshot?.specialInstructions ?? ''
  }
}

/** mapPriceQuantityDeliverySnapshot flattens one generated price, quantity, and delivery snapshot into the tenant-web line pricing shape. */
function mapPriceQuantityDeliverySnapshot(snapshot?: any) {
  return {
    currencyCode: snapshot?.currencyCode ?? '',
    deliveryTerm: snapshot?.deliveryTerm ?? '',
    exceptionPlaceholders: (snapshot?.exceptionPlaceholders ?? []).map((item: any) =>
      mapExceptionPlaceholder(item)
    ),
    exchangeRateSnapshot: snapshot?.exchangeRateSnapshot
      ? mapExchangeRateSnapshot(snapshot.exchangeRateSnapshot)
      : undefined,
    moqSnapshot: snapshot?.moqSnapshot ? mapMoqSnapshot(snapshot.moqSnapshot) : undefined,
    priceSnapshot: snapshot?.priceSnapshot ? mapPriceSnapshot(snapshot.priceSnapshot) : undefined,
    quantity: snapshot?.quantity ?? '',
    requestedDeliveryDate: snapshot?.requestedDeliveryDate ?? '',
    unitPrice: snapshot?.unitPrice ?? ''
  }
}

/** mapCustomerItemSnapshot flattens one generated customer item snapshot into the tenant-web line customer-facing shape. */
function mapCustomerItemSnapshot(snapshot?: {
  customerDisplayName?: string
  customerModel?: string
  customerSku?: string
}) {
  return {
    customerDisplayName: snapshot?.customerDisplayName ?? '',
    customerModel: snapshot?.customerModel ?? '',
    customerSku: snapshot?.customerSku ?? ''
  }
}

/** mapPriceSnapshot flattens one generated pricing snapshot into the tenant-web preview shape. */
function mapPriceSnapshot(snapshot?: any) {
  return {
    currencyCode: snapshot?.currencyCode ?? '',
    resolvedAt: snapshot?.resolvedAt ?? '',
    sourceLineRefId: snapshot?.sourceLineRefId ?? '',
    sourceRefId: snapshot?.sourceRefId ?? '',
    sourceType: fromGrpcPricingSourceType(snapshot?.sourceType),
    sourceVersionNo: Number(snapshot?.sourceVersionNo ?? 0),
    unitPriceAmount: snapshot?.unitPriceAmount ?? ''
  }
}

/** mapMoqSnapshot flattens one generated MOQ snapshot into the tenant-web preview shape. */
function mapMoqSnapshot(snapshot?: any) {
  return {
    moqQuantity: snapshot?.moqQuantity ?? '',
    quantityUomCode: snapshot?.quantityUomCode ?? '',
    resolvedAt: snapshot?.resolvedAt ?? '',
    sourceLineRefId: snapshot?.sourceLineRefId ?? '',
    sourceRefId: snapshot?.sourceRefId ?? '',
    sourceType: fromGrpcPricingSourceType(snapshot?.sourceType),
    sourceVersionNo: Number(snapshot?.sourceVersionNo ?? 0)
  }
}

/** mapExchangeRateSnapshot flattens one generated FX snapshot into the tenant-web preview shape. */
function mapExchangeRateSnapshot(snapshot?: any) {
  return {
    effectiveAt: snapshot?.effectiveAt ?? '',
    exchangeRateValue: snapshot?.exchangeRateValue ?? '',
    financeRateRef: snapshot?.financeRateRef ?? '',
    fromCurrencyCode: snapshot?.fromCurrencyCode ?? '',
    snapshottedAt: snapshot?.snapshottedAt ?? '',
    toCurrencyCode: snapshot?.toCurrencyCode ?? ''
  }
}

/** mapExceptionPlaceholder flattens one generated pricing exception placeholder into the tenant-web warning shape. */
function mapExceptionPlaceholder(snapshot?: any) {
  return {
    actualValue: snapshot?.actualValue ?? '',
    baselineSourceType: fromGrpcPricingSourceType(snapshot?.baselineSourceType),
    baselineValue: snapshot?.baselineValue ?? '',
    currencyCode: snapshot?.currencyCode ?? '',
    detectedAt: snapshot?.detectedAt ?? '',
    exceptionType: fromGrpcPricingExceptionType(snapshot?.exceptionType),
    quantityUomCode: snapshot?.quantityUomCode ?? '',
    status: fromGrpcPricingExceptionStatus(snapshot?.status)
  }
}

/** mapOpportunityRef normalizes one optional opportunity summary into the downstream generated sales request shape. */
function mapOpportunityRef(input?: OpportunityRefInput) {
  if (!input) {
    return undefined
  }

  return {
    opportunityId: input.opportunityId ?? '',
    opportunityName: input.opportunityName ?? '',
    opportunityNo: input.opportunityNo ?? ''
  }
}

/** mapLineInputs converts one array of tenant-web line snapshots into the downstream generated sales request shape. */
function mapLineInputs(lines?: QuoteLineInput[]) {
  return (lines ?? []).map((line) => ({
    customerItemSnapshot: {
      customerDisplayName: line.customerItemSnapshot.customerDisplayName ?? '',
      customerModel: line.customerItemSnapshot.customerModel ?? '',
      customerSku: line.customerItemSnapshot.customerSku ?? ''
    },
    itemId: requireNonBlank(line.itemId, 'itemId'),
    itemSnapshot: {
      itemCode: line.itemSnapshot.itemCode ?? '',
      itemName: line.itemSnapshot.itemName ?? ''
    },
    lineNo: Number(line.lineNo ?? 0),
    packagingRequirementSnapshot: {
      packageLabel: line.packagingRequirementSnapshot.packageLabel ?? '',
      packageMode: line.packagingRequirementSnapshot.packageMode ?? '',
      specialInstructions: line.packagingRequirementSnapshot.specialInstructions ?? ''
    },
    priceQuantityDeliverySnapshot: {
      currencyCode: line.priceQuantityDeliverySnapshot.currencyCode ?? '',
      deliveryTerm: line.priceQuantityDeliverySnapshot.deliveryTerm ?? '',
      exceptionPlaceholders: (line.priceQuantityDeliverySnapshot.exceptionPlaceholders ?? []).map(
        (item) => ({
          actualValue: item.actualValue ?? '',
          baselineSourceType: toGrpcPricingSourceType(item.baselineSourceType),
          baselineValue: item.baselineValue ?? '',
          currencyCode: item.currencyCode ?? '',
          detectedAt: item.detectedAt ?? '',
          exceptionType: toGrpcPricingExceptionType(item.exceptionType),
          quantityUomCode: item.quantityUomCode ?? '',
          status: toGrpcPricingExceptionStatus(item.status)
        })
      ),
      exchangeRateSnapshot: line.priceQuantityDeliverySnapshot.exchangeRateSnapshot
        ? {
            effectiveAt:
              line.priceQuantityDeliverySnapshot.exchangeRateSnapshot.effectiveAt ?? '',
            exchangeRateValue:
              line.priceQuantityDeliverySnapshot.exchangeRateSnapshot.exchangeRateValue ?? '',
            financeRateRef:
              line.priceQuantityDeliverySnapshot.exchangeRateSnapshot.financeRateRef ?? '',
            fromCurrencyCode:
              line.priceQuantityDeliverySnapshot.exchangeRateSnapshot.fromCurrencyCode ?? '',
            snapshottedAt:
              line.priceQuantityDeliverySnapshot.exchangeRateSnapshot.snapshottedAt ?? '',
            toCurrencyCode:
              line.priceQuantityDeliverySnapshot.exchangeRateSnapshot.toCurrencyCode ?? ''
          }
        : undefined,
      moqSnapshot: line.priceQuantityDeliverySnapshot.moqSnapshot
        ? {
            moqQuantity: line.priceQuantityDeliverySnapshot.moqSnapshot.moqQuantity ?? '',
            quantityUomCode:
              line.priceQuantityDeliverySnapshot.moqSnapshot.quantityUomCode ?? '',
            resolvedAt: line.priceQuantityDeliverySnapshot.moqSnapshot.resolvedAt ?? '',
            sourceLineRefId:
              line.priceQuantityDeliverySnapshot.moqSnapshot.sourceLineRefId ?? '',
            sourceRefId: line.priceQuantityDeliverySnapshot.moqSnapshot.sourceRefId ?? '',
            sourceType: toGrpcPricingSourceType(
              line.priceQuantityDeliverySnapshot.moqSnapshot.sourceType
            ),
            sourceVersionNo: Number(
              line.priceQuantityDeliverySnapshot.moqSnapshot.sourceVersionNo ?? 0
            )
          }
        : undefined,
      priceSnapshot: line.priceQuantityDeliverySnapshot.priceSnapshot
        ? {
            currencyCode: line.priceQuantityDeliverySnapshot.priceSnapshot.currencyCode ?? '',
            resolvedAt: line.priceQuantityDeliverySnapshot.priceSnapshot.resolvedAt ?? '',
            sourceLineRefId:
              line.priceQuantityDeliverySnapshot.priceSnapshot.sourceLineRefId ?? '',
            sourceRefId: line.priceQuantityDeliverySnapshot.priceSnapshot.sourceRefId ?? '',
            sourceType: toGrpcPricingSourceType(
              line.priceQuantityDeliverySnapshot.priceSnapshot.sourceType
            ),
            sourceVersionNo: Number(
              line.priceQuantityDeliverySnapshot.priceSnapshot.sourceVersionNo ?? 0
            ),
            unitPriceAmount:
              line.priceQuantityDeliverySnapshot.priceSnapshot.unitPriceAmount ?? ''
          }
        : undefined,
      quantity: line.priceQuantityDeliverySnapshot.quantity ?? '',
      requestedDeliveryDate: line.priceQuantityDeliverySnapshot.requestedDeliveryDate ?? '',
      unitPrice: line.priceQuantityDeliverySnapshot.unitPrice ?? ''
    },
    salesConfigSnapshot: {
      notes: line.salesConfigSnapshot.notes ?? '',
      salesUnitLabel: line.salesConfigSnapshot.salesUnitLabel ?? '',
      salesUom: line.salesConfigSnapshot.salesUom ?? ''
    }
  }))
}

/** mapPriceListLineInputs converts one array of UI price-list or agreement line edits into the downstream generated pricing line shape. */
function mapPriceListLineInputs(lines?: PriceListLineInput[]) {
  return (lines ?? []).map((line) => ({
    brandKey: normalize(line.brandKey),
    itemId: requireNonBlank(line.itemId, 'itemId'),
    moqQuantity: requireNonBlank(line.moqQuantity, 'moqQuantity'),
    quantityUomCode: requireNonBlank(line.quantityUomCode, 'quantityUomCode'),
    unitPriceAmount: requireNonBlank(line.unitPriceAmount, 'unitPriceAmount')
  }))
}

/** mapCustomerPriceAgreementDraftMutation converts one UI agreement draft mutation into the downstream generated draft-mutation shape. */
function mapCustomerPriceAgreementDraftMutation(input: CustomerPriceAgreementDraftMutationInput) {
  return {
    removals: (input.removals ?? []).map((removal) => ({
      brandKey: normalize(removal.brandKey),
      itemId: requireNonBlank(removal.itemId, 'itemId')
    })),
    upserts: mapPriceListLineInputs(input.upserts)
  }
}

/** toGrpcQuoteStatus converts one optional BFF quote status filter into the generated sales enum filter. */
function toGrpcQuoteStatus(status?: string): QuoteStatus {
  if (status === 'DRAFT') {
    return QuoteStatus.QUOTE_STATUS_DRAFT
  }
  if (status === 'PUBLISHED') {
    return QuoteStatus.QUOTE_STATUS_PUBLISHED
  }
  return QuoteStatus.QUOTE_STATUS_UNSPECIFIED
}

/** toGrpcPriceListType converts one BFF price-list type string into the generated pricing enum. */
function toGrpcPriceListType(type?: string): PriceListType {
  if (type === 'ACTIVITY') {
    return PriceListType.PRICE_LIST_TYPE_ACTIVITY
  }
  if (type === 'EXHIBITION') {
    return PriceListType.PRICE_LIST_TYPE_EXHIBITION
  }
  return PriceListType.PRICE_LIST_TYPE_STANDARD
}

/** toGrpcPriceListStatus converts one BFF price-list status string into the generated pricing enum. */
function toGrpcPriceListStatus(status?: string): PriceListStatus {
  if (status === 'ACTIVE') {
    return PriceListStatus.PRICE_LIST_STATUS_ACTIVE
  }
  if (status === 'INACTIVE') {
    return PriceListStatus.PRICE_LIST_STATUS_INACTIVE
  }
  if (status === 'DRAFT') {
    return PriceListStatus.PRICE_LIST_STATUS_DRAFT
  }
  return PriceListStatus.PRICE_LIST_STATUS_UNSPECIFIED
}

/** toGrpcPricingSourceType converts one BFF pricing source string into the generated pricing source enum. */
function toGrpcPricingSourceType(type?: string): PricingSourceType {
  if (type === 'PRICE_LIST') {
    return PricingSourceType.PRICING_SOURCE_TYPE_PRICE_LIST
  }
  if (type === 'MANUAL') {
    return PricingSourceType.PRICING_SOURCE_TYPE_MANUAL
  }
  return PricingSourceType.PRICING_SOURCE_TYPE_CUSTOMER_PRICE_AGREEMENT
}

/** toGrpcPricingExceptionType converts one BFF pricing exception string into the generated exception enum. */
function toGrpcPricingExceptionType(type?: string): PricingExceptionType {
  if (type === 'LOW_MOQ') {
    return PricingExceptionType.PRICING_EXCEPTION_TYPE_LOW_MOQ
  }
  return PricingExceptionType.PRICING_EXCEPTION_TYPE_LOW_PRICE
}

/** toGrpcPricingExceptionStatus converts one BFF pricing exception status string into the generated status enum. */
function toGrpcPricingExceptionStatus(status?: string): PricingExceptionStatus {
  if (status === 'REQUIRED') {
    return PricingExceptionStatus.PRICING_EXCEPTION_STATUS_REQUIRED
  }
  return PricingExceptionStatus.PRICING_EXCEPTION_STATUS_NOT_REQUIRED
}

/** fromGrpcQuoteStatus converts one generated sales quote status enum into the stable BFF string value. */
function fromGrpcQuoteStatus(status?: QuoteStatus): string {
  return status === QuoteStatus.QUOTE_STATUS_PUBLISHED ? 'PUBLISHED' : 'DRAFT'
}

/** matchesGrpcEnumName checks whether one enum-like value matches any generated or stable enum labels. */
function matchesGrpcEnumName(value: unknown, ...names: string[]): boolean {
  if (typeof value !== 'string') {
    return false
  }
  return names.includes(value)
}

/** fromGrpcPriceListType converts one generated pricing type enum into the stable BFF string value. */
function fromGrpcPriceListType(type?: PriceListType | string): string {
  if (
    type === PriceListType.PRICE_LIST_TYPE_ACTIVITY ||
    matchesGrpcEnumName(type, 'PRICE_LIST_TYPE_ACTIVITY', 'ACTIVITY')
  ) {
    return 'ACTIVITY'
  }
  if (
    type === PriceListType.PRICE_LIST_TYPE_EXHIBITION ||
    matchesGrpcEnumName(type, 'PRICE_LIST_TYPE_EXHIBITION', 'EXHIBITION')
  ) {
    return 'EXHIBITION'
  }
  return 'STANDARD'
}

/** fromGrpcPriceListStatus converts one generated price-list status enum into the stable BFF string value. */
function fromGrpcPriceListStatus(status?: PriceListStatus | string): string {
  if (
    status === PriceListStatus.PRICE_LIST_STATUS_ACTIVE ||
    matchesGrpcEnumName(status, 'PRICE_LIST_STATUS_ACTIVE', 'ACTIVE')
  ) {
    return 'ACTIVE'
  }
  if (
    status === PriceListStatus.PRICE_LIST_STATUS_INACTIVE ||
    matchesGrpcEnumName(status, 'PRICE_LIST_STATUS_INACTIVE', 'INACTIVE')
  ) {
    return 'INACTIVE'
  }
  return 'DRAFT'
}

/** fromGrpcCustomerPriceAgreementStatus converts one generated agreement status enum into the stable BFF string value. */
function fromGrpcCustomerPriceAgreementStatus(
  status?: CustomerPriceAgreementStatus | string
): string {
  if (
    status === CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_ACTIVE ||
    matchesGrpcEnumName(
      status,
      'CUSTOMER_PRICE_AGREEMENT_STATUS_ACTIVE',
      'ACTIVE'
    )
  ) {
    return 'ACTIVE'
  }
  if (
    status === CustomerPriceAgreementStatus.CUSTOMER_PRICE_AGREEMENT_STATUS_SUPERSEDED ||
    matchesGrpcEnumName(
      status,
      'CUSTOMER_PRICE_AGREEMENT_STATUS_SUPERSEDED',
      'SUPERSEDED'
    )
  ) {
    return 'SUPERSEDED'
  }
  return 'DRAFT'
}

/** fromGrpcPricingSourceType converts one generated pricing source enum into the stable BFF string value. */
function fromGrpcPricingSourceType(type?: PricingSourceType | string): string {
  if (
    type === PricingSourceType.PRICING_SOURCE_TYPE_PRICE_LIST ||
    matchesGrpcEnumName(type, 'PRICING_SOURCE_TYPE_PRICE_LIST', 'PRICE_LIST')
  ) {
    return 'PRICE_LIST'
  }
  if (
    type === PricingSourceType.PRICING_SOURCE_TYPE_MANUAL ||
    matchesGrpcEnumName(type, 'PRICING_SOURCE_TYPE_MANUAL', 'MANUAL')
  ) {
    return 'MANUAL'
  }
  return 'CUSTOMER_PRICE_AGREEMENT'
}

/** fromGrpcPricingExceptionType converts one generated pricing exception enum into the stable BFF string value. */
function fromGrpcPricingExceptionType(type?: PricingExceptionType): string {
  if (type === PricingExceptionType.PRICING_EXCEPTION_TYPE_LOW_MOQ) {
    return 'LOW_MOQ'
  }
  return 'LOW_PRICE'
}

/** fromGrpcPricingExceptionStatus converts one generated pricing exception status enum into the stable BFF string value. */
function fromGrpcPricingExceptionStatus(status?: PricingExceptionStatus | string): string {
  return status === PricingExceptionStatus.PRICING_EXCEPTION_STATUS_REQUIRED ||
    matchesGrpcEnumName(status, 'PRICING_EXCEPTION_STATUS_REQUIRED', 'REQUIRED')
    ? 'REQUIRED'
    : 'NOT_REQUIRED'
}

/** fromGrpcHandoffStatus converts one generated handoff status enum into the stable BFF string value. */
function fromGrpcHandoffStatus(status?: FulfillmentHandoffStatusCode): string {
  if (status === FulfillmentHandoffStatusCode.FULFILLMENT_HANDOFF_STATUS_CODE_SUBMITTED) {
    return 'SUBMITTED'
  }
  return 'NOT_SUBMITTED'
}

/** requireNonBlank trims one required string and rejects blank values before a downstream call is attempted. */
function requireNonBlank(value: string | undefined, field: string): string {
  const normalized = normalize(value)
  if (!normalized) {
    throw new Error(`${field} is required`)
  }
  return normalized
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
