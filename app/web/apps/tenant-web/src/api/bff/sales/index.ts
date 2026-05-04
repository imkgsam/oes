import { requestClient } from '#/api/request'

export namespace SalesApi {
  export type CustomerPriceAgreementStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED'
  export type FulfillmentHandoffStatus = 'NOT_SUBMITTED' | 'SUBMITTED'
  export type PriceListStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'
  export type PriceListType = 'STANDARD' | 'ACTIVITY' | 'EXHIBITION'
  export type PricingExceptionStatus = 'NOT_REQUIRED' | 'REQUIRED'
  export type PricingExceptionType = 'LOW_PRICE' | 'LOW_MOQ'
  export type PricingSourceType = 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST' | 'MANUAL'
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

  export interface PriceSnapshot {
    currencyCode: string
    resolvedAt?: string
    sourceLineRefId?: string
    sourceRefId?: string
    sourceType: PricingSourceType | string
    sourceVersionNo?: number
    unitPriceAmount: string
  }

  export interface MoqSnapshot {
    moqQuantity: string
    quantityUomCode: string
    resolvedAt?: string
    sourceLineRefId?: string
    sourceRefId?: string
    sourceType: PricingSourceType | string
    sourceVersionNo?: number
  }

  export interface ExchangeRateSnapshot {
    effectiveAt?: string
    exchangeRateValue: string
    financeRateRef?: string
    fromCurrencyCode: string
    snapshottedAt?: string
    toCurrencyCode: string
  }

  export interface ExceptionPlaceholder {
    actualValue: string
    baselineSourceType: PricingSourceType | string
    baselineValue: string
    currencyCode: string
    detectedAt?: string
    exceptionType: PricingExceptionType | string
    quantityUomCode: string
    status: PricingExceptionStatus | string
  }

  export interface PriceQuantityDeliverySnapshot {
    currencyCode: string
    deliveryTerm: string
    exceptionPlaceholders?: ExceptionPlaceholder[]
    exchangeRateSnapshot?: ExchangeRateSnapshot
    moqSnapshot?: MoqSnapshot
    priceSnapshot?: PriceSnapshot
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

  export interface PriceList {
    currencyCode: string
    effectiveFrom: string
    effectiveTo: string
    priceListId: string
    priceListName: string
    priceListType: PriceListType | string
    status: PriceListStatus | string
    tenantId: string
  }

  export interface PriceListLine {
    brandKey: string
    itemId: string
    lineNo: number
    moqSnapshot: MoqSnapshot
    priceListLineId: string
    priceSnapshot: PriceSnapshot
  }

  export interface CustomerPriceAgreementLine {
    brandKey: string
    customerPriceAgreementLineId: string
    itemId: string
    lineNo: number
    moqSnapshot: MoqSnapshot
    priceSnapshot: PriceSnapshot
  }

  export interface CustomerPriceAgreement {
    currencyCode: string
    customerPriceAgreementId: string
    customerTenantPartyId: string
    lines: CustomerPriceAgreementLine[]
    publishedAt: string
    status: CustomerPriceAgreementStatus | string
    tenantId: string
    versionNo: number
  }

  export interface CustomerPriceAgreementVersionSummary {
    customerPriceAgreementId: string
    lineCount: number
    publishedAt: string
    status: CustomerPriceAgreementStatus | string
    versionNo: number
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

  export interface PriceListListQuery {
    currencyCode?: string
    effectiveAt?: string
    keyword?: string
    page?: number
    pageSize?: number
    priceListType?: PriceListType | string
    status?: PriceListStatus | string
  }

  export interface PriceListListResult {
    page: number
    pageSize: number
    priceLists: PriceList[]
    total: number
  }

  export interface PriceListLinesQuery {
    itemId?: string
    page?: number
    pageSize?: number
  }

  export interface PriceListLinesResult {
    page: number
    pageSize: number
    priceListLines: PriceListLine[]
    total: number
  }

  export interface CustomerPriceAgreementVersionsQuery {
    page?: number
    pageSize?: number
  }

  export interface CustomerPriceAgreementVersionsResult {
    page: number
    pageSize: number
    total: number
    versions: CustomerPriceAgreementVersionSummary[]
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

  export interface PriceListLineInput {
    brandKey?: string
    itemId: string
    moqQuantity: string
    quantityUomCode: string
    unitPriceAmount: string
  }

  export interface CreatePriceListPayload {
    currencyCode: string
    effectiveFrom: string
    effectiveTo?: string
    initialLines?: PriceListLineInput[]
    priceListName: string
    priceListType: PriceListType | string
  }

  export interface UpdatePriceListPayload {
    effectiveFrom?: string
    effectiveTo?: string
    priceListName?: string
  }

  export interface ReplacePriceListLinesPayload {
    lines: PriceListLineInput[]
  }

  export interface ChangePriceListStatusPayload {
    targetStatus: PriceListStatus | string
  }

  export interface GetActiveCustomerPriceAgreementQuery {
    currencyCode: string
    customerTenantPartyId: string
  }

  export interface GetCustomerPriceAgreementQuery {
    versionNo?: number
  }

  export interface CreateCustomerPriceAgreementPayload {
    currencyCode: string
    customerTenantPartyId: string
    initialLines?: PriceListLineInput[]
  }

  export interface CustomerPriceAgreementLineRemoval {
    brandKey?: string
    itemId: string
  }

  export interface UpdateCustomerPriceAgreementDraftPayload {
    draftMutation: {
      removals: CustomerPriceAgreementLineRemoval[]
      upserts: PriceListLineInput[]
    }
  }

  export interface PreviewQuoteLinePricingPayload {
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

// Lists tenant-scoped price lists for the sales pricing workspace.
export async function listPriceListsApi(
  tenantId: string,
  params: SalesApi.PriceListListQuery
) {
  return requestClient.get<SalesApi.PriceListListResult>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/price-lists`,
    {
      params
    }
  )
}

// Loads one selected price-list header.
export async function getPriceListApi(tenantId: string, priceListId: string) {
  return requestClient.get<SalesApi.PriceList>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/price-lists/${encodeURIComponent(priceListId)}`
  )
}

// Loads one selected price-list line page.
export async function getPriceListLinesApi(
  tenantId: string,
  priceListId: string,
  params: SalesApi.PriceListLinesQuery
) {
  return requestClient.get<SalesApi.PriceListLinesResult>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/price-lists/${encodeURIComponent(priceListId)}/lines`,
    {
      params
    }
  )
}

// Creates one price list for the sales pricing workspace.
export async function createPriceListApi(
  tenantId: string,
  data: SalesApi.CreatePriceListPayload
) {
  return requestClient.post<SalesApi.PriceList>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/price-lists`,
    data
  )
}

// Updates one selected price-list header.
export async function updatePriceListApi(
  tenantId: string,
  priceListId: string,
  data: SalesApi.UpdatePriceListPayload
) {
  return requestClient.put<SalesApi.PriceList>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/price-lists/${encodeURIComponent(priceListId)}`,
    data
  )
}

// Replaces the full line set of one selected price list.
export async function replacePriceListLinesApi(
  tenantId: string,
  priceListId: string,
  data: SalesApi.ReplacePriceListLinesPayload
) {
  return requestClient.put<{
    priceList: SalesApi.PriceList
    priceListLines: SalesApi.PriceListLine[]
  }>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/price-lists/${encodeURIComponent(priceListId)}/lines`,
    data
  )
}

// Changes the lifecycle status of one selected price list.
export async function changePriceListStatusApi(
  tenantId: string,
  priceListId: string,
  data: SalesApi.ChangePriceListStatusPayload
) {
  return requestClient.post<SalesApi.PriceList>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/price-lists/${encodeURIComponent(priceListId)}/status`,
    data
  )
}

// Loads the active customer price agreement for one customer and currency.
export async function getActiveCustomerPriceAgreementApi(
  tenantId: string,
  params: SalesApi.GetActiveCustomerPriceAgreementQuery
) {
  return requestClient.get<SalesApi.CustomerPriceAgreement>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/customer-price-agreements/active`,
    {
      params
    }
  )
}

// Loads one customer price agreement head or explicit version.
export async function getCustomerPriceAgreementApi(
  tenantId: string,
  customerPriceAgreementId: string,
  params: SalesApi.GetCustomerPriceAgreementQuery
) {
  return requestClient.get<SalesApi.CustomerPriceAgreement>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/customer-price-agreements/${encodeURIComponent(customerPriceAgreementId)}`,
    {
      params
    }
  )
}

// Lists the version directory for one customer price agreement family.
export async function listCustomerPriceAgreementVersionsApi(
  tenantId: string,
  customerPriceAgreementId: string,
  params: SalesApi.CustomerPriceAgreementVersionsQuery
) {
  return requestClient.get<SalesApi.CustomerPriceAgreementVersionsResult>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/customer-price-agreements/${encodeURIComponent(customerPriceAgreementId)}/versions`,
    {
      params
    }
  )
}

// Creates one customer price agreement draft family.
export async function createCustomerPriceAgreementApi(
  tenantId: string,
  data: SalesApi.CreateCustomerPriceAgreementPayload
) {
  return requestClient.post<SalesApi.CustomerPriceAgreement>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/customer-price-agreements`,
    data
  )
}

// Updates one customer price agreement current draft version.
export async function updateCustomerPriceAgreementDraftApi(
  tenantId: string,
  customerPriceAgreementId: string,
  data: SalesApi.UpdateCustomerPriceAgreementDraftPayload
) {
  return requestClient.put<SalesApi.CustomerPriceAgreement>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/customer-price-agreements/${encodeURIComponent(customerPriceAgreementId)}/draft`,
    data
  )
}

// Publishes one customer price agreement current draft version.
export async function publishCustomerPriceAgreementVersionApi(
  tenantId: string,
  customerPriceAgreementId: string,
  data: SalesApi.AuditReasonPayload
) {
  return requestClient.post<SalesApi.CustomerPriceAgreement>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/customer-price-agreements/${encodeURIComponent(customerPriceAgreementId)}/publish`,
    data
  )
}

// Creates or updates one customer price agreement draft from one frozen sales order line.
export async function createCustomerPriceAgreementFromSalesOrderLineApi(
  tenantId: string,
  salesOrderLineId: string,
  data: SalesApi.AuditReasonPayload
) {
  return requestClient.post<SalesApi.CustomerPriceAgreement>(
    `/sales/tenants/${encodeURIComponent(tenantId)}/pricing/customer-price-agreements/from-sales-order-lines/${encodeURIComponent(salesOrderLineId)}`,
    data
  )
}

// Requests one non-mutating quote-line pricing preview.
export async function previewQuoteLinePricingApi(
  tenantId: string,
  data: SalesApi.PreviewQuoteLinePricingPayload
) {
  return requestClient.post<{
    exceptionPlaceholders: SalesApi.ExceptionPlaceholder[]
    exchangeRateSnapshot?: SalesApi.ExchangeRateSnapshot
    moqSnapshot?: SalesApi.MoqSnapshot
    priceSnapshot?: SalesApi.PriceSnapshot
  }>(`/sales/tenants/${encodeURIComponent(tenantId)}/pricing/quote-line-preview`, data)
}
