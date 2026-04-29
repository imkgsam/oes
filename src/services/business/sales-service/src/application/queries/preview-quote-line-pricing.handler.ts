import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_FAILED_PRECONDITION } from '../../common/errors/sales.errors'
import { PreviewQuoteLinePricingResult } from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import { SalesExchangeRateResolver } from '../ports/sales-exchange-rate-resolver.port'
import {
  assertMoqResolvable,
  buildLowMoqPlaceholder,
  buildLowPricePlaceholder,
  compareDecimalString,
  normalizeDecimalString,
  nowIso,
  selectBestPricingLine
} from '../support/pricing-support'
import { PreviewQuoteLinePricingQuery } from './preview-quote-line-pricing.query'

/** PreviewQuoteLinePricingHandler resolves the frozen phase 1 sales pricing snapshot without mutating quote state. */
@Injectable()
@QueryHandler(PreviewQuoteLinePricingQuery)
export class PreviewQuoteLinePricingHandler
  implements IQueryHandler<PreviewQuoteLinePricingQuery, PreviewQuoteLinePricingResult>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly agreementRepository: CustomerPriceAgreementRepository,
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly priceListRepository: PriceListRepository,
    @Inject(TOKENS.SALES_EXCHANGE_RATE_RESOLVER)
    private readonly exchangeRateResolver: SalesExchangeRateResolver
  ) {}

  async execute(query: PreviewQuoteLinePricingQuery): Promise<PreviewQuoteLinePricingResult> {
    const pricingAt = nowIso(query.input.pricingAt)
    const agreement = await this.agreementRepository.findActiveByCustomerCurrency({
      tenantId: query.input.tenantId,
      customerTenantPartyId: query.input.customerTenantPartyId,
      currencyCode: query.input.currencyCode
    })
    const agreementLine = agreement
      ? selectBestPricingLine({
          lines: agreement.lines,
          itemId: query.input.itemId,
          brandKey: query.input.brandKey,
          requestedQuantity: query.input.requestedQuantity,
          quantityUomCode: query.input.quantityUomCode
        })
      : null

    const selectedPriceList = query.input.selectedPriceListId
      ? await this.priceListRepository.findById(query.input.tenantId, query.input.selectedPriceListId)
      : null
    const priceListLine = selectedPriceList
      ? selectBestPricingLine({
          lines: selectedPriceList.lines,
          itemId: query.input.itemId,
          brandKey: query.input.brandKey,
          requestedQuantity: query.input.requestedQuantity,
          quantityUomCode: query.input.quantityUomCode
        })
      : null

    const baseline = agreementLine ?? priceListLine
    const resolvedBaseline = assertMoqResolvable(baseline, {
      itemId: query.input.itemId,
      reason: 'pricing preview requires an agreement or selected price list MOQ baseline'
    })

    const priceSnapshot = query.input.manualUnitPriceAmount
      ? {
          currencyCode: query.input.currencyCode,
          unitPriceAmount: normalizeDecimalString(query.input.manualUnitPriceAmount),
          sourceType: 'MANUAL' as const,
          sourceRefId: '',
          sourceLineRefId: '',
          sourceVersionNo: 0,
          resolvedAt: pricingAt
        }
      : {
          ...resolvedBaseline.priceSnapshot,
          resolvedAt: pricingAt
        }
    const moqSnapshot = {
      ...resolvedBaseline.moqSnapshot,
      resolvedAt: pricingAt
    }

    const exchangeRateSnapshot = await this.exchangeRateResolver.resolve({
      tenantId: query.input.tenantId,
      fromCurrencyCode: query.input.currencyCode,
      toCurrencyCode: query.input.exchangeRateTargetCurrencyCode ?? query.input.currencyCode,
      pricingAt
    })

    const exceptionPlaceholders = []
    if (
      query.input.manualUnitPriceAmount &&
      compareDecimalString(query.input.manualUnitPriceAmount, resolvedBaseline.priceSnapshot.unitPriceAmount) < 0
    ) {
      if (
        resolvedBaseline.priceSnapshot.sourceType !== 'CUSTOMER_PRICE_AGREEMENT' &&
        resolvedBaseline.priceSnapshot.sourceType !== 'PRICE_LIST'
      ) {
        throw ExceptionFactory.application(SALES_FAILED_PRECONDITION, {
          reason: 'manual price requires a stable agreement or price list baseline'
        })
      }

      exceptionPlaceholders.push(
        buildLowPricePlaceholder({
          baselineSourceType: resolvedBaseline.priceSnapshot.sourceType,
          baselineValue: resolvedBaseline.priceSnapshot.unitPriceAmount,
          actualValue: query.input.manualUnitPriceAmount,
          currencyCode: query.input.currencyCode,
          detectedAt: pricingAt
        })
      )
    }

    if (compareDecimalString(query.input.requestedQuantity, moqSnapshot.moqQuantity) < 0) {
      exceptionPlaceholders.push(
        buildLowMoqPlaceholder({
          baselineSourceType: moqSnapshot.sourceType,
          baselineValue: moqSnapshot.moqQuantity,
          actualValue: query.input.requestedQuantity,
          quantityUomCode: moqSnapshot.quantityUomCode,
          detectedAt: pricingAt
        })
      )
    }

    return {
      priceSnapshot,
      moqSnapshot,
      exchangeRateSnapshot,
      exceptionPlaceholders
    }
  }
}
