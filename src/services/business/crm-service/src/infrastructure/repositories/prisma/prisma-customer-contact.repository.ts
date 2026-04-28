import { Injectable } from '@nestjs/common'
import { CustomerContactRecord } from '../../../domain/models/crm-records'
import { CustomerContactRepository } from '../../../domain/repositories/customer-contact.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaCrmRecordMapper } from './prisma-crm-record.mapper'

/** PrismaCustomerContactRepository persists CRM business-contact relationship records in PostgreSQL. */
@Injectable()
export class PrismaCustomerContactRepository implements CustomerContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    tenantId: string,
    customerAccountId: string,
    customerContactId: string
  ): Promise<CustomerContactRecord | null> {
    const record = await this.prisma.getExecutionClient().customerContact.findFirst({
      where: {
        tenantId,
        customerAccountId,
        id: customerContactId
      }
    })

    return record ? PrismaCrmRecordMapper.toCustomerContact(record) : null
  }

  async save(contact: CustomerContactRecord): Promise<CustomerContactRecord> {
    const record = await this.prisma.getExecutionClient().customerContact.upsert({
      where: {
        id: contact.customerContactId
      },
      create: {
        id: contact.customerContactId,
        tenantId: contact.tenantId,
        customerAccountId: contact.customerAccountId,
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

    return PrismaCrmRecordMapper.toCustomerContact(record)
  }

  async listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerContactRecord[]> {
    const items = await this.prisma.getExecutionClient().customerContact.findMany({
      where: {
        tenantId,
        customerAccountId
      },
      orderBy: {
        displayName: 'asc'
      }
    })

    return items.map((item) => PrismaCrmRecordMapper.toCustomerContact(item))
  }
}
