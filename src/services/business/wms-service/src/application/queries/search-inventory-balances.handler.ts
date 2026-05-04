import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { InventoryBalanceRecord, PageResult } from '../../domain/models/wms-records'
import { InventoryRepository } from '../../domain/repositories/inventory.repository'
import { assertRequiredString } from '../support/wms-assertions'
import { SearchInventoryBalancesQuery } from './search-inventory-balances.query'

/** SearchInventoryBalancesHandler returns one filtered balance projection page for the query surface. */
@Injectable()
@QueryHandler(SearchInventoryBalancesQuery)
export class SearchInventoryBalancesHandler
  implements IQueryHandler<SearchInventoryBalancesQuery, PageResult<InventoryBalanceRecord>>
{
  constructor(
    @Inject(TOKENS.INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async execute(query: SearchInventoryBalancesQuery): Promise<PageResult<InventoryBalanceRecord>> {
    assertRequiredString(query.payload.tenantId, 'tenantId')
    return this.inventoryRepository.searchInventoryBalances(query.payload)
  }
}
