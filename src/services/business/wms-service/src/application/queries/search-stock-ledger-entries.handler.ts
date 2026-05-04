import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult, StockLedgerEntryRecord } from '../../domain/models/wms-records'
import { InventoryRepository } from '../../domain/repositories/inventory.repository'
import { assertDateRange, assertRequiredString } from '../support/wms-assertions'
import { SearchStockLedgerEntriesQuery } from './search-stock-ledger-entries.query'

/** SearchStockLedgerEntriesHandler returns one filtered immutable ledger page for the query surface. */
@Injectable()
@QueryHandler(SearchStockLedgerEntriesQuery)
export class SearchStockLedgerEntriesHandler
  implements IQueryHandler<SearchStockLedgerEntriesQuery, PageResult<StockLedgerEntryRecord>>
{
  constructor(
    @Inject(TOKENS.INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async execute(query: SearchStockLedgerEntriesQuery): Promise<PageResult<StockLedgerEntryRecord>> {
    assertRequiredString(query.payload.tenantId, 'tenantId')
    assertDateRange(query.payload.postedAtFrom, query.payload.postedAtTo, 'postedAt')
    return this.inventoryRepository.searchStockLedgerEntries(query.payload)
  }
}
