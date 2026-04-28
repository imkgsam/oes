import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseOrderSupplierAcknowledgementStatus
} from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { assertExists, assertPrecondition, assertRequiredString, normalizeOptionalString } from '../support/procurement-assertions'
import { nowIso } from '../support/procurement-write-support'
import { ConfirmSupplierAcknowledgementCommand } from './confirm-supplier-acknowledgement.command'

/** ConfirmSupplierAcknowledgementHandler records the phase 1 supplier acknowledgement summary on one issued PO. */
@Injectable()
@CommandHandler(ConfirmSupplierAcknowledgementCommand)
export class ConfirmSupplierAcknowledgementHandler
  implements ICommandHandler<ConfirmSupplierAcknowledgementCommand, PurchaseOrderRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async execute(command: ConfirmSupplierAcknowledgementCommand): Promise<PurchaseOrderRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')

    const existing = assertExists(
      await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId),
      'purchase_order',
      command.payload.purchaseOrderId
    )
    assertPrecondition(
      existing.status === PurchaseOrderStatus.ISSUED || existing.status === PurchaseOrderStatus.ACKNOWLEDGED,
      'supplier acknowledgement requires an issued purchase order'
    )

    return this.purchaseOrderRepository.save({
      ...existing,
      status: PurchaseOrderStatus.ACKNOWLEDGED,
      supplierAcknowledgement: {
        acknowledgementStatus: PurchaseOrderSupplierAcknowledgementStatus.ACKNOWLEDGED,
        acknowledgedAt: normalizeOptionalString(command.payload.acknowledgedAt) ?? nowIso(),
        externalReference: normalizeOptionalString(command.payload.externalReference) ?? null,
        comment: normalizeOptionalString(command.payload.comment) ?? null
      },
      updatedAt: nowIso()
    })
  }
}
