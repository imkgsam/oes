import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRecord, PurchaseOrderStatus } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { assertRequiredString } from '../support/procurement-assertions'
import {
  buildDraftSupplierSnapshot,
  buildSupplierAcknowledgement,
  materializeDraftPurchaseOrderLines,
  normalizeCommercialTermsSnapshot,
  normalizePaymentTermsSnapshot,
  nowIso
} from '../support/procurement-write-support'
import { CreatePurchaseOrderDraftCommand } from './create-purchase-order-draft.command'

/** CreatePurchaseOrderDraftHandler creates one editable PO draft without making it a formal supplier commitment. */
@Injectable()
@CommandHandler(CreatePurchaseOrderDraftCommand)
export class CreatePurchaseOrderDraftHandler
  implements ICommandHandler<CreatePurchaseOrderDraftCommand, PurchaseOrderRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository
  ) {}

  async execute(command: CreatePurchaseOrderDraftCommand): Promise<PurchaseOrderRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.supplierId, 'supplierId')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')

    const createdAt = nowIso()
    const sourcePurchaseRequestNos = await resolveSourcePurchaseRequestNos(
      this.purchaseRequestRepository,
      command.payload.tenantId,
      command.payload.sourcePurchaseRequestIds ?? []
    )
    const lines = await materializeDraftPurchaseOrderLines({
      tenantId: command.payload.tenantId,
      lines: command.payload.lines ?? [],
      purchaseRequestRepository: this.purchaseRequestRepository,
      sourcePurchaseRequestIds: command.payload.sourcePurchaseRequestIds ?? []
    })

    return this.purchaseOrderRepository.save({
      purchaseOrderId: randomUUID(),
      orderNo: await this.purchaseOrderRepository.nextOrderNo(command.payload.tenantId),
      tenantId: command.payload.tenantId,
      orgId: command.payload.orgId ?? null,
      status: PurchaseOrderStatus.DRAFT,
      currencyCode: command.payload.currencyCode.trim(),
      supplierId: command.payload.supplierId.trim(),
      supplierSnapshot: buildDraftSupplierSnapshot(command.payload.supplierId.trim()),
      paymentTermsSnapshot: normalizePaymentTermsSnapshot(command.payload.paymentTermsSnapshot),
      supplierCommercialTermsSnapshot: normalizeCommercialTermsSnapshot(
        command.payload.supplierCommercialTermsSnapshot
      ),
      paymentSummary: null,
      sourcePurchaseRequestIds: command.payload.sourcePurchaseRequestIds ?? [],
      sourcePurchaseRequestNos,
      supplierAcknowledgement: buildSupplierAcknowledgement(),
      issueComment: null,
      cancelReason: null,
      createdAt,
      updatedAt: createdAt,
      issuedAt: null,
      cancelledAt: null,
      lines,
      changes: []
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
