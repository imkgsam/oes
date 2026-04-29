import {
  ExceptionPlaceholder,
  ExchangeRateSnapshot,
  MoqSnapshot,
  PriceSnapshot
} from './pricing-records'

export enum SalesQuoteStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED'
}

export enum SalesFulfillmentHandoffStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED'
}

export type SalesCommercialGateName = 'production_gate' | 'stocking_gate' | 'shipping_gate'

export interface SalesOperatorContext {
  operatorId: string
  operatorType: string
  orgId?: string | null
}

export interface SalesTraceContext {
  traceId: string
  requestId: string
}

export interface SalesAuditContext {
  auditId: string
  reason: string
  source: string
}

export interface OpportunityRefSummary {
  opportunityId: string
  opportunityNo: string
  opportunityName: string
}

export interface ItemSnapshot {
  itemCode: string
  itemName: string
}

export interface SalesConfigSnapshot {
  salesUom: string
  salesUnitLabel: string
  notes: string
}

export interface PackagingRequirementSnapshot {
  packageMode: string
  packageLabel: string
  specialInstructions: string
}

export interface PriceQuantityDeliverySnapshot {
  currencyCode: string
  unitPrice: string
  quantity: string
  deliveryTerm: string
  requestedDeliveryDate: string
  priceSnapshot?: PriceSnapshot | null
  moqSnapshot?: MoqSnapshot | null
  exchangeRateSnapshot?: ExchangeRateSnapshot | null
  exceptionPlaceholders?: ExceptionPlaceholder[]
}

export interface CustomerItemSnapshot {
  customerSku: string
  customerModel: string
  customerDisplayName: string
}

export interface QuoteLineInput {
  lineNo: number
  itemId: string
  itemSnapshot: ItemSnapshot
  salesConfigSnapshot: SalesConfigSnapshot
  packagingRequirementSnapshot: PackagingRequirementSnapshot
  priceQuantityDeliverySnapshot: PriceQuantityDeliverySnapshot
  customerItemSnapshot: CustomerItemSnapshot
}

export interface QuoteLineRecord extends QuoteLineInput {
  quoteLineId: string
}

export interface QuoteDraftMutation {
  customerTenantPartyId: string
  opportunityRef?: OpportunityRefSummary | null
  lines: QuoteLineInput[]
}

export interface QuoteRecord {
  id: string
  quoteNo: string
  tenantId: string
  customerTenantPartyId: string
  opportunityRef?: OpportunityRefSummary | null
  status: SalesQuoteStatus
  latestPublishedVersionId?: string | null
  lines: QuoteLineRecord[]
}

export interface QuoteVersionRecord {
  id: string
  quoteId: string
  quoteNo: string
  versionNo: number
  tenantId: string
  customerTenantPartyId: string
  publishedAt: string
  lines: QuoteLineRecord[]
}

export interface CommercialGateSummary {
  orderEstablished: boolean
  productionGate: boolean
  stockingGate: boolean
  shippingGate: boolean
}

export interface FulfillmentHandoffSummary {
  status: SalesFulfillmentHandoffStatus
  submittedAt?: string | null
}

export interface SalesOrderLineRecord extends QuoteLineInput {
  salesOrderLineId: string
}

export interface SalesOrderRecord {
  id: string
  salesOrderNo: string
  tenantId: string
  customerTenantPartyId: string
  quoteId: string
  quoteVersionId: string
  commercialGateSummary: CommercialGateSummary
  fulfillmentHandoffStatus: FulfillmentHandoffSummary
  lines: SalesOrderLineRecord[]
}

export interface PageResult<TItem> {
  items: TItem[]
  total: number
  page: number
  pageSize: number
}

export interface QuoteSearchInput {
  tenantId: string
  keyword?: string
  customerTenantPartyId?: string
  status?: SalesQuoteStatus
  page?: number
  pageSize?: number
}

export interface QuoteVersionListInput {
  tenantId: string
  quoteId: string
  page?: number
  pageSize?: number
}

export interface SalesOrderSearchInput {
  tenantId: string
  keyword?: string
  customerTenantPartyId?: string
  quoteVersionId?: string
  productionGate?: boolean
  stockingGate?: boolean
  shippingGate?: boolean
  page?: number
  pageSize?: number
}

/** cloneRecord deep-clones plain sales records so repositories do not leak mutable state between calls. */
export function cloneRecord<T>(value: T): T {
  return structuredClone(value)
}

/** buildInitialCommercialGateSummary creates the frozen phase 1 order-established baseline. */
export function buildInitialCommercialGateSummary(orderEstablished: boolean): CommercialGateSummary {
  return {
    orderEstablished,
    productionGate: false,
    stockingGate: false,
    shippingGate: false
  }
}

/** buildInitialHandoffSummary creates the phase 1 sales-side handoff summary before submission. */
export function buildInitialHandoffSummary(): FulfillmentHandoffSummary {
  return {
    status: SalesFulfillmentHandoffStatus.NOT_SUBMITTED
  }
}
