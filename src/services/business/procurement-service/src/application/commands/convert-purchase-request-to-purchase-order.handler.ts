import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseRequestRecord,
  PurchaseRequestStatus
} from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port'
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port'
import { assertExists, assertPrecondition, assertRequiredString } from '../support/procurement-assertions'
import {
  buildConvertedPurchaseOrderLines,
  buildSupplierAcknowledgement,
  nowIso,
  assertIssuableSupplierSnapshot
} from '../support/procurement-write-support'
import { ConvertPurchaseRequestToPurchaseOrderCommand } from './convert-purchase-request-to-purchase-order.command'

/** ConvertPurchaseRequestToPurchaseOrderHandler turns one approved PR into a phase 1 PO draft under frozen supplier-item gates. */
@Injectable()
@CommandHandler(ConvertPurchaseRequestToPurchaseOrderCommand)
export class ConvertPurchaseRequestToPurchaseOrderHandler
  implements ICommandHandler<ConvertPurchaseRequestToPurchaseOrderCommand, PurchaseOrderRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.ITEM_REFERENCE_LOOKUP_PORT)
    private readonly itemLookup: ItemReferenceLookupPort,
    @Inject(TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT)
    private readonly supplierLookup: SupplierReferenceLookupPort
  ) {}

  async execute(command: ConvertPurchaseRequestToPurchaseOrderCommand): Promise<PurchaseOrderRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseRequestId, 'purchaseRequestId')
    assertRequiredString(command.payload.supplierId, 'supplierId')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')
    assertPrecondition(command.payload.selectedLines.length > 0, 'at least one purchase request line must be selected')

    const purchaseRequest = assertExists(
      await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId),
      'purchase_request',
      command.payload.purchaseRequestId
    )
    assertApprovedPurchaseRequest(purchaseRequest)

    const selectedLineIds = new Set(command.payload.selectedLines.map((selection) => selection.purchaseRequestLineId))
    const selectedRequestLines = purchaseRequest.lines.filter((line) =>
      selectedLineIds.has(line.purchaseRequestLineId)
    )
    assertPrecondition(
      selectedRequestLines.length === command.payload.selectedLines.length,
      'selected purchase request line was not found'
    )

    const supplierSnapshot = await assertIssuableSupplierSnapshot(
      this.supplierLookup,
      command.payload.tenantId,
      command.payload.supplierId
    )
    const lines = await buildConvertedPurchaseOrderLines({
      tenantId: command.payload.tenantId,
      supplierId: command.payload.supplierId,
      purchaseRequestLines: selectedRequestLines,
      selections: command.payload.selectedLines,
      itemLookup: this.itemLookup,
      supplierLookup: this.supplierLookup
    })

    const createdAt = nowIso()
    const purchaseOrder: PurchaseOrderRecord = {
      purchaseOrderId: randomUUID(),
      orderNo: await this.purchaseOrderRepository.nextOrderNo(command.payload.tenantId),
      tenantId: command.payload.tenantId,
      orgId: purchaseRequest.orgId ?? null,
      status: PurchaseOrderStatus.DRAFT,
      currencyCode: command.payload.currencyCode.trim(),
      supplierId: command.payload.supplierId.trim(),
      supplierSnapshot,
      sourcePurchaseRequestIds: [purchaseRequest.purchaseRequestId],
      sourcePurchaseRequestNos: [purchaseRequest.requestNo],
      supplierAcknowledgement: buildSupplierAcknowledgement(),
      issueComment: null,
      cancelReason: null,
      createdAt,
      updatedAt: createdAt,
      issuedAt: null,
      cancelledAt: null,
      lines,
      changes: []
    }

    return this.purchaseOrderRepository.save(purchaseOrder)
  }
}

function assertApprovedPurchaseRequest(purchaseRequest: PurchaseRequestRecord): void {
  assertPrecondition(
    purchaseRequest.status === PurchaseRequestStatus.APPROVED,
    'purchase request must be APPROVED before conversion'
  )
}
