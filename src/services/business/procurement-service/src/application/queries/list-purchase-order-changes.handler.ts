import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { assertExists, assertRequiredString } from '../support/procurement-assertions'
import { ListPurchaseOrderChangesQuery } from './list-purchase-order-changes.query'

/** ListPurchaseOrderChangesHandler returns the applied-change page for one existing PO. */
@Injectable()
@QueryHandler(ListPurchaseOrderChangesQuery)
export class ListPurchaseOrderChangesHandler
  implements
    IQueryHandler<
      ListPurchaseOrderChangesQuery,
      { changes: Awaited<ReturnType<PurchaseOrderRepository['listChanges']>>['items']; total: number; page: number; pageSize: number }
    >
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async execute(query: ListPurchaseOrderChangesQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    assertRequiredString(query.input.purchaseOrderId, 'purchaseOrderId')
    assertExists(
      await this.purchaseOrderRepository.findById(query.input.tenantId, query.input.purchaseOrderId),
      'purchase_order',
      query.input.purchaseOrderId
    )
    const page = await this.purchaseOrderRepository.listChanges(query.input)
    return {
      changes: page.items,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize
    }
  }
}
