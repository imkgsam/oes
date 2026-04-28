import { Injectable } from '@nestjs/common'
import { PageResult, QuoteRecord, QuoteSearchInput } from '../../../domain/models/sales-records'
import { QuoteRepository } from '../../../domain/repositories/quote.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaSalesRecordMapper } from './prisma-sales-record.mapper'

/** PrismaQuoteRepository persists tenant-scoped mutable quote drafts in the sales-service database. */
@Injectable()
export class PrismaQuoteRepository implements QuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextQuoteNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.salesSequenceCounter.findUnique({
        where: {
          tenantId
        }
      })

      if (!existing) {
        await client.salesSequenceCounter.create({
          data: {
            tenantId,
            nextQuoteNo: 2,
            nextSalesOrderNo: 1
          }
        })

        return formatDocumentNo('SQ', 1)
      }

      const updated = await client.salesSequenceCounter.update({
        where: {
          tenantId
        },
        data: {
          nextQuoteNo: {
            increment: 1
          }
        },
        select: {
          nextQuoteNo: true
        }
      })

      return formatDocumentNo('SQ', updated.nextQuoteNo - 1)
    })
  }

  async findById(tenantId: string, quoteId: string): Promise<QuoteRecord | null> {
    const record = await this.prisma.getExecutionClient().salesQuote.findFirst({
      where: {
        tenantId,
        id: quoteId
      },
      include: PrismaSalesRecordMapper.quoteIncludeValue()
    })

    return record ? PrismaSalesRecordMapper.toQuote(record) : null
  }

  async save(quote: QuoteRecord): Promise<QuoteRecord> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.salesQuote.upsert({
        where: {
          id: quote.id
        },
        create: {
          id: quote.id,
          quoteNo: quote.quoteNo,
          tenantId: quote.tenantId,
          customerTenantPartyId: quote.customerTenantPartyId,
          opportunityId: quote.opportunityRef?.opportunityId ?? null,
          opportunityNo: quote.opportunityRef?.opportunityNo ?? null,
          opportunityName: quote.opportunityRef?.opportunityName ?? null,
          status: PrismaSalesRecordMapper.toPersistedQuoteStatus(quote.status),
          latestPublishedVersionId: quote.latestPublishedVersionId ?? null
        },
        update: {
          quoteNo: quote.quoteNo,
          customerTenantPartyId: quote.customerTenantPartyId,
          opportunityId: quote.opportunityRef?.opportunityId ?? null,
          opportunityNo: quote.opportunityRef?.opportunityNo ?? null,
          opportunityName: quote.opportunityRef?.opportunityName ?? null,
          status: PrismaSalesRecordMapper.toPersistedQuoteStatus(quote.status),
          latestPublishedVersionId: quote.latestPublishedVersionId ?? null
        }
      })

      await client.salesQuoteLine.deleteMany({
        where: {
          quoteId: quote.id
        }
      })

      if (quote.lines.length > 0) {
        await client.salesQuoteLine.createMany({
          data: quote.lines.map((line) => ({
            id: line.quoteLineId,
            tenantId: quote.tenantId,
            quoteId: quote.id,
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

      const saved = await client.salesQuote.findUniqueOrThrow({
        where: {
          id: quote.id
        },
        include: PrismaSalesRecordMapper.quoteIncludeValue()
      })

      return PrismaSalesRecordMapper.toQuote(saved)
    })
  }

  async search(input: QuoteSearchInput): Promise<PageResult<QuoteRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where = {
      tenantId: input.tenantId,
      customerTenantPartyId: input.customerTenantPartyId,
      status: input.status
        ? PrismaSalesRecordMapper.toPersistedQuoteStatus(input.status)
        : undefined,
      OR: input.keyword
        ? [
            {
              quoteNo: {
                contains: input.keyword,
                mode: 'insensitive' as const
              }
            },
            {
              customerTenantPartyId: {
                contains: input.keyword,
                mode: 'insensitive' as const
              }
            }
          ]
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().salesQuote.count({ where }),
      this.prisma.getExecutionClient().salesQuote.findMany({
        where,
        include: PrismaSalesRecordMapper.quoteIncludeValue(),
        orderBy: {
          quoteNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaSalesRecordMapper.toQuote(item)),
      total,
      page,
      pageSize
    }
  }
}

/** formatDocumentNo converts one numeric sequence into the frozen sales document summary format. */
function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}
