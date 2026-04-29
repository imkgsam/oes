import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseRequestRecord } from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { assertExists, assertRequiredString } from '../support/procurement-assertions'
import { enrichPurchaseRequestForQuery } from '../support/procurement-query-enrichment'
import { GetPurchaseRequestQuery } from './get-purchase-request.query'

/** GetPurchaseRequestHandler loads one PR aggregate without mutating procurement demand state. */
@Injectable()
@QueryHandler(GetPurchaseRequestQuery)
export class GetPurchaseRequestHandler implements IQueryHandler<GetPurchaseRequestQuery, PurchaseRequestRecord> {
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(query: GetPurchaseRequestQuery): Promise<PurchaseRequestRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.purchaseRequestId, 'purchaseRequestId')
    const purchaseRequest = assertExists(
      await this.purchaseRequestRepository.findById(query.tenantId, query.purchaseRequestId),
      'purchase_request',
      query.purchaseRequestId
    )
    return enrichPurchaseRequestForQuery(
      purchaseRequest,
      this.purchaseOrderRepository,
      this.receivingRepository
    )
  }
}
