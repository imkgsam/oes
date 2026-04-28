import { Injectable } from '@nestjs/common'
import { CustomerAddressRecord } from '../../../domain/models/crm-records'
import { CustomerAddressRepository } from '../../../domain/repositories/customer-address.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaCrmRecordMapper } from './prisma-crm-record.mapper'

/** PrismaCustomerAddressRepository persists CRM business-address relationship records in PostgreSQL. */
@Injectable()
export class PrismaCustomerAddressRepository implements CustomerAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    tenantId: string,
    customerAccountId: string,
    customerAddressId: string
  ): Promise<CustomerAddressRecord | null> {
    const record = await this.prisma.getExecutionClient().customerAddress.findFirst({
      where: {
        tenantId,
        customerAccountId,
        id: customerAddressId
      }
    })

    return record ? PrismaCrmRecordMapper.toCustomerAddress(record) : null
  }

  async save(address: CustomerAddressRecord): Promise<CustomerAddressRecord> {
    const record = await this.prisma.getExecutionClient().customerAddress.upsert({
      where: {
        id: address.customerAddressId
      },
      create: {
        id: address.customerAddressId,
        tenantId: address.tenantId,
        customerAccountId: address.customerAccountId,
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

    return PrismaCrmRecordMapper.toCustomerAddress(record)
  }

  async listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerAddressRecord[]> {
    const items = await this.prisma.getExecutionClient().customerAddress.findMany({
      where: {
        tenantId,
        customerAccountId
      },
      orderBy: {
        label: 'asc'
      }
    })

    return items.map((item) => PrismaCrmRecordMapper.toCustomerAddress(item))
  }
}
