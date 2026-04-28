import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderStatus, ReceivingExpectationRecord, ReceivingExpectationStatus } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { assertExists, assertPositiveQuantity, assertPrecondition, assertRequiredString, normalizeOptionalString } from '../support/procurement-assertions'
import { nowIso } from '../support/procurement-write-support'
import { CreateReceivingExpectationCommand } from './create-receiving-expectation.command'

/** CreateReceivingExpectationHandler creates the procurement-side expectation summary from one issued PO line only. */
@Injectable()
@CommandHandler(CreateReceivingExpectationCommand)
export class CreateReceivingExpectationHandler
  implements ICommandHandler<CreateReceivingExpectationCommand, ReceivingExpectationRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(command: CreateReceivingExpectationCommand): Promise<ReceivingExpectationRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')
    assertRequiredString(command.payload.purchaseOrderLineId, 'purchaseOrderLineId')

    const purchaseOrder = assertExists(
      await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId),
      'purchase_order',
      command.payload.purchaseOrderId
    )
    assertPrecondition(
      purchaseOrder.status === PurchaseOrderStatus.ISSUED || purchaseOrder.status === PurchaseOrderStatus.ACKNOWLEDGED,
      'receiving expectation can only be created from an issued purchase order'
    )
    const purchaseOrderLine = assertExists(
      purchaseOrder.lines.find((line) => line.purchaseOrderLineId === command.payload.purchaseOrderLineId) ?? null,
      'purchase_order_line',
      command.payload.purchaseOrderLineId
    )
    assertPrecondition(
      !(await this.receivingRepository.findByPurchaseOrderLineId(
        command.payload.tenantId,
        command.payload.purchaseOrderLineId
      )),
      'receiving expectation already exists for purchase order line'
    )

    const createdAt = nowIso()
    return this.receivingRepository.save({
      receivingExpectationId: randomUUID(),
      tenantId: command.payload.tenantId,
      orgId: purchaseOrder.orgId ?? null,
      purchaseOrderId: purchaseOrder.purchaseOrderId,
      purchaseOrderLineId: purchaseOrderLine.purchaseOrderLineId,
      supplierId: purchaseOrder.supplierId,
      expectedQuantity: assertPositiveQuantity(command.payload.expectedQuantity, 'expectedQuantity'),
      receivedQuantitySummary: '0',
      openQuantity: assertPositiveQuantity(command.payload.expectedQuantity, 'expectedQuantity'),
      expectedReceiptDate: normalizeOptionalString(command.payload.expectedReceiptDate) ?? null,
      status: ReceivingExpectationStatus.OPEN,
      createdAt,
      updatedAt: createdAt,
      discrepancy: null
    })
  }
}
