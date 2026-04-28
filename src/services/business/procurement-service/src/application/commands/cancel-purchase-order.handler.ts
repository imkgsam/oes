import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRecord, PurchaseOrderStatus } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { assertExists, assertPrecondition, assertRequiredString } from '../support/procurement-assertions'
import { nowIso } from '../support/procurement-write-support'
import { CancelPurchaseOrderCommand } from './cancel-purchase-order.command'

/** CancelPurchaseOrderHandler closes one PO only when downstream receiving expectation ownership has not started. */
@Injectable()
@CommandHandler(CancelPurchaseOrderCommand)
export class CancelPurchaseOrderHandler
  implements ICommandHandler<CancelPurchaseOrderCommand, PurchaseOrderRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(command: CancelPurchaseOrderCommand): Promise<PurchaseOrderRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')
    assertRequiredString(command.payload.cancelReason, 'cancelReason')

    const existing = assertExists(
      await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId),
      'purchase_order',
      command.payload.purchaseOrderId
    )
    assertPrecondition(existing.status !== PurchaseOrderStatus.CANCELLED, 'purchase order is already cancelled')
    assertPrecondition(
      !(await this.receivingRepository.existsByPurchaseOrderId(
        command.payload.tenantId,
        command.payload.purchaseOrderId
      )),
      'purchase order cannot be cancelled after receiving expectation exists'
    )

    const cancelledAt = nowIso()
    return this.purchaseOrderRepository.save({
      ...existing,
      status: PurchaseOrderStatus.CANCELLED,
      cancelReason: command.payload.cancelReason.trim(),
      cancelledAt,
      updatedAt: cancelledAt
    })
  }
}
