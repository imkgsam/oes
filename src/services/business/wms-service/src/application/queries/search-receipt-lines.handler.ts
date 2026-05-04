import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult, ReceiptLineSummaryRecord } from '../../domain/models/wms-records'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import { assertDateRange, assertRequiredString } from '../support/wms-assertions'
import { SearchReceiptLinesQuery } from './search-receipt-lines.query'

/** SearchReceiptLinesHandler returns one filtered receipt-line page for the query surface. */
@Injectable()
@QueryHandler(SearchReceiptLinesQuery)
export class SearchReceiptLinesHandler
  implements IQueryHandler<SearchReceiptLinesQuery, PageResult<ReceiptLineSummaryRecord>>
{
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async execute(query: SearchReceiptLinesQuery): Promise<PageResult<ReceiptLineSummaryRecord>> {
    assertRequiredString(query.payload.tenantId, 'tenantId')
    assertDateRange(query.payload.postedAtFrom, query.payload.postedAtTo, 'postedAt')
    return this.receiptRepository.searchReceiptLines(query.payload)
  }
}
