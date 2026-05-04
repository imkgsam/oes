import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { WarehouseRecord } from '../../domain/models/wms-records'
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository'
import { assertExists, assertRequiredString } from '../support/wms-assertions'
import { GetWarehouseQuery } from './get-warehouse.query'

/** GetWarehouseHandler returns one WMS-owned warehouse truth row for the query surface. */
@Injectable()
@QueryHandler(GetWarehouseQuery)
export class GetWarehouseHandler implements IQueryHandler<GetWarehouseQuery, WarehouseRecord> {
  constructor(
    @Inject(TOKENS.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository
  ) {}

  async execute(query: GetWarehouseQuery): Promise<WarehouseRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.warehouseId, 'warehouseId')
    return assertExists(
      await this.warehouseRepository.findWarehouseById(query.tenantId, query.warehouseId),
      'warehouse',
      query.warehouseId
    )
  }
}
