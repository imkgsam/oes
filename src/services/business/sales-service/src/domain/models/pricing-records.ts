export type SalesCurrencyCode = 'USD' | 'CNY'

export type PriceListType = 'STANDARD' | 'ACTIVITY' | 'EXHIBITION'

export type PriceListStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export type PricingSourceType = 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST' | 'MANUAL'

export type MoqSourceType = 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST'

export type CustomerPriceAgreementStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED'

export type PricingExceptionType = 'LOW_PRICE' | 'LOW_MOQ'

export type PricingExceptionStatus = 'NOT_REQUIRED' | 'REQUIRED'

export interface PriceSnapshot {
  currencyCode: SalesCurrencyCode
  unitPriceAmount: string
  sourceType: PricingSourceType
  sourceRefId: string
  sourceLineRefId: string
  sourceVersionNo: number
  resolvedAt: string
}

export interface MoqSnapshot {
  moqQuantity: string
  quantityUomCode: string
  sourceType: MoqSourceType
  sourceRefId: string
  sourceLineRefId: string
  sourceVersionNo: number
  resolvedAt: string
}

export interface ExchangeRateSnapshot {
  fromCurrencyCode: SalesCurrencyCode
  toCurrencyCode: SalesCurrencyCode
  exchangeRateValue: string
  financeRateRef?: string | null
  effectiveAt: string
  snapshottedAt: string
}

export interface ExceptionPlaceholder {
  exceptionType: PricingExceptionType
  status: PricingExceptionStatus
  baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST'
  baselineValue: string
  actualValue: string
  currencyCode?: string | null
  quantityUomCode?: string | null
  detectedAt: string
}

export interface PriceListLineDraftInput {
  itemId: string
  brandKey?: string | null
  unitPriceAmount: string
  moqQuantity: string
  quantityUomCode: string
}

export interface PriceListLineRecord {
  priceListLineId: string
  lineNo: number
  itemId: string
  brandKey?: string | null
  priceSnapshot: PriceSnapshot
  moqSnapshot: MoqSnapshot
}

export interface PriceListRecord {
  id: string
  tenantId: string
  priceListName: string
  priceListType: PriceListType
  status: PriceListStatus
  currencyCode: SalesCurrencyCode
  effectiveFrom: string
  effectiveTo?: string | null
  lines: PriceListLineRecord[]
}

export interface PriceListSearchInput {
  tenantId: string
  keyword?: string
  priceListType?: PriceListType
  status?: PriceListStatus
  currencyCode?: SalesCurrencyCode
  effectiveAt?: string
  page?: number
  pageSize?: number
}

export interface PriceListLineListInput {
  tenantId: string
  priceListId: string
  itemId?: string
  page?: number
  pageSize?: number
}

export interface CustomerPriceAgreementLineDraftInput extends PriceListLineDraftInput {}

export interface CustomerPriceAgreementDraftMutation {
  upserts: CustomerPriceAgreementLineDraftInput[]
  removals: Array<{
    itemId: string
    brandKey?: string | null
  }>
}

export interface CustomerPriceAgreementLineRecord {
  customerPriceAgreementLineId: string
  lineNo: number
  itemId: string
  brandKey?: string | null
  priceSnapshot: PriceSnapshot
  moqSnapshot: MoqSnapshot
}

export interface CustomerPriceAgreementVersionRecord {
  id: string
  customerPriceAgreementId: string
  tenantId: string
  customerTenantPartyId: string
  currencyCode: SalesCurrencyCode
  versionNo: number
  status: CustomerPriceAgreementStatus
  publishedAt?: string | null
  lines: CustomerPriceAgreementLineRecord[]
}

export interface CustomerPriceAgreementVersionListInput {
  tenantId: string
  customerPriceAgreementId: string
  page?: number
  pageSize?: number
}

export interface PreviewQuoteLinePricingInput {
  tenantId: string
  customerTenantPartyId: string
  itemId: string
  brandKey?: string | null
  currencyCode: SalesCurrencyCode
  requestedQuantity: string
  quantityUomCode: string
  selectedPriceListId?: string | null
  manualUnitPriceAmount?: string | null
  pricingAt?: string | null
  exchangeRateTargetCurrencyCode?: SalesCurrencyCode | null
}

export interface PreviewQuoteLinePricingResult {
  priceSnapshot: PriceSnapshot
  moqSnapshot: MoqSnapshot
  exchangeRateSnapshot: ExchangeRateSnapshot
  exceptionPlaceholders: ExceptionPlaceholder[]
}
