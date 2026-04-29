import { randomUUID } from 'node:crypto'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  SALES_FAILED_PRECONDITION,
  SALES_INVALID_ARGUMENT
} from '../../common/errors/sales.errors'
import {
  CustomerPriceAgreementLineDraftInput,
  CustomerPriceAgreementLineRecord,
  ExceptionPlaceholder,
  MoqSnapshot,
  PriceListLineDraftInput,
  PriceListLineRecord,
  PriceSnapshot,
  SalesCurrencyCode
} from '../../domain/models/pricing-records'
import { assertRequiredString } from './sales-assertions'

/** assertSupportedCurrency keeps phase 1 pricing limited to the frozen USD/CNY currency set. */
export function assertSupportedCurrency(value: string, field: string): SalesCurrencyCode {
  assertRequiredString(value, field)
  if (value !== 'USD' && value !== 'CNY') {
    throw ExceptionFactory.application(SALES_INVALID_ARGUMENT, {
      field,
      value
    })
  }

  return value
}

/** assertDecimalString rejects blank or non-numeric decimal payloads before pricing logic runs. */
export function assertDecimalString(value: string, field: string): void {
  assertRequiredString(value, field)
  if (!/^-?\d+(\.\d+)?$/.test(value.trim())) {
    throw ExceptionFactory.application(SALES_INVALID_ARGUMENT, {
      field,
      value
    })
  }
}

/** assertNonNegativeDecimalString keeps price and MOQ operands within the phase 1 numeric contract. */
export function assertNonNegativeDecimalString(value: string, field: string): void {
  assertDecimalString(value, field)
  if (toNumber(value) < 0) {
    throw ExceptionFactory.application(SALES_INVALID_ARGUMENT, {
      field,
      value
    })
  }
}

/** nowIso normalizes optional business timestamps into one concrete ISO string for frozen snapshots. */
export function nowIso(value?: string | null): string {
  return value ? new Date(value).toISOString() : new Date().toISOString()
}

/** compareDecimalString compares two numeric strings using Number because phase 1 pricing only needs small-scale decimal ordering. */
export function compareDecimalString(left: string, right: string): number {
  return toNumber(left) - toNumber(right)
}

/** buildPriceListLineRecords materializes one price list replace payload into frozen baseline line records. */
export function buildPriceListLineRecords(input: {
  priceListId: string
  currencyCode: SalesCurrencyCode
  lines: PriceListLineDraftInput[]
  resolvedAt?: string | null
}): PriceListLineRecord[] {
  const resolvedAt = nowIso(input.resolvedAt)
  return input.lines.map((line, index) => {
    assertRequiredString(line.itemId, `lines[${index}].itemId`)
    assertNonNegativeDecimalString(line.unitPriceAmount, `lines[${index}].unitPriceAmount`)
    assertNonNegativeDecimalString(line.moqQuantity, `lines[${index}].moqQuantity`)
    assertRequiredString(line.quantityUomCode, `lines[${index}].quantityUomCode`)

    const priceListLineId = randomUUID()
    return {
      priceListLineId,
      lineNo: index + 1,
      itemId: line.itemId,
      brandKey: normalizeBrandKey(line.brandKey),
      priceSnapshot: {
        currencyCode: input.currencyCode,
        unitPriceAmount: normalizeDecimalString(line.unitPriceAmount),
        sourceType: 'PRICE_LIST',
        sourceRefId: input.priceListId,
        sourceLineRefId: priceListLineId,
        sourceVersionNo: 0,
        resolvedAt
      },
      moqSnapshot: {
        moqQuantity: normalizeDecimalString(line.moqQuantity),
        quantityUomCode: line.quantityUomCode,
        sourceType: 'PRICE_LIST',
        sourceRefId: input.priceListId,
        sourceLineRefId: priceListLineId,
        sourceVersionNo: 0,
        resolvedAt
      }
    }
  })
}

/** buildAgreementLineRecords materializes one customer agreement version payload into frozen agreement line records. */
export function buildAgreementLineRecords(input: {
  customerPriceAgreementId: string
  currencyCode: SalesCurrencyCode
  versionNo: number
  lines: CustomerPriceAgreementLineDraftInput[]
  resolvedAt?: string | null
}): CustomerPriceAgreementLineRecord[] {
  const resolvedAt = nowIso(input.resolvedAt)
  return input.lines.map((line, index) => {
    assertRequiredString(line.itemId, `lines[${index}].itemId`)
    assertNonNegativeDecimalString(line.unitPriceAmount, `lines[${index}].unitPriceAmount`)
    assertNonNegativeDecimalString(line.moqQuantity, `lines[${index}].moqQuantity`)
    assertRequiredString(line.quantityUomCode, `lines[${index}].quantityUomCode`)

    const customerPriceAgreementLineId = randomUUID()
    return {
      customerPriceAgreementLineId,
      lineNo: index + 1,
      itemId: line.itemId,
      brandKey: normalizeBrandKey(line.brandKey),
      priceSnapshot: {
        currencyCode: input.currencyCode,
        unitPriceAmount: normalizeDecimalString(line.unitPriceAmount),
        sourceType: 'CUSTOMER_PRICE_AGREEMENT',
        sourceRefId: input.customerPriceAgreementId,
        sourceLineRefId: customerPriceAgreementLineId,
        sourceVersionNo: input.versionNo,
        resolvedAt
      },
      moqSnapshot: {
        moqQuantity: normalizeDecimalString(line.moqQuantity),
        quantityUomCode: line.quantityUomCode,
        sourceType: 'CUSTOMER_PRICE_AGREEMENT',
        sourceRefId: input.customerPriceAgreementId,
        sourceLineRefId: customerPriceAgreementLineId,
        sourceVersionNo: input.versionNo,
        resolvedAt
      }
    }
  })
}

/** selectBestPricingLine picks the best line for one item by preferring exact brand matches and the closest eligible MOQ tier. */
export function selectBestPricingLine<
  TLine extends {
    itemId: string
    brandKey?: string | null
    moqSnapshot: MoqSnapshot
    priceSnapshot: PriceSnapshot
  }
>(input: {
  lines: TLine[]
  itemId: string
  brandKey?: string | null
  requestedQuantity: string
  quantityUomCode: string
}): TLine | null {
  const exactBrand = normalizeBrandKey(input.brandKey)
  const brandMatched = input.lines.filter(
    (line) =>
      line.itemId === input.itemId &&
      line.moqSnapshot.quantityUomCode === input.quantityUomCode &&
      normalizeBrandKey(line.brandKey) === exactBrand
  )
  const fallbackBrand = input.lines.filter(
    (line) =>
      line.itemId === input.itemId &&
      line.moqSnapshot.quantityUomCode === input.quantityUomCode &&
      normalizeBrandKey(line.brandKey) === ''
  )
  const candidates = brandMatched.length > 0 ? brandMatched : fallbackBrand
  if (candidates.length === 0) {
    return null
  }

  const requestedQuantity = toNumber(input.requestedQuantity)
  const eligible = candidates
    .filter((line) => toNumber(line.moqSnapshot.moqQuantity) <= requestedQuantity)
    .sort((left, right) => compareDecimalString(right.moqSnapshot.moqQuantity, left.moqSnapshot.moqQuantity))

  if (eligible.length > 0) {
    return eligible[0]
  }

  return [...candidates].sort((left, right) =>
    compareDecimalString(left.moqSnapshot.moqQuantity, right.moqSnapshot.moqQuantity)
  )[0]
}

/** buildLowPricePlaceholder captures a low-price exception placeholder without implementing workflow. */
export function buildLowPricePlaceholder(input: {
  baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST'
  baselineValue: string
  actualValue: string
  currencyCode: SalesCurrencyCode
  detectedAt?: string | null
}): ExceptionPlaceholder {
  return {
    exceptionType: 'LOW_PRICE',
    status: 'REQUIRED',
    baselineSourceType: input.baselineSourceType,
    baselineValue: normalizeDecimalString(input.baselineValue),
    actualValue: normalizeDecimalString(input.actualValue),
    currencyCode: input.currencyCode,
    quantityUomCode: null,
    detectedAt: nowIso(input.detectedAt)
  }
}

/** buildLowMoqPlaceholder captures a low-MOQ exception placeholder without implementing workflow. */
export function buildLowMoqPlaceholder(input: {
  baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST'
  baselineValue: string
  actualValue: string
  quantityUomCode: string
  detectedAt?: string | null
}): ExceptionPlaceholder {
  return {
    exceptionType: 'LOW_MOQ',
    status: 'REQUIRED',
    baselineSourceType: input.baselineSourceType,
    baselineValue: normalizeDecimalString(input.baselineValue),
    actualValue: normalizeDecimalString(input.actualValue),
    currencyCode: null,
    quantityUomCode: input.quantityUomCode,
    detectedAt: nowIso(input.detectedAt)
  }
}

/** assertMoqResolvable keeps preview aligned with the contract's FAILED_PRECONDITION semantics when no MOQ baseline exists. */
export function assertMoqResolvable<T>(value: T | null, context: Record<string, unknown>): T {
  if (!value) {
    throw ExceptionFactory.application(SALES_FAILED_PRECONDITION, context)
  }

  return value
}

/** normalizeDecimalString keeps persisted snapshot decimals comparable across repositories and presenters. */
export function normalizeDecimalString(value: string): string {
  return value.trim()
}

/** normalizeBrandKey collapses optional brand payloads into the empty-string generic baseline key. */
export function normalizeBrandKey(value?: string | null): string {
  return (value ?? '').trim()
}

function toNumber(value: string): number {
  return Number(value)
}
