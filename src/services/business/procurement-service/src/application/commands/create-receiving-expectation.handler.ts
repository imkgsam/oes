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
    assertRequiredString(command.payload.allocationGroupingKey, 'allocationGroupingKey')
    assertPrecondition(command.payload.sourceAllocationIds.length > 0, 'source allocation ids are required')

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
    const sourceAllocationIds = new Set(command.payload.sourceAllocationIds.map((value) => value.trim()))
    assertPrecondition(
      purchaseOrderLine.allocations.some((allocation) =>
        sourceAllocationIds.has(allocation.purchaseOrderLineAllocationId)
      ),
      'source allocations must belong to the purchase order line'
    )
    const existingExpectations = await this.receivingRepository.listByPurchaseOrderLineId(
      command.payload.tenantId,
      command.payload.purchaseOrderLineId
    )
    assertPrecondition(
      !existingExpectations.some(
        (expectation) =>
          expectation.allocationGroupingKey === command.payload.allocationGroupingKey.trim() &&
          expectation.targetWarehouseId === (normalizeOptionalString(command.payload.targetWarehouseId) ?? null) &&
          expectation.targetReceivingAddressId ===
            (normalizeOptionalString(command.payload.targetReceivingAddressId) ?? null)
      ),
      'receiving expectation already exists for this allocation grouping'
    )

    const createdAt = nowIso()
    return this.receivingRepository.save({
      receivingExpectationId: randomUUID(),
      tenantId: command.payload.tenantId,
      orgId: purchaseOrder.orgId ?? null,
      purchaseOrderId: purchaseOrder.purchaseOrderId,
      purchaseOrderLineId: purchaseOrderLine.purchaseOrderLineId,
      supplierId: purchaseOrder.supplierId,
      allocationGroupingKey: command.payload.allocationGroupingKey.trim(),
      sourceAllocationIds: [...sourceAllocationIds],
      targetWarehouseId: normalizeOptionalString(command.payload.targetWarehouseId) ?? null,
      targetReceivingAddressId:
        normalizeOptionalString(command.payload.targetReceivingAddressId) ?? null,
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
