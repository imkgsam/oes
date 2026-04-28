import { Injectable } from '@nestjs/common'
import { SupplierContactRecord } from '../../../domain/models/srm-records'
import { SupplierContactRepository } from '../../../domain/repositories/supplier-contact.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaSrmRecordMapper } from './prisma-srm-record.mapper'

/** PrismaSupplierContactRepository persists SRM business-contact relationship records in PostgreSQL. */
@Injectable()
export class PrismaSupplierContactRepository implements SupplierContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    tenantId: string,
    supplierId: string,
    supplierContactId: string
  ): Promise<SupplierContactRecord | null> {
    const record = await this.prisma.getExecutionClient().supplierContact.findFirst({
      where: {
        tenantId,
        supplierId,
        id: supplierContactId
      }
    })

    return record ? PrismaSrmRecordMapper.toSupplierContact(record) : null
  }

  async save(contact: SupplierContactRecord): Promise<SupplierContactRecord> {
    const record = await this.prisma.getExecutionClient().supplierContact.upsert({
      where: {
        id: contact.supplierContactId
      },
      create: {
        id: contact.supplierContactId,
        tenantId: contact.tenantId,
        supplierId: contact.supplierId,
        displayName: contact.displayName,
        roleTitle: contact.roleTitle ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        isPrimaryContact: contact.isPrimaryContact,
        isActive: contact.isActive
      },
      update: {
        displayName: contact.displayName,
        roleTitle: contact.roleTitle ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        isPrimaryContact: contact.isPrimaryContact,
        isActive: contact.isActive
      }
    })

    return PrismaSrmRecordMapper.toSupplierContact(record)
  }

  async listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierContactRecord[]> {
    const items = await this.prisma.getExecutionClient().supplierContact.findMany({
      where: {
        tenantId,
        supplierId
      },
      orderBy: {
        displayName: 'asc'
      }
    })

    return items.map((item) => PrismaSrmRecordMapper.toSupplierContact(item))
  }
}
