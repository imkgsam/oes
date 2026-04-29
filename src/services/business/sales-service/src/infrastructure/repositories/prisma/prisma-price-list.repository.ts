import { Injectable } from '@nestjs/common'
import {
  PriceListLineListInput,
  PriceListRecord,
  PriceListSearchInput
} from '../../../domain/models/pricing-records'
import { PageResult } from '../../../domain/models/sales-records'
import { PriceListRepository } from '../../../domain/repositories/price-list.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaPricingRecordMapper } from './prisma-pricing-record.mapper'

/** PrismaPriceListRepository persists mutable sales price lists and their current line baselines in PostgreSQL. */
@Injectable()
export class PrismaPriceListRepository implements PriceListRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, priceListId: string): Promise<PriceListRecord | null> {
    const record = await this.prisma.getExecutionClient().salesPriceList.findFirst({
      where: {
        tenantId,
        id: priceListId
      },
      include: PrismaPricingRecordMapper.priceListIncludeValue()
    })

    return record ? PrismaPricingRecordMapper.toPriceList(record) : null
  }

  async save(record: PriceListRecord): Promise<PriceListRecord> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.salesPriceList.upsert({
        where: {
          id: record.id
        },
        create: {
          id: record.id,
          tenantId: record.tenantId,
          priceListName: record.priceListName,
          priceListType: PrismaPricingRecordMapper.toPersistedPriceListType(record.priceListType),
          status: PrismaPricingRecordMapper.toPersistedPriceListStatus(record.status),
          currencyCode: record.currencyCode,
          effectiveFrom: new Date(record.effectiveFrom),
          effectiveTo: record.effectiveTo ? new Date(record.effectiveTo) : null
        },
        update: {
          priceListName: record.priceListName,
          priceListType: PrismaPricingRecordMapper.toPersistedPriceListType(record.priceListType),
          status: PrismaPricingRecordMapper.toPersistedPriceListStatus(record.status),
          currencyCode: record.currencyCode,
          effectiveFrom: new Date(record.effectiveFrom),
          effectiveTo: record.effectiveTo ? new Date(record.effectiveTo) : null
        }
      })

      await client.salesPriceListLine.deleteMany({
        where: {
          priceListId: record.id
        }
      })

      if (record.lines.length > 0) {
        await client.salesPriceListLine.createMany({
          data: record.lines.map((line) => ({
            id: line.priceListLineId,
            tenantId: record.tenantId,
            priceListId: record.id,
            lineNo: line.lineNo,
            itemId: line.itemId,
            brandKey: line.brandKey ?? null,
            priceSnapshot: PrismaPricingRecordMapper.toInputJson(line.priceSnapshot),
            moqSnapshot: PrismaPricingRecordMapper.toInputJson(line.moqSnapshot)
          }))
        })
      }

      const saved = await client.salesPriceList.findUniqueOrThrow({
        where: {
          id: record.id
        },
        include: PrismaPricingRecordMapper.priceListIncludeValue()
      })

      return PrismaPricingRecordMapper.toPriceList(saved)
    })
  }

  async search(input: PriceListSearchInput): Promise<PageResult<PriceListRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const effectiveAt = input.effectiveAt ? new Date(input.effectiveAt) : null
    const where = {
      tenantId: input.tenantId,
      priceListType: input.priceListType
        ? PrismaPricingRecordMapper.toPersistedPriceListType(input.priceListType)
        : undefined,
      status: input.status ? PrismaPricingRecordMapper.toPersistedPriceListStatus(input.status) : undefined,
      currencyCode: input.currencyCode,
      priceListName: input.keyword
        ? {
            contains: input.keyword,
            mode: 'insensitive' as const
          }
        : undefined,
      effectiveFrom: effectiveAt
        ? {
            lte: effectiveAt
          }
        : undefined,
      OR: effectiveAt
        ? [
            {
              effectiveTo: null
            },
            {
              effectiveTo: {
                gte: effectiveAt
              }
            }
          ]
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().salesPriceList.count({ where }),
      this.prisma.getExecutionClient().salesPriceList.findMany({
        where,
        include: PrismaPricingRecordMapper.priceListIncludeValue(),
        orderBy: {
          priceListName: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaPricingRecordMapper.toPriceList(item)),
      total,
      page,
      pageSize
    }
  }

  async listLines(input: PriceListLineListInput): Promise<PageResult<PriceListRecord['lines'][number]>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().salesPriceListLine.count({
        where: {
          tenantId: input.tenantId,
          priceListId: input.priceListId,
          itemId: input.itemId
        }
      }),
      this.prisma.getExecutionClient().salesPriceListLine.findMany({
        where: {
          tenantId: input.tenantId,
          priceListId: input.priceListId,
          itemId: input.itemId
        },
        orderBy: {
          lineNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => ({
        priceListLineId: item.id,
        lineNo: item.lineNo,
        itemId: item.itemId,
        brandKey: item.brandKey ?? '',
        priceSnapshot: structuredClone(item.priceSnapshot) as never,
        moqSnapshot: structuredClone(item.moqSnapshot) as never
      })),
      total,
      page,
      pageSize
    }
  }
}
