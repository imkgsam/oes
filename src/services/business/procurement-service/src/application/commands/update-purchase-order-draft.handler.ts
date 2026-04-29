import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRecord, PurchaseOrderStatus } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { assertExists, assertPrecondition, assertRequiredString } from '../support/procurement-assertions'
import {
  materializeDraftPurchaseOrderLines,
  normalizeCommercialTermsSnapshot,
  normalizePaymentTermsSnapshot,
  nowIso
} from '../support/procurement-write-support'
import { UpdatePurchaseOrderDraftCommand } from './update-purchase-order-draft.command'

/** UpdatePurchaseOrderDraftHandler replaces the editable lines and references on one PO draft. */
@Injectable()
@CommandHandler(UpdatePurchaseOrderDraftCommand)
export class UpdatePurchaseOrderDraftHandler
  implements ICommandHandler<UpdatePurchaseOrderDraftCommand, PurchaseOrderRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository
  ) {}

  async execute(command: UpdatePurchaseOrderDraftCommand): Promise<PurchaseOrderRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')
    assertRequiredString(command.payload.supplierId, 'supplierId')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')

    const existing = assertExists(
      await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId),
      'purchase_order',
      command.payload.purchaseOrderId
    )
    assertPrecondition(existing.status === PurchaseOrderStatus.DRAFT, 'only DRAFT purchase orders can be updated')

    const existingLineById = new Map(existing.lines.map((line) => [line.purchaseOrderLineId, line] as const))
    const sourcePurchaseRequestIds = command.payload.sourcePurchaseRequestIds ?? existing.sourcePurchaseRequestIds
    const sourcePurchaseRequestNos = await resolveSourcePurchaseRequestNos(
      this.purchaseRequestRepository,
      command.payload.tenantId,
      sourcePurchaseRequestIds
    )
    const lines = await materializeDraftPurchaseOrderLines({
      tenantId: command.payload.tenantId,
      lines: command.payload.lines,
      purchaseRequestRepository: this.purchaseRequestRepository,
      sourcePurchaseRequestIds,
      existingLineById
    })

    return this.purchaseOrderRepository.save({
      ...existing,
      supplierId: command.payload.supplierId.trim(),
      currencyCode: command.payload.currencyCode.trim(),
      sourcePurchaseRequestIds,
      sourcePurchaseRequestNos,
      supplierSnapshot: {
        ...existing.supplierSnapshot,
        supplierId: command.payload.supplierId.trim()
      },
      paymentTermsSnapshot: normalizePaymentTermsSnapshot(command.payload.paymentTermsSnapshot),
      supplierCommercialTermsSnapshot: normalizeCommercialTermsSnapshot(
        command.payload.supplierCommercialTermsSnapshot
      ),
      updatedAt: nowIso(),
      lines
    })
  }
}

async function resolveSourcePurchaseRequestNos(
  purchaseRequestRepository: PurchaseRequestRepository,
  tenantId: string,
  sourcePurchaseRequestIds: string[]
): Promise<string[]> {
  const requestNos: string[] = []
  for (const purchaseRequestId of sourcePurchaseRequestIds) {
    const purchaseRequest = await purchaseRequestRepository.findById(tenantId, purchaseRequestId)
    if (purchaseRequest) {
      requestNos.push(purchaseRequest.requestNo)
    }
  }
  return requestNos
}
