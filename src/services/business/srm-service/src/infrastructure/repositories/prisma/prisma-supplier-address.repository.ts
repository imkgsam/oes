import { Injectable } from '@nestjs/common'
import { SupplierAddressRecord } from '../../../domain/models/srm-records'
import { SupplierAddressRepository } from '../../../domain/repositories/supplier-address.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaSrmRecordMapper } from './prisma-srm-record.mapper'

/** PrismaSupplierAddressRepository persists SRM business-address relationship records in PostgreSQL. */
@Injectable()
export class PrismaSupplierAddressRepository implements SupplierAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    tenantId: string,
    supplierId: string,
    supplierAddressId: string
  ): Promise<SupplierAddressRecord | null> {
    const record = await this.prisma.getExecutionClient().supplierAddress.findFirst({
      where: {
        tenantId,
        supplierId,
        id: supplierAddressId
      }
    })

    return record ? PrismaSrmRecordMapper.toSupplierAddress(record) : null
  }

  async save(address: SupplierAddressRecord): Promise<SupplierAddressRecord> {
    const record = await this.prisma.getExecutionClient().supplierAddress.upsert({
      where: {
        id: address.supplierAddressId
      },
      create: {
        id: address.supplierAddressId,
        tenantId: address.tenantId,
        supplierId: address.supplierId,
        label: address.label,
        countryCode: address.countryCode,
        region: address.region ?? null,
        locality: address.locality ?? null,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? null,
        postalCode: address.postalCode ?? null,
        isPrimaryAddress: address.isPrimaryAddress,
        isActive: address.isActive
      },
      update: {
        label: address.label,
        countryCode: address.countryCode,
        region: address.region ?? null,
        locality: address.locality ?? null,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? null,
        postalCode: address.postalCode ?? null,
        isPrimaryAddress: address.isPrimaryAddress,
        isActive: address.isActive
      }
    })

    return PrismaSrmRecordMapper.toSupplierAddress(record)
  }

  async listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierAddressRecord[]> {
    const items = await this.prisma.getExecutionClient().supplierAddress.findMany({
      where: {
        tenantId,
        supplierId
      },
      orderBy: {
        label: 'asc'
      }
    })

    return items.map((item) => PrismaSrmRecordMapper.toSupplierAddress(item))
  }
}
