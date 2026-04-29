import { Injectable } from '@nestjs/common'
import {
  CustomerPriceAgreementVersionListInput,
  CustomerPriceAgreementVersionRecord,
  SalesCurrencyCode
} from '../../../domain/models/pricing-records'
import { PageResult } from '../../../domain/models/sales-records'
import { CustomerPriceAgreementRepository } from '../../../domain/repositories/customer-price-agreement.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaPricingRecordMapper } from './prisma-pricing-record.mapper'

/** PrismaCustomerPriceAgreementRepository persists versioned customer-specific pricing baselines inside the sales-service database. */
@Injectable()
export class PrismaCustomerPriceAgreementRepository implements CustomerPriceAgreementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByCustomerCurrency(input: {
    tenantId: string
    customerTenantPartyId: string
    currencyCode: SalesCurrencyCode
  }): Promise<CustomerPriceAgreementVersionRecord | null> {
    const record = await this.prisma.getExecutionClient().salesCustomerPriceAgreementVersion.findFirst({
      where: {
        tenantId: input.tenantId,
        customerTenantPartyId: input.customerTenantPartyId,
        currencyCode: input.currencyCode,
        status: 'ACTIVE'
      },
      include: PrismaPricingRecordMapper.customerPriceAgreementVersionIncludeValue(),
      orderBy: {
        versionNo: 'desc'
      }
    })

    return record ? PrismaPricingRecordMapper.toCustomerPriceAgreementVersion(record) : null
  }

  async findHeadByCustomerCurrency(input: {
    tenantId: string
    customerTenantPartyId: string
    currencyCode: SalesCurrencyCode
  }): Promise<CustomerPriceAgreementVersionRecord | null> {
    const records = await this.prisma.getExecutionClient().salesCustomerPriceAgreementVersion.findMany({
      where: {
        tenantId: input.tenantId,
        customerTenantPartyId: input.customerTenantPartyId,
        currencyCode: input.currencyCode
      },
      include: PrismaPricingRecordMapper.customerPriceAgreementVersionIncludeValue(),
      orderBy: {
        versionNo: 'desc'
      },
      take: 5
    })

    const draft = records.find((record) => record.status === 'DRAFT')
    const active = records.find((record) => record.status === 'ACTIVE')
    const head = draft ?? active ?? records[0]
    return head ? PrismaPricingRecordMapper.toCustomerPriceAgreementVersion(head) : null
  }

  async findHeadVersion(
    tenantId: string,
    customerPriceAgreementId: string
  ): Promise<CustomerPriceAgreementVersionRecord | null> {
    const records = await this.prisma.getExecutionClient().salesCustomerPriceAgreementVersion.findMany({
      where: {
        tenantId,
        customerPriceAgreementId
      },
      include: PrismaPricingRecordMapper.customerPriceAgreementVersionIncludeValue(),
      orderBy: {
        versionNo: 'desc'
      },
      take: 5
    })

    const draft = records.find((record) => record.status === 'DRAFT')
    const active = records.find((record) => record.status === 'ACTIVE')
    const head = draft ?? active ?? records[0]
    return head ? PrismaPricingRecordMapper.toCustomerPriceAgreementVersion(head) : null
  }

  async findVersion(
    tenantId: string,
    customerPriceAgreementId: string,
    versionNo: number
  ): Promise<CustomerPriceAgreementVersionRecord | null> {
    const record = await this.prisma.getExecutionClient().salesCustomerPriceAgreementVersion.findFirst({
      where: {
        tenantId,
        customerPriceAgreementId,
        versionNo
      },
      include: PrismaPricingRecordMapper.customerPriceAgreementVersionIncludeValue()
    })

    return record ? PrismaPricingRecordMapper.toCustomerPriceAgreementVersion(record) : null
  }

  async saveVersion(record: CustomerPriceAgreementVersionRecord): Promise<CustomerPriceAgreementVersionRecord> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.salesCustomerPriceAgreementVersion.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          customerPriceAgreementId: record.customerPriceAgreementId,
          tenantId: record.tenantId,
          customerTenantPartyId: record.customerTenantPartyId,
          currencyCode: record.currencyCode,
          versionNo: record.versionNo,
          status: PrismaPricingRecordMapper.toPersistedAgreementStatus(record.status),
          publishedAt: record.publishedAt ? new Date(record.publishedAt) : null
        },
        update: {
          customerTenantPartyId: record.customerTenantPartyId,
          currencyCode: record.currencyCode,
          versionNo: record.versionNo,
          status: PrismaPricingRecordMapper.toPersistedAgreementStatus(record.status),
          publishedAt: record.publishedAt ? new Date(record.publishedAt) : null
        }
      })

      await client.salesCustomerPriceAgreementLine.deleteMany({
        where: {
          customerPriceAgreementVersionId: record.id
        }
      })

      if (record.lines.length > 0) {
        await client.salesCustomerPriceAgreementLine.createMany({
          data: record.lines.map((line) => ({
            id: line.customerPriceAgreementLineId,
            tenantId: record.tenantId,
            customerPriceAgreementVersionId: record.id,
            lineNo: line.lineNo,
            itemId: line.itemId,
            brandKey: line.brandKey ?? null,
            priceSnapshot: PrismaPricingRecordMapper.toInputJson(line.priceSnapshot),
            moqSnapshot: PrismaPricingRecordMapper.toInputJson(line.moqSnapshot)
          }))
        })
      }

      const saved = await client.salesCustomerPriceAgreementVersion.findUniqueOrThrow({
        where: {
          id: record.id
        },
        include: PrismaPricingRecordMapper.customerPriceAgreementVersionIncludeValue()
      })

      return PrismaPricingRecordMapper.toCustomerPriceAgreementVersion(saved)
    })
  }

  async listVersions(
    input: CustomerPriceAgreementVersionListInput
  ): Promise<PageResult<CustomerPriceAgreementVersionRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where = {
      tenantId: input.tenantId,
      customerPriceAgreementId: input.customerPriceAgreementId
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().salesCustomerPriceAgreementVersion.count({ where }),
      this.prisma.getExecutionClient().salesCustomerPriceAgreementVersion.findMany({
        where,
        include: PrismaPricingRecordMapper.customerPriceAgreementVersionIncludeValue(),
        orderBy: {
          versionNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaPricingRecordMapper.toCustomerPriceAgreementVersion(item)),
      total,
      page,
      pageSize
    }
  }
}
