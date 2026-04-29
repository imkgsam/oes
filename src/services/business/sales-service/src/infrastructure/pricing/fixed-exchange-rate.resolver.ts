import { Injectable } from '@nestjs/common'
import {
  ResolveSalesExchangeRateInput,
  SalesExchangeRateResolver
} from '../../application/ports/sales-exchange-rate-resolver.port'
import { ExchangeRateSnapshot } from '../../domain/models/pricing-records'

export interface FixedExchangeRateDefinition {
  tenantId: string
  fromCurrencyCode: string
  toCurrencyCode: string
  exchangeRateValue: string
  financeRateRef?: string | null
  effectiveAt: string
}

/** FixedExchangeRateResolver provides same-currency identity snapshots plus optional seeded FX pairs for phase 1 pricing tests and runtime defaults. */
@Injectable()
export class FixedExchangeRateResolver implements SalesExchangeRateResolver {
  constructor(private readonly definitions: FixedExchangeRateDefinition[] = []) {}

  async resolve(input: ResolveSalesExchangeRateInput): Promise<ExchangeRateSnapshot> {
    if (input.fromCurrencyCode === input.toCurrencyCode) {
      return {
        fromCurrencyCode: input.fromCurrencyCode,
        toCurrencyCode: input.toCurrencyCode,
        exchangeRateValue: '1',
        financeRateRef: null,
        effectiveAt: input.pricingAt,
        snapshottedAt: input.pricingAt
      }
    }

    const found = this.definitions.find(
      (item) =>
        item.tenantId === input.tenantId &&
        item.fromCurrencyCode === input.fromCurrencyCode &&
        item.toCurrencyCode === input.toCurrencyCode
    )

    if (!found) {
      throw new Error(
        `No exchange rate snapshot seed exists for ${input.tenantId}:${input.fromCurrencyCode}->${input.toCurrencyCode}`
      )
    }

    return {
      fromCurrencyCode: input.fromCurrencyCode,
      toCurrencyCode: input.toCurrencyCode,
      exchangeRateValue: found.exchangeRateValue,
      financeRateRef: found.financeRateRef ?? null,
      effectiveAt: found.effectiveAt,
      snapshottedAt: input.pricingAt
    }
  }
}
