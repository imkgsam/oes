import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseOrderSupplierAcknowledgementStatus
} from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port'
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port'
import { assertExists, assertPrecondition, assertRequiredString, normalizeOptionalString } from '../support/procurement-assertions'
import {
  assertIssuableSupplierSnapshot,
  assertStandardLineOfferings,
  buildAppliedChange,
  materializeDraftPurchaseOrderLines,
  nowIso
} from '../support/procurement-write-support'
import { ApplyPurchaseOrderChangeCommand } from './apply-purchase-order-change.command'

/** ApplyPurchaseOrderChangeHandler persists one applied phase 1 PO change together with the updated controlled target state. */
@Injectable()
@CommandHandler(ApplyPurchaseOrderChangeCommand)
export class ApplyPurchaseOrderChangeHandler
  implements ICommandHandler<ApplyPurchaseOrderChangeCommand, { purchaseOrder: PurchaseOrderRecord; change: ReturnType<typeof buildAppliedChange> }>
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.ITEM_REFERENCE_LOOKUP_PORT)
    private readonly itemLookup: ItemReferenceLookupPort,
    @Inject(TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT)
    private readonly supplierLookup: SupplierReferenceLookupPort
  ) {}

  async execute(
    command: ApplyPurchaseOrderChangeCommand
  ): Promise<{ purchaseOrder: PurchaseOrderRecord; change: ReturnType<typeof buildAppliedChange> }> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')
    assertRequiredString(command.payload.changeType, 'changeType')
    assertRequiredString(command.payload.changeReason, 'changeReason')
    assertRequiredString(command.payload.appliedBy.operatorId, 'appliedBy.operatorId')
    assertRequiredString(command.payload.appliedBy.displayName, 'appliedBy.displayName')

    const existing = assertExists(
      await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId),
      'purchase_order',
      command.payload.purchaseOrderId
    )
    assertPrecondition(
      existing.status === PurchaseOrderStatus.ISSUED || existing.status === PurchaseOrderStatus.ACKNOWLEDGED,
      'purchase order change requires an issued purchase order'
    )

    const existingLineById = new Map(existing.lines.map((line) => [line.purchaseOrderLineId, line] as const))
    const lines =
      command.payload.targetState.lines && command.payload.targetState.lines.length > 0
        ? await materializeDraftPurchaseOrderLines({
            tenantId: command.payload.tenantId,
            lines: command.payload.targetState.lines,
            itemLookup: this.itemLookup,
            purchaseRequestRepository: this.purchaseRequestRepository,
            sourcePurchaseRequestIds: existing.sourcePurchaseRequestIds,
            existingLineById
          })
        : existing.lines

    const supplierSnapshot = await assertIssuableSupplierSnapshot(
      this.supplierLookup,
      command.payload.tenantId,
      existing.supplierId
    )
    const changedLines = await assertStandardLineOfferings(
      this.supplierLookup,
      command.payload.tenantId,
      existing.supplierId,
      lines
    )
    const change = buildAppliedChange({
      purchaseOrderId: existing.purchaseOrderId,
      changeType: command.payload.changeType,
      changeReason: command.payload.changeReason,
      appliedBy: {
        operatorId: command.payload.appliedBy.operatorId.trim(),
        displayName: command.payload.appliedBy.displayName.trim()
      },
      lineCount: changedLines.length
    })

    const updatedAt = nowIso()
    const purchaseOrder = await this.purchaseOrderRepository.save({
      ...existing,
      supplierSnapshot,
      lines: changedLines,
      supplierAcknowledgement: command.payload.targetState.supplierAcknowledgement
        ? {
            acknowledgementStatus:
              normalizeOptionalString(command.payload.targetState.supplierAcknowledgement.acknowledgementStatus) === 'ACKNOWLEDGED'
                ? PurchaseOrderSupplierAcknowledgementStatus.ACKNOWLEDGED
                : existing.supplierAcknowledgement.acknowledgementStatus,
            acknowledgedAt:
              normalizeOptionalString(command.payload.targetState.supplierAcknowledgement.acknowledgedAt) ??
              existing.supplierAcknowledgement.acknowledgedAt ??
              null,
            externalReference:
              normalizeOptionalString(command.payload.targetState.supplierAcknowledgement.externalReference) ??
              existing.supplierAcknowledgement.externalReference ??
              null,
            comment:
              normalizeOptionalString(command.payload.targetState.supplierAcknowledgement.comment) ??
              existing.supplierAcknowledgement.comment ??
              null
          }
        : existing.supplierAcknowledgement,
      updatedAt,
      changes: [...existing.changes, change]
    })

    return {
      purchaseOrder,
      change
    }
  }
}
