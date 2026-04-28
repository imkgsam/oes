import { Injectable } from '@nestjs/common'
import { PageResult, QuoteVersionListInput, QuoteVersionRecord } from '../../../domain/models/sales-records'
import { QuoteVersionRepository } from '../../../domain/repositories/quote-version.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaSalesRecordMapper } from './prisma-sales-record.mapper'

/** PrismaQuoteVersionRepository persists immutable published quote baselines and paged history reads. */
@Injectable()
export class PrismaQuoteVersionRepository implements QuoteVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextVersionNo(tenantId: string, quoteId: string): Promise<number> {
    const total = await this.prisma.getExecutionClient().salesQuoteVersion.count({
      where: {
        tenantId,
        quoteId
      }
    })

    return total + 1
  }

  async findById(tenantId: string, quoteVersionId: string): Promise<QuoteVersionRecord | null> {
    const record = await this.prisma.getExecutionClient().salesQuoteVersion.findFirst({
      where: {
        tenantId,
        id: quoteVersionId
      },
      include: PrismaSalesRecordMapper.quoteVersionIncludeValue()
    })

    return record ? PrismaSalesRecordMapper.toQuoteVersion(record) : null
  }

  async save(quoteVersion: QuoteVersionRecord): Promise<QuoteVersionRecord> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.salesQuoteVersion.upsert({
        where: {
          id: quoteVersion.id
        },
        create: {
          id: quoteVersion.id,
          quoteId: quoteVersion.quoteId,
          quoteNo: quoteVersion.quoteNo,
          versionNo: quoteVersion.versionNo,
          tenantId: quoteVersion.tenantId,
          customerTenantPartyId: quoteVersion.customerTenantPartyId,
          publishedAt: new Date(quoteVersion.publishedAt)
        },
        update: {
          quoteId: quoteVersion.quoteId,
          quoteNo: quoteVersion.quoteNo,
          versionNo: quoteVersion.versionNo,
          customerTenantPartyId: quoteVersion.customerTenantPartyId,
          publishedAt: new Date(quoteVersion.publishedAt)
        }
      })

      await client.salesQuoteVersionLine.deleteMany({
        where: {
          quoteVersionId: quoteVersion.id
        }
      })

      if (quoteVersion.lines.length > 0) {
        await client.salesQuoteVersionLine.createMany({
          data: quoteVersion.lines.map((line) => ({
            id: line.quoteLineId,
            tenantId: quoteVersion.tenantId,
            quoteVersionId: quoteVersion.id,
            lineNo: line.lineNo,
            itemId: line.itemId,
            itemSnapshot: PrismaSalesRecordMapper.toInputJson(line.itemSnapshot),
            salesConfigSnapshot: PrismaSalesRecordMapper.toInputJson(line.salesConfigSnapshot),
            packagingRequirementSnapshot: PrismaSalesRecordMapper.toInputJson(
              line.packagingRequirementSnapshot
            ),
            priceQuantityDeliverySnapshot: PrismaSalesRecordMapper.toInputJson(
              line.priceQuantityDeliverySnapshot
            ),
            customerItemSnapshot: PrismaSalesRecordMapper.toInputJson(line.customerItemSnapshot)
          }))
        })
      }

      const saved = await client.salesQuoteVersion.findUniqueOrThrow({
        where: {
          id: quoteVersion.id
        },
        include: PrismaSalesRecordMapper.quoteVersionIncludeValue()
      })

      return PrismaSalesRecordMapper.toQuoteVersion(saved)
    })
  }

  async listByQuoteId(input: QuoteVersionListInput): Promise<PageResult<QuoteVersionRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where = {
      tenantId: input.tenantId,
      quoteId: input.quoteId
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().salesQuoteVersion.count({ where }),
      this.prisma.getExecutionClient().salesQuoteVersion.findMany({
        where,
        include: PrismaSalesRecordMapper.quoteVersionIncludeValue(),
        orderBy: {
          versionNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaSalesRecordMapper.toQuoteVersion(item)),
      total,
      page,
      pageSize
    }
  }
}
