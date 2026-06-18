import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRecord, PurchaseOrderStatus, PurchaseRequestLineType } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port'
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port'
import { assertExists, assertPrecondition, assertRequiredString, normalizeOptionalString } from '../support/procurement-assertions'
import { assertIssuableSupplierSnapshot, assertStandardLineOfferings, nowIso } from '../support/procurement-write-support'
import { IssuePurchaseOrderCommand } from './issue-purchase-order.command'

/** IssuePurchaseOrderHandler turns one PO draft into a formal phase 1 procurement commitment under current reference truth. */
@Injectable()
@CommandHandler(IssuePurchaseOrderCommand)
export class IssuePurchaseOrderHandler
  implements ICommandHandler<IssuePurchaseOrderCommand, PurchaseOrderRecord>
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

  async execute(command: IssuePurchaseOrderCommand): Promise<PurchaseOrderRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')

    const existing = assertExists(
      await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId),
      'purchase_order',
      command.payload.purchaseOrderId
    )
    assertPrecondition(existing.status === PurchaseOrderStatus.DRAFT, 'only DRAFT purchase orders can be issued')

    for (const line of existing.lines) {
      if (line.lineType === PurchaseRequestLineType.STANDARD_ITEM) {
        const item = assertExists(
          await this.itemLookup.getItemById(command.payload.tenantId, line.itemId ?? ''),
          'item',
          line.itemId ?? ''
        )
        assertPrecondition(item.active, 'standard item must remain active before issue', {
          itemId: line.itemId ?? ''
        })
        assertPrecondition(item.purchasable, 'standard item must remain purchasable before issue', {
          itemId: line.itemId ?? ''
        })
        line.itemCode = item.itemCode
        line.itemName = item.itemName
      }
    }

    const supplierSnapshot = await assertIssuableSupplierSnapshot(
      this.supplierLookup,
      command.payload.tenantId,
      existing.supplierId
    )
    const lines = await assertStandardLineOfferings(
      this.supplierLookup,
      command.payload.tenantId,
      existing.supplierId,
      existing.lines
    )
    const issuedAt = nowIso()

    return this.purchaseOrderRepository.save({
      ...existing,
      status: PurchaseOrderStatus.ISSUED,
      supplierSnapshot,
      lines,
      issueComment: normalizeOptionalString(command.payload.issueComment) ?? existing.issueComment ?? null,
      issuedAt,
      updatedAt: issuedAt
    })
  }
}
