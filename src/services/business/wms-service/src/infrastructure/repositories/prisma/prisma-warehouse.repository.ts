import { Injectable } from '@nestjs/common'
import { LocationRecord, PageResult, SearchLocationsInput, SearchWarehousesInput, WarehouseRecord } from '../../../domain/models/wms-records'
import { WarehouseRepository } from '../../../domain/repositories/warehouse.repository'
import { normalizeOptionalString, normalizePageInput, paginate } from '../../../application/support/wms-assertions'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaWmsRecordMapper } from './prisma-wms-record.mapper'

/** PrismaWarehouseRepository persists and queries the internal warehouse and location topology owned by WMS. */
@Injectable()
export class PrismaWarehouseRepository implements WarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWarehouseById(tenantId: string, warehouseId: string): Promise<WarehouseRecord | null> {
    const row = await this.prisma.getExecutionClient().warehouse.findFirst({
      where: {
        tenantId,
        id: warehouseId
      }
    })

    return row ? PrismaWmsRecordMapper.toWarehouse(row) : null
  }

  async searchWarehouses(input: SearchWarehousesInput): Promise<PageResult<WarehouseRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().warehouse.findMany({
      where: {
        tenantId: input.tenantId
      },
      orderBy: {
        warehouseCode: 'asc'
      }
    })

    const keyword = normalizeOptionalString(input.keyword)?.toLowerCase()
    const filtered = rows
      .map((row) => PrismaWmsRecordMapper.toWarehouse(row))
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => {
        if (!keyword) {
          return true
        }
        return (
          record.warehouseCode.toLowerCase().includes(keyword) ||
          record.warehouseName.toLowerCase().includes(keyword)
        )
      })

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async findLocationById(tenantId: string, locationId: string): Promise<LocationRecord | null> {
    const row = await this.prisma.getExecutionClient().location.findFirst({
      where: {
        tenantId,
        id: locationId
      }
    })

    return row ? PrismaWmsRecordMapper.toLocation(row) : null
  }

  async searchLocations(input: SearchLocationsInput): Promise<PageResult<LocationRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().location.findMany({
      where: {
        tenantId: input.tenantId
      },
      orderBy: [
        {
          warehouseId: 'asc'
        },
        {
          locationCode: 'asc'
        }
      ]
    })

    const filtered = rows
      .map((row) => PrismaWmsRecordMapper.toLocation(row))
      .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
      .filter(
        (record) =>
          !input.parentLocationId || (record.parentLocationId ?? null) === input.parentLocationId
      )
      .filter((record) => !input.locationType || record.locationType === input.locationType)
      .filter((record) => !input.status || record.status === input.status)
      .filter(
        (record) =>
          input.supportsReceipt === undefined || record.supportsReceipt === input.supportsReceipt
      )
      .filter(
        (record) =>
          input.supportsStorage === undefined || record.supportsStorage === input.supportsStorage
      )

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }
}
