import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseRequestRecord } from '../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { assertExists, assertRequiredString } from '../support/procurement-assertions'
import { GetPurchaseRequestQuery } from './get-purchase-request.query'

/** GetPurchaseRequestHandler loads one PR aggregate without mutating procurement demand state. */
@Injectable()
@QueryHandler(GetPurchaseRequestQuery)
export class GetPurchaseRequestHandler implements IQueryHandler<GetPurchaseRequestQuery, PurchaseRequestRecord> {
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository
  ) {}

  async execute(query: GetPurchaseRequestQuery): Promise<PurchaseRequestRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.purchaseRequestId, 'purchaseRequestId')
    return assertExists(
      await this.purchaseRequestRepository.findById(query.tenantId, query.purchaseRequestId),
      'purchase_request',
      query.purchaseRequestId
    )
  }
}
