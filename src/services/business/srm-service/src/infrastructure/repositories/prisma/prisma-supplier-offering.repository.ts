import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../prisma/generated/prisma'
import {
  PageResult,
  SupplierOfferingRecord,
  SupplierOfferingStatus
} from '../../../domain/models/srm-records'
import { SupplierOfferingRepository } from '../../../domain/repositories/supplier-offering.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaSrmRecordMapper } from './prisma-srm-record.mapper'

/** PrismaSupplierOfferingRepository persists and lists the current SRM supplier-item supplyability facts. */
@Injectable()
export class PrismaSupplierOfferingRepository implements SupplierOfferingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, supplierOfferingId: string): Promise<SupplierOfferingRecord | null> {
    const record = await this.prisma.getExecutionClient().supplierOffering.findFirst({
      where: {
        tenantId,
        id: supplierOfferingId
      }
    })

    return record ? PrismaSrmRecordMapper.toSupplierOffering(record) : null
  }

  async findBySupplierAndItem(
    tenantId: string,
    supplierId: string,
    itemId: string
  ): Promise<SupplierOfferingRecord | null> {
    const record = await this.prisma.getExecutionClient().supplierOffering.findFirst({
      where: {
        tenantId,
        supplierId,
        itemId
      }
    })

    return record ? PrismaSrmRecordMapper.toSupplierOffering(record) : null
  }

  async save(offering: SupplierOfferingRecord): Promise<SupplierOfferingRecord> {
    const saved = await this.prisma.getExecutionClient().supplierOffering.upsert({
      where: {
        tenantId_supplierId_itemId: {
          tenantId: offering.tenantId,
          supplierId: offering.supplierId,
          itemId: offering.itemId
        }
      },
      create: {
        id: offering.supplierOfferingId,
        tenantId: offering.tenantId,
        supplierId: offering.supplierId,
        itemId: offering.itemId,
        itemCode: offering.itemCode ?? null,
        itemName: offering.itemName ?? null,
        status: PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(offering.status)
      },
      update: {
        itemCode: offering.itemCode ?? null,
        itemName: offering.itemName ?? null,
        status: PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(offering.status)
      }
    })

    return PrismaSrmRecordMapper.toSupplierOffering(saved)
  }

  async listBySupplierId(
    tenantId: string,
    supplierId: string,
    status?: SupplierOfferingStatus,
    page = 1,
    pageSize = 20
  ): Promise<PageResult<SupplierOfferingRecord>> {
    const where: Prisma.SupplierOfferingWhereInput = {
      tenantId,
      supplierId,
      status: status ? PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(status) : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().supplierOffering.count({ where }),
      this.prisma.getExecutionClient().supplierOffering.findMany({
        where,
        orderBy: {
          itemId: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaSrmRecordMapper.toSupplierOffering(item)),
      total,
      page,
      pageSize
    }
  }

  async listByItemId(
    tenantId: string,
    itemId: string,
    status?: SupplierOfferingStatus,
    page = 1,
    pageSize = 20
  ): Promise<PageResult<SupplierOfferingRecord>> {
    const where: Prisma.SupplierOfferingWhereInput = {
      tenantId,
      itemId,
      status: status ? PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(status) : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().supplierOffering.count({ where }),
      this.prisma.getExecutionClient().supplierOffering.findMany({
        where,
        orderBy: {
          supplierId: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaSrmRecordMapper.toSupplierOffering(item)),
      total,
      page,
      pageSize
    }
  }

  async hasActiveBySupplierId(tenantId: string, supplierId: string): Promise<boolean> {
    const count = await this.prisma.getExecutionClient().supplierOffering.count({
      where: {
        tenantId,
        supplierId,
        status: PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(SupplierOfferingStatus.ACTIVE)
      }
    })

    return count > 0
  }
}
