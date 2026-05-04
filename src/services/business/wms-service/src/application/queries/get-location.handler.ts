import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { LocationRecord } from '../../domain/models/wms-records'
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository'
import { assertExists, assertRequiredString } from '../support/wms-assertions'
import { GetLocationQuery } from './get-location.query'

/** GetLocationHandler returns one WMS-owned location truth row for the query surface. */
@Injectable()
@QueryHandler(GetLocationQuery)
export class GetLocationHandler implements IQueryHandler<GetLocationQuery, LocationRecord> {
  constructor(
    @Inject(TOKENS.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository
  ) {}

  async execute(query: GetLocationQuery): Promise<LocationRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.locationId, 'locationId')
    return assertExists(
      await this.warehouseRepository.findLocationById(query.tenantId, query.locationId),
      'location',
      query.locationId
    )
  }
}
