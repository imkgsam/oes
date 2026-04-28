import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  FulfillmentHandoffStatusCode,
  QuoteStatus,
  SearchQuotesResponse,
  SearchSalesOrdersResponse
} from '@oes/common/generated/sales_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { SalesManagementGrpcAdapter } from './adapters/sales-management-grpc.adapter'
import { SalesQueryGrpcAdapter } from './adapters/sales-query-grpc.adapter'

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
  priceQuantityDeliverySnapshot: {
    currencyCode: string
    deliveryTerm?: string
    quantity: string
    requestedDeliveryDate?: string
    unitPrice: string
  }
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

@Injectable()
// Builds the minimum tenant-scoped quote-order BFF model on top of the frozen sales-service phase 1 contracts.
export class SalesService {
  constructor(
    private readonly salesQueryAdapter: SalesQueryGrpcAdapter,
    private readonly salesManagementAdapter: SalesManagementGrpcAdapter
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

  /** resolveTenantId keeps tenant-scoped sales requests pinned to the operator tenant unless the operator is at system scope. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage sales quotes and orders in their current tenant'
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

/** mapQuoteLine flattens one generated quote line into the stable tenant-web manual line snapshot shape. */
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

/** mapPriceQuantityDeliverySnapshot flattens one generated price, quantity, and delivery snapshot into the tenant-web manual line pricing shape. */
function mapPriceQuantityDeliverySnapshot(snapshot?: {
  currencyCode?: string
  deliveryTerm?: string
  quantity?: string
  requestedDeliveryDate?: string
  unitPrice?: string
}) {
  return {
    currencyCode: snapshot?.currencyCode ?? '',
    deliveryTerm: snapshot?.deliveryTerm ?? '',
    quantity: snapshot?.quantity ?? '',
    requestedDeliveryDate: snapshot?.requestedDeliveryDate ?? '',
    unitPrice: snapshot?.unitPrice ?? ''
  }
}

/** mapCustomerItemSnapshot flattens one generated customer item snapshot into the tenant-web manual line customer-facing shape. */
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

/** mapLineInputs converts one array of manual tenant-web line snapshots into the downstream generated sales request shape. */
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

/** fromGrpcQuoteStatus converts one generated sales quote status enum into the stable BFF string value. */
function fromGrpcQuoteStatus(status?: QuoteStatus): string {
  return status === QuoteStatus.QUOTE_STATUS_PUBLISHED ? 'PUBLISHED' : 'DRAFT'
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
