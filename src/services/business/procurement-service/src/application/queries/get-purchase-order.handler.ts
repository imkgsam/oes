import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRecord } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { assertExists, assertRequiredString } from '../support/procurement-assertions'
import { GetPurchaseOrderQuery } from './get-purchase-order.query'

/** GetPurchaseOrderHandler loads one PO aggregate without mutating procurement commitment state. */
@Injectable()
@QueryHandler(GetPurchaseOrderQuery)
export class GetPurchaseOrderHandler implements IQueryHandler<GetPurchaseOrderQuery, PurchaseOrderRecord> {
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async execute(query: GetPurchaseOrderQuery): Promise<PurchaseOrderRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.purchaseOrderId, 'purchaseOrderId')
    return assertExists(
      await this.purchaseOrderRepository.findById(query.tenantId, query.purchaseOrderId),
      'purchase_order',
      query.purchaseOrderId
    )
  }
}
