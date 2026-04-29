import { ExchangeRateSnapshot, SalesCurrencyCode } from '../../domain/models/pricing-records'

export interface ResolveSalesExchangeRateInput {
  tenantId: string
  fromCurrencyCode: SalesCurrencyCode
  toCurrencyCode: SalesCurrencyCode
  pricingAt: string
}

/** SalesExchangeRateResolver resolves finance-owned FX truth into a frozen sales-side snapshot. */
export interface SalesExchangeRateResolver {
  resolve(input: ResolveSalesExchangeRateInput): Promise<ExchangeRateSnapshot>
}
