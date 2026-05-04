import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { InventoryStatus, ReceiptLineRecord, ReceiptRecord, ReceiptStatus } from '../../domain/models/wms-records'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import {
  assertExists,
  assertKnownInventoryStatus,
  assertKnownPhysicalDiscrepancyType,
  assertKnownRestrictedReasonCode,
  assertKnownTrackingRefType,
  assertPositiveQuantity,
  assertPrecondition,
  assertRequiredString,
  normalizeOptionalString
} from '../support/wms-assertions'
import { nowIso } from '../support/wms-write-support'
import { AddOrReplaceReceiptLinesCommand } from './add-or-replace-receipt-lines.command'

/** AddOrReplaceReceiptLinesHandler rewrites the full line set of a draft receipt without posting inventory truth. */
@Injectable()
@CommandHandler(AddOrReplaceReceiptLinesCommand)
export class AddOrReplaceReceiptLinesHandler
  implements ICommandHandler<AddOrReplaceReceiptLinesCommand, ReceiptRecord>
{
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async execute(command: AddOrReplaceReceiptLinesCommand): Promise<ReceiptRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.receiptId, 'receiptId')
    const receipt = assertExists(
      await this.receiptRepository.findById(command.payload.tenantId, command.payload.receiptId),
      'receipt',
      command.payload.receiptId
    )
    assertPrecondition(receipt.status === ReceiptStatus.DRAFT, 'receipt must be draft before editing lines')

    const updatedAt = nowIso()
    const existingById = new Map(receipt.lines.map((line) => [line.receiptLineId, line]))
    const nextLines = command.payload.lines.map((line, index) =>
      this.buildLine(receipt, existingById, line, index + 1, updatedAt)
    )

    return this.receiptRepository.save({
      ...receipt,
      lineCount: nextLines.length,
      updatedAt,
      lines: nextLines
    })
  }

  private buildLine(
    receipt: ReceiptRecord,
    existingById: Map<string, ReceiptLineRecord>,
    line: AddOrReplaceReceiptLinesCommand['payload']['lines'][number],
    lineNo: number,
    updatedAt: string
  ): ReceiptLineRecord {
    assertRequiredString(line.itemId, `lines[${lineNo - 1}].itemId`)
    assertRequiredString(line.targetLocationId, `lines[${lineNo - 1}].targetLocationId`)
    assertRequiredString(line.uom, `lines[${lineNo - 1}].uom`)
    const inventoryStatus = assertKnownInventoryStatus(line.inventoryStatus)

    if (inventoryStatus === InventoryStatus.RESTRICTED) {
      assertPrecondition(Boolean(line.restrictedReason), 'restricted inventory requires restricted reason', {
        lineNo
      })
      assertKnownRestrictedReasonCode(line.restrictedReason!.reasonCode)
    } else {
      assertPrecondition(!line.restrictedReason, 'available inventory cannot carry restricted reason', {
        lineNo
      })
    }

    for (const trackingRef of line.trackingRefs) {
      assertKnownTrackingRefType(trackingRef.trackingRefType)
      assertRequiredString(trackingRef.trackingRefValue, `lines[${lineNo - 1}].trackingRefs.value`)
    }

    if (line.physicalDiscrepancy) {
      assertKnownPhysicalDiscrepancyType(line.physicalDiscrepancy.discrepancyType)
      if (normalizeOptionalString(line.physicalDiscrepancy.discrepancyQuantity)) {
        assertPositiveQuantity(
          line.physicalDiscrepancy.discrepancyQuantity!,
          `lines[${lineNo - 1}].physicalDiscrepancy.discrepancyQuantity`
        )
      }
    }

    const existing = normalizeOptionalString(line.receiptLineId)
      ? assertExists(
          existingById.get(normalizeOptionalString(line.receiptLineId)!) ?? null,
          'receipt_line',
          line.receiptLineId
        )
      : null

    return {
      receiptLineId: existing?.receiptLineId ?? randomUUID(),
      receiptId: receipt.receiptId,
      lineNo,
      itemId: line.itemId.trim(),
      itemCode: existing?.itemCode ?? null,
      itemName: existing?.itemName ?? null,
      receivingExpectationId: normalizeOptionalString(line.receivingExpectationId) ?? null,
      targetLocationId: line.targetLocationId.trim(),
      confirmedQuantity: assertPositiveQuantity(
        line.confirmedQuantity,
        `lines[${lineNo - 1}].confirmedQuantity`
      ),
      uom: line.uom.trim(),
      inventoryStatus,
      restrictedReason: inventoryStatus === InventoryStatus.RESTRICTED ? structuredClone(line.restrictedReason!) : null,
      trackingRefs: line.trackingRefs.map((trackingRef) => ({
        trackingRefType: trackingRef.trackingRefType,
        trackingRefValue: trackingRef.trackingRefValue.trim()
      })),
      physicalDiscrepancy: line.physicalDiscrepancy
        ? {
            discrepancyType: line.physicalDiscrepancy.discrepancyType,
            discrepancyQuantity: normalizeOptionalString(line.physicalDiscrepancy.discrepancyQuantity) ?? null,
            note: normalizeOptionalString(line.physicalDiscrepancy.note) ?? null
          }
        : null,
      evidenceAttachmentRefs: line.evidenceAttachmentRefs.map((value) => value.trim()).filter(Boolean),
      postedStockLedgerEntryIds: [],
      createdAt: existing?.createdAt ?? updatedAt,
      updatedAt
    }
  }
}
