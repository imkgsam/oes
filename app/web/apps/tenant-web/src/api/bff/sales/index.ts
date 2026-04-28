import { requestClient } from '#/api/request'

export namespace SalesApi {
  export type FulfillmentHandoffStatus = 'NOT_SUBMITTED' | 'SUBMITTED'
  export type QuoteStatus = 'DRAFT' | 'PUBLISHED'

  export interface OpportunityRefSummary {
    opportunityId: string
    opportunityName: string
    opportunityNo: string
  }

  export interface ItemSnapshot {
    itemCode: string
    itemName: string
  }

  export interface SalesConfigSnapshot {
    notes: string
    salesUnitLabel: string
    salesUom: string
  }

  export interface PackagingRequirementSnapshot {
    packageLabel: string
    packageMode: string
    specialInstructions: string
  }

  export interface PriceQuantityDeliverySnapshot {
    currencyCode: string
    deliveryTerm: string
    quantity: string
    requestedDeliveryDate: string
    unitPrice: string
  }

  export interface CustomerItemSnapshot {
    customerDisplayName: string
    customerModel: string
    customerSku: string
  }

  export interface QuoteLineInput {
    customerItemSnapshot: CustomerItemSnapshot
    itemId: string
    itemSnapshot: ItemSnapshot
    lineNo: number
    packagingRequirementSnapshot: PackagingRequirementSnapshot
    priceQuantityDeliverySnapshot: PriceQuantityDeliverySnapshot
    salesConfigSnapshot: SalesConfigSnapshot
  }

  export interface QuoteLine extends QuoteLineInput {
    quoteLineId: string
  }

  export interface Quote {
    customerTenantPartyId: string
    latestPublishedVersionId: string
    lines: QuoteLine[]
    opportunityRef?: OpportunityRefSummary
    quoteId: string
    quoteNo: string
    status: QuoteStatus | string
    tenantId: string
  }

  export interface QuoteVersion {
    customerTenantPartyId: string
    lines: QuoteLine[]
    publishedAt: string
    quoteId: string
    quoteNo: string
    quoteVersionId: string
    tenantId: string
    versionNo: number
  }

  export interface CommercialGateSummary {
    orderEstablished: boolean
    productionGate: boolean
    shippingGate: boolean
    stockingGate: boolean
  }

  export interface FulfillmentHandoffSummary {
    status: FulfillmentHandoffStatus | string
    submittedAt: string
  }

  export interface SalesOrderLine {
    customerItemSnapshot: CustomerItemSnapshot
    itemId: string
    itemSnapshot: ItemSnapshot
    lineNo: number
    packagingRequirementSnapshot: PackagingRequirementSnapshot
    priceQuantityDeliverySnapshot: PriceQuantityDeliverySnapshot
    salesConfigSnapshot: SalesConfigSnapshot
    salesOrderLineId: string
  }

  export interface SalesOrder {
    commercialGateSummary: CommercialGateSummary
    customerTenantPartyId: string
    fulfillmentHandoffStatus: FulfillmentHandoffSummary
    lines: SalesOrderLine[]
    quoteId: string
    quoteVersionId: string
    salesOrderId: string
    salesOrderNo: string
    tenantId: string
  }

  export interface QuoteListQuery {
    customerTenantPartyId?: string
    keyword?: string
    page?: number
    pageSize?: number
    status?: QuoteStatus
  }

  export interface QuoteListResult {
    page: number
    pageSize: number
    quotes: Quote[]
    total: number
  }

  export interface QuoteVersionListQuery {
    page?: number
    pageSize?: number
  }

  export interface QuoteVersionListResult {
    page: number
    pageSize: number
    quoteVersions: QuoteVersion[]
    total: number
  }

  export interface SalesOrderListQuery {
    customerTenantPartyId?: string
    keyword?: string
    page?: number
    pageSize?: number
    productionGate?: boolean
    quoteVersionId?: string
    shippingGate?: boolean
    stockingGate?: boolean
  }

  export interface SalesOrderListResult {
    page: number
    pageSize: number
    salesOrders: SalesOrder[]
    total: number
  }

  export interface CreateQuotePayload {
    customerTenantPartyId: string
    draftLines?: QuoteLineInput[]
    opportunityRef?: OpportunityRefSummary
  }

  export interface UpdateQuoteDraftPayload {
    draftMutation: {
      customerTenantPartyId: string
      lines: QuoteLineInput[]
      opportunityRef?: OpportunityRefSummary
    }
  }

  export interface AuditReasonPayload {
    auditReason?: string
  }
}

// Lists tenant-scoped quote carriers for the minimum sales workspace.
export async function listQuotesApi(tenantId: string, params: SalesApi.QuoteListQuery) {
  return requestClient.get<SalesApi.QuoteListResult>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quotes`,
    {
      params
    }
  )
}

// Loads one current quote draft carrier.
export async function getQuoteByIdApi(tenantId: string, quoteId: string) {
  return requestClient.get<SalesApi.Quote>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quotes/${encodeURIComponent(quoteId)}`
  )
}

// Creates one quote draft carrier for manual phase 1 testing.
export async function createQuoteApi(tenantId: string, data: SalesApi.CreateQuotePayload) {
  return requestClient.post<SalesApi.Quote>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quotes`,
    data
  )
}

// Replaces one current quote draft snapshot without creating a published version.
export async function updateQuoteDraftApi(
  tenantId: string,
  quoteId: string,
  data: SalesApi.UpdateQuoteDraftPayload
) {
  return requestClient.put<SalesApi.Quote>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quotes/${encodeURIComponent(quoteId)}/draft`,
    data
  )
}

// Publishes one current quote draft into a formal quote version.
export async function publishQuoteApi(
  tenantId: string,
  quoteId: string,
  data: SalesApi.AuditReasonPayload
) {
  return requestClient.post<{
    quote: SalesApi.Quote
    quoteVersion: SalesApi.QuoteVersion
  }>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quotes/${encodeURIComponent(quoteId)}/publish`,
    data
  )
}

// Lists one quote's published version history.
export async function listQuoteVersionsApi(
  tenantId: string,
  quoteId: string,
  params: SalesApi.QuoteVersionListQuery
) {
  return requestClient.get<SalesApi.QuoteVersionListResult>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quotes/${encodeURIComponent(quoteId)}/versions`,
    {
      params
    }
  )
}

// Loads one published quote version detail.
export async function getQuoteVersionByIdApi(tenantId: string, quoteVersionId: string) {
  return requestClient.get<SalesApi.QuoteVersion>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quote-versions/${encodeURIComponent(quoteVersionId)}`
  )
}

// Converts one published quote version into an established sales order.
export async function convertQuoteVersionToOrderApi(
  tenantId: string,
  quoteVersionId: string,
  data: SalesApi.AuditReasonPayload
) {
  return requestClient.post<SalesApi.SalesOrder>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/quote-versions/${encodeURIComponent(quoteVersionId)}/convert-to-order`,
    data
  )
}

// Lists tenant-scoped established sales orders for the minimum sales workspace.
export async function listSalesOrdersApi(
  tenantId: string,
  params: SalesApi.SalesOrderListQuery
) {
  return requestClient.get<SalesApi.SalesOrderListResult>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/orders`,
    {
      params
    }
  )
}

// Loads one established sales order detail.
export async function getSalesOrderByIdApi(tenantId: string, salesOrderId: string) {
  return requestClient.get<SalesApi.SalesOrder>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/orders/${encodeURIComponent(salesOrderId)}`
  )
}

// Submits one sales-side fulfillment handoff for an established order.
export async function submitFulfillmentHandoffApi(
  tenantId: string,
  salesOrderId: string,
  data: SalesApi.AuditReasonPayload
) {
  return requestClient.post<SalesApi.SalesOrder>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/orders/${encodeURIComponent(salesOrderId)}/submit-fulfillment-handoff`,
    data
  )
}
