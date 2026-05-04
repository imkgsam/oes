import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { InventoryBalanceRecord } from '../../domain/models/wms-records'
import { InventoryRepository } from '../../domain/repositories/inventory.repository'
import { assertExists, assertRequiredString } from '../support/wms-assertions'
import { GetInventoryBalanceQuery } from './get-inventory-balance.query'

/** GetInventoryBalanceHandler returns one balance projection snapshot derived from immutable ledger truth. */
@Injectable()
@QueryHandler(GetInventoryBalanceQuery)
export class GetInventoryBalanceHandler
  implements IQueryHandler<GetInventoryBalanceQuery, InventoryBalanceRecord>
{
  constructor(
    @Inject(TOKENS.INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async execute(query: GetInventoryBalanceQuery): Promise<InventoryBalanceRecord> {
    assertRequiredString(query.payload.tenantId, 'tenantId')
    assertRequiredString(query.payload.warehouseId, 'warehouseId')
    assertRequiredString(query.payload.itemId, 'itemId')
    return assertExists(
      await this.inventoryRepository.getInventoryBalance(query.payload),
      'inventory_balance',
      `${query.payload.warehouseId}:${query.payload.locationId ?? '__WAREHOUSE__'}:${query.payload.itemId}`
    )
  }
}
