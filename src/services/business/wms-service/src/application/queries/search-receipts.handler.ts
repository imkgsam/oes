import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult, ReceiptRecord } from '../../domain/models/wms-records'
import { ReceiptRepository } from '../../domain/repositories/receipt.repository'
import { assertDateRange, assertRequiredString } from '../support/wms-assertions'
import { SearchReceiptsQuery } from './search-receipts.query'

/** SearchReceiptsHandler returns one filtered receipt page without exposing non-WMS lifecycle semantics. */
@Injectable()
@QueryHandler(SearchReceiptsQuery)
export class SearchReceiptsHandler
  implements IQueryHandler<SearchReceiptsQuery, PageResult<ReceiptRecord>>
{
  constructor(
    @Inject(TOKENS.RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository
  ) {}

  async execute(query: SearchReceiptsQuery): Promise<PageResult<ReceiptRecord>> {
    assertRequiredString(query.payload.tenantId, 'tenantId')
    assertDateRange(query.payload.receiptDateFrom, query.payload.receiptDateTo, 'receiptDate')
    assertDateRange(query.payload.postedAtFrom, query.payload.postedAtTo, 'postedAt')
    return this.receiptRepository.searchReceipts(query.payload)
  }
}
