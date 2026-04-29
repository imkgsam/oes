import {
  PurchaseRequestLineConversionStatus,
  PurchaseRequestPurchaseOrderLinkRecord,
  PurchaseRequestRecord,
  PurchaseRequestStatus,
  ReceivingExpectationRecord,
  ReceivingExpectationStatus
} from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { compareQuantity, normalizeQuantity, normalizePageInput, paginate } from './procurement-assertions'

/** enrichPurchaseRequestForQuery derives PR conversion and receiving read-model fields from procurement-owned PO and expectation facts. */
export async function enrichPurchaseRequestForQuery(
  purchaseRequest: PurchaseRequestRecord,
  purchaseOrderRepository: Pick<PurchaseOrderRepository, 'findBySourcePurchaseRequestId'>,
  receivingRepository: Pick<ReceivingRepository, 'listByPurchaseOrderLineId'>
): Promise<PurchaseRequestRecord> {
  const purchaseOrders = await purchaseOrderRepository.findBySourcePurchaseRequestId(
    purchaseRequest.tenantId,
    purchaseRequest.purchaseRequestId
  )

  const enrichedLines = await Promise.all(
    purchaseRequest.lines.map(async (line) => {
      const linkedPurchaseOrderLines: PurchaseRequestPurchaseOrderLinkRecord[] = []
      let allocatedQuantityTotal = '0'

      for (const order of purchaseOrders) {
        for (const orderLine of order.lines) {
          const matchingAllocations = orderLine.allocations.filter(
            (allocation) =>
              allocation.allocationType === 'PURCHASE_REQUEST_LINE' &&
              allocation.sourceReferenceId === line.purchaseRequestLineId
          )
          const matchesLegacyLink =
            matchingAllocations.length === 0 && orderLine.sourcePurchaseRequestLineId === line.purchaseRequestLineId
          if (matchingAllocations.length === 0 && !matchesLegacyLink) {
            continue
          }

          const expectations = await receivingRepository.listByPurchaseOrderLineId(
            purchaseRequest.tenantId,
            orderLine.purchaseOrderLineId
          )
          const allocatedQuantity =
            matchingAllocations.length > 0
              ? sumQuantities(matchingAllocations.map((allocation) => allocation.quantity))
              : orderLine.orderedQuantity
          allocatedQuantityTotal = sumQuantities([allocatedQuantityTotal, allocatedQuantity])
          linkedPurchaseOrderLines.push({
            purchaseOrderId: order.purchaseOrderId,
            orderNo: order.orderNo,
            purchaseOrderLineId: orderLine.purchaseOrderLineId,
            allocatedQuantity,
            expectedReceiptDate: pickNextExpectedReceiptDate(expectations) ?? line.neededByDate ?? null,
            receivingStatusSummary: summarizeReceivingStatus(expectations)
          })
        }
      }

      const conversionStatus =
        compareQuantity(allocatedQuantityTotal, '0') <= 0
          ? PurchaseRequestLineConversionStatus.NOT_CONVERTED
          : compareQuantity(allocatedQuantityTotal, line.requestedQuantity) >= 0
            ? PurchaseRequestLineConversionStatus.CONVERTED
            : PurchaseRequestLineConversionStatus.PARTIALLY_CONVERTED

      return {
        ...line,
        conversionStatus,
        linkedPurchaseOrderLines
      }
    })
  )

  const headerLinks = dedupeHeaderLinks(enrichedLines.flatMap((line) => line.linkedPurchaseOrderLines ?? []))
  const nextExpectedReceiptDate = pickNextExpectedReceiptDateFromLinks(headerLinks)
  const receivingStatusSummary = summarizeLinkedReceivingStatus(headerLinks)

  return {
    ...purchaseRequest,
    status: derivePurchaseRequestStatus(purchaseRequest.status, enrichedLines),
    lines: enrichedLines,
    linkedPurchaseOrders: headerLinks,
    nextExpectedReceiptDate,
    receivingStatusSummary
  }
}

/** paginateEnrichedPurchaseRequests reapplies computed-status and linked-PO filters after query enrichment. */
export function paginateEnrichedPurchaseRequests(input: {
  items: PurchaseRequestRecord[]
  page?: number
  pageSize?: number
  status?: PurchaseRequestStatus
  purchaseOrderId?: string
}) {
  const filtered = input.items
    .filter((record) => !input.status || record.status === input.status)
    .filter(
      (record) =>
        !input.purchaseOrderId ||
        (record.linkedPurchaseOrders ?? []).some((link) => link.purchaseOrderId === input.purchaseOrderId)
    )

  const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
  const { pageItems, total } = paginate(filtered, page, pageSize)
  return {
    items: pageItems,
    total,
    page,
    pageSize
  }
}

function derivePurchaseRequestStatus(
  currentStatus: PurchaseRequestStatus,
  lines: PurchaseRequestRecord['lines']
): PurchaseRequestStatus {
  if (
    currentStatus !== PurchaseRequestStatus.APPROVED &&
    currentStatus !== PurchaseRequestStatus.PARTIALLY_CONVERTED &&
    currentStatus !== PurchaseRequestStatus.CONVERTED
  ) {
    return currentStatus
  }

  const conversionStatuses = lines.map(
    (line) => line.conversionStatus ?? PurchaseRequestLineConversionStatus.NOT_CONVERTED
  )
  if (conversionStatuses.every((status) => status === PurchaseRequestLineConversionStatus.CONVERTED)) {
    return PurchaseRequestStatus.CONVERTED
  }
  if (conversionStatuses.some((status) => status !== PurchaseRequestLineConversionStatus.NOT_CONVERTED)) {
    return PurchaseRequestStatus.PARTIALLY_CONVERTED
  }
  return PurchaseRequestStatus.APPROVED
}

function dedupeHeaderLinks(
  links: PurchaseRequestPurchaseOrderLinkRecord[]
): PurchaseRequestPurchaseOrderLinkRecord[] {
  const map = new Map<string, PurchaseRequestPurchaseOrderLinkRecord>()
  for (const link of links) {
    const existing = map.get(link.purchaseOrderId)
    if (!existing) {
      map.set(link.purchaseOrderId, {
        purchaseOrderId: link.purchaseOrderId,
        orderNo: link.orderNo,
        expectedReceiptDate: link.expectedReceiptDate ?? null,
        receivingStatusSummary: link.receivingStatusSummary ?? null
      })
      continue
    }
    map.set(link.purchaseOrderId, {
      ...existing,
      expectedReceiptDate: pickEarlierDate(existing.expectedReceiptDate, link.expectedReceiptDate),
      receivingStatusSummary: pickStrongerReceivingStatus(
        existing.receivingStatusSummary,
        link.receivingStatusSummary
      )
    })
  }
  return [...map.values()]
}

function pickNextExpectedReceiptDate(expectations: ReceivingExpectationRecord[]): string | null {
  return expectations
    .map((expectation) => expectation.expectedReceiptDate)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .sort()[0] ?? null
}

function pickNextExpectedReceiptDateFromLinks(
  links: PurchaseRequestPurchaseOrderLinkRecord[]
): string | null {
  return links
    .map((link) => link.expectedReceiptDate)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .sort()[0] ?? null
}

function summarizeReceivingStatus(expectations: ReceivingExpectationRecord[]): string {
  if (expectations.length === 0) {
    return 'OPEN'
  }
  if (expectations.some((expectation) => expectation.status === ReceivingExpectationStatus.PARTIALLY_RECEIVED)) {
    return ReceivingExpectationStatus.PARTIALLY_RECEIVED
  }
  if (expectations.some((expectation) => expectation.status === ReceivingExpectationStatus.OPEN)) {
    return ReceivingExpectationStatus.OPEN
  }
  if (expectations.every((expectation) => expectation.status === ReceivingExpectationStatus.COMPLETED)) {
    return ReceivingExpectationStatus.COMPLETED
  }
  if (expectations.every((expectation) => expectation.status === ReceivingExpectationStatus.CANCELLED)) {
    return ReceivingExpectationStatus.CANCELLED
  }
  return expectations[0]?.status ?? ''
}

function summarizeLinkedReceivingStatus(links: PurchaseRequestPurchaseOrderLinkRecord[]): string | null {
  if (links.length === 0) {
    return null
  }
  return links.reduce<string | null>((current, link) => {
    return pickStrongerReceivingStatus(current, link.receivingStatusSummary)
  }, null)
}

function pickEarlierDate(left?: string | null, right?: string | null): string | null {
  if (!left) {
    return right ?? null
  }
  if (!right) {
    return left
  }
  return left <= right ? left : right
}

function pickStrongerReceivingStatus(left?: string | null, right?: string | null): string | null {
  const ranked = [
    ReceivingExpectationStatus.PARTIALLY_RECEIVED,
    ReceivingExpectationStatus.OPEN,
    ReceivingExpectationStatus.COMPLETED,
    ReceivingExpectationStatus.CANCELLED
  ]
  if (!left) {
    return right ?? null
  }
  if (!right) {
    return left
  }
  return ranked.indexOf(left as ReceivingExpectationStatus) <= ranked.indexOf(right as ReceivingExpectationStatus)
    ? left
    : right
}

function sumQuantities(values: string[]): string {
  return values.reduce((total, value) => (Number(normalizeQuantity(total)) + Number(normalizeQuantity(value))).toString(), '0')
}
