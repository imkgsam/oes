import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceiptLineSummaryRecord } from '../../domain/models/wms-records'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import { assertExists, assertRequiredString } from '../support/wms-assertions'
import { GetReceiptLineQuery } from './get-receipt-line.query'

/** GetReceiptLineHandler returns one WMS-owned receipt-line truth row for the query surface. */
@Injectable()
@QueryHandler(GetReceiptLineQuery)
export class GetReceiptLineHandler
  implements IQueryHandler<GetReceiptLineQuery, ReceiptLineSummaryRecord>
{
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async execute(query: GetReceiptLineQuery): Promise<ReceiptLineSummaryRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.receiptLineId, 'receiptLineId')
    return assertExists(
      await this.receiptRepository.findLineById(query.tenantId, query.receiptLineId),
      'receipt_line',
      query.receiptLineId
    )
  }
}
