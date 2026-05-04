import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceiptRecord } from '../../domain/models/wms-records'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import { assertExists, assertRequiredString } from '../support/wms-assertions'
import { GetReceiptQuery } from './get-receipt.query'

/** GetReceiptHandler returns one WMS-owned receipt aggregate for the query surface. */
@Injectable()
@QueryHandler(GetReceiptQuery)
export class GetReceiptHandler implements IQueryHandler<GetReceiptQuery, ReceiptRecord> {
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async execute(query: GetReceiptQuery): Promise<ReceiptRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.receiptId, 'receiptId')
    return assertExists(
      await this.receiptRepository.findById(query.tenantId, query.receiptId),
      'receipt',
      query.receiptId
    )
  }
}
