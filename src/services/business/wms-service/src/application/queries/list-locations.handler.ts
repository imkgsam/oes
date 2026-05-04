import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { LocationRecord, PageResult } from '../../domain/models/wms-records'
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository'
import { assertRequiredString } from '../support/wms-assertions'
import { ListLocationsQuery } from './list-locations.query'

/** ListLocationsHandler returns one filtered internal location page for the query surface. */
@Injectable()
@QueryHandler(ListLocationsQuery)
export class ListLocationsHandler
  implements IQueryHandler<ListLocationsQuery, PageResult<LocationRecord>>
{
  constructor(
    @Inject(TOKENS.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository
  ) {}

  async execute(query: ListLocationsQuery): Promise<PageResult<LocationRecord>> {
    assertRequiredString(query.payload.tenantId, 'tenantId')
    return this.warehouseRepository.searchLocations(query.payload)
  }
}
