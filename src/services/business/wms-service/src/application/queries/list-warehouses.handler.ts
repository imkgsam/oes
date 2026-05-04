import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult, WarehouseRecord } from '../../domain/models/wms-records'
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository'
import { assertRequiredString } from '../support/wms-assertions'
import { ListWarehousesQuery } from './list-warehouses.query'

/** ListWarehousesHandler returns one filtered internal warehouse page for the query surface. */
@Injectable()
@QueryHandler(ListWarehousesQuery)
export class ListWarehousesHandler
  implements IQueryHandler<ListWarehousesQuery, PageResult<WarehouseRecord>>
{
  constructor(
    @Inject(TOKENS.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository
  ) {}

  async execute(query: ListWarehousesQuery): Promise<PageResult<WarehouseRecord>> {
    assertRequiredString(query.payload.tenantId, 'tenantId')
    return this.warehouseRepository.searchWarehouses(query.payload)
  }
}
