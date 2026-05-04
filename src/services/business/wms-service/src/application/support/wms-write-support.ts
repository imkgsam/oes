import {
  ProcurementReceiptSummaryRecord,
  ReceiptPhysicalDiscrepancyType,
  ReceiptRecord,
  RestrictedStatusReasonCode
} from '../../domain/models/wms-records'
import { sumQuantities } from './wms-assertions'

/** nowIso returns one current UTC timestamp string for command-side record creation and updates. */
export function nowIso(): string {
  return new Date().toISOString()
}

/** buildProcurementReceiptSummary derives the procurement-facing physical summary that WMS records locally after posting. */
export function buildProcurementReceiptSummary(receipt: ReceiptRecord, recordedAt: string): ProcurementReceiptSummaryRecord {
  return {
    referencedReceivingExpectationIds: Array.from(
      new Set([
        ...receipt.referencedReceivingExpectationIds,
        ...receipt.lines
          .map((line) => line.receivingExpectationId ?? null)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      ])
    ),
    totalConfirmedQuantity: sumQuantities(receipt.lines.map((line) => line.confirmedQuantity)),
    restrictedQuantity: sumQuantities(
      receipt.lines
        .filter((line) => line.inventoryStatus === 'RESTRICTED')
        .map((line) => line.confirmedQuantity)
    ),
    discrepancyLines: receipt.lines
      .filter((line) => line.physicalDiscrepancy)
      .map((line) => ({
        receiptLineId: line.receiptLineId,
        discrepancyType: line.physicalDiscrepancy?.discrepancyType ?? ReceiptPhysicalDiscrepancyType.OTHER,
        discrepancyQuantity: line.physicalDiscrepancy?.discrepancyQuantity ?? null
      })),
    recordedAt
  }
}

/** hasRestrictedLines reports whether one receipt has any restricted stock lines. */
export function hasRestrictedLines(receipt: ReceiptRecord): boolean {
  return receipt.lines.some((line) => line.inventoryStatus === 'RESTRICTED')
}

/** hasPhysicalDiscrepancy reports whether one receipt contains any physical discrepancy fact. */
export function hasPhysicalDiscrepancy(receipt: ReceiptRecord): boolean {
  return receipt.lines.some((line) => Boolean(line.physicalDiscrepancy))
}

/** restrictedReasonQuantity extracts one reason-specific restricted quantity total from a receipt line group. */
export function restrictedReasonQuantity(receipt: ReceiptRecord, reasonCode: RestrictedStatusReasonCode): string {
  return sumQuantities(
    receipt.lines
      .filter((line) => line.restrictedReason?.reasonCode === reasonCode)
      .map((line) => line.confirmedQuantity)
  )
}
