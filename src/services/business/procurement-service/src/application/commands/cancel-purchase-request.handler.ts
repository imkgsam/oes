import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseRequestRecord, PurchaseRequestStatus } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { assertExists, assertPrecondition, assertRequiredString } from '../support/procurement-assertions'
import { nowIso } from '../support/procurement-write-support'
import { CancelPurchaseRequestCommand } from './cancel-purchase-request.command'

/** CancelPurchaseRequestHandler closes one PR only when it has not already become a procurement commitment source. */
@Injectable()
@CommandHandler(CancelPurchaseRequestCommand)
export class CancelPurchaseRequestHandler
  implements ICommandHandler<CancelPurchaseRequestCommand, PurchaseRequestRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async execute(command: CancelPurchaseRequestCommand): Promise<PurchaseRequestRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseRequestId, 'purchaseRequestId')
    assertRequiredString(command.payload.cancelReason, 'cancelReason')

    const existing = assertExists(
      await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId),
      'purchase_request',
      command.payload.purchaseRequestId
    )
    assertPrecondition(existing.status !== PurchaseRequestStatus.CANCELLED, 'purchase request is already cancelled')
    assertPrecondition(existing.status !== PurchaseRequestStatus.REJECTED, 'rejected purchase request cannot be cancelled')
    assertPrecondition(
      !(await this.purchaseOrderRepository.existsBySourcePurchaseRequestId(
        command.payload.tenantId,
        command.payload.purchaseRequestId
      )),
      'purchase request cannot be cancelled after conversion to purchase order'
    )

    const cancelledAt = nowIso()
    return this.purchaseRequestRepository.save({
      ...existing,
      status: PurchaseRequestStatus.CANCELLED,
      cancelReason: command.payload.cancelReason.trim(),
      cancelledAt,
      updatedAt: cancelledAt
    })
  }
}
