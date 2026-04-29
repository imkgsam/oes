import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../prisma/generated/prisma'
import { Item } from '../../../domain/aggregates/item.aggregate'
import { ItemRepository, SearchItemsInput, SearchItemsResult } from '../../../domain/repositories/item.repository'
import { ItemCategoryStatus } from '../../../domain/value-objects/item-category.value-objects'
import {
  ItemCapabilities,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '../../../domain/value-objects/item.value-objects'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaItemRepository persists item aggregates and catalog searches through Prisma. */
@Injectable()
export class PrismaItemRepository implements ItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, itemId: string): Promise<Item | null> {
    const record = await this.prisma.getExecutionClient().item.findFirst({
      where: {
        tenantId,
        id: itemId
      },
      include: {
        primaryCategory: true
      }
    })

    return record ? toItem(record) : null
  }

  async findByIds(tenantId: string, itemIds: string[]): Promise<Item[]> {
    if (itemIds.length === 0) {
      return []
    }

    const records = await this.prisma.getExecutionClient().item.findMany({
      where: {
        tenantId,
        id: {
          in: itemIds
        }
      },
      include: {
        primaryCategory: true
      }
    })
    const itemMap = new Map(records.map((record) => [record.id, toItem(record)]))

    return itemIds.map((itemId) => itemMap.get(itemId)).filter(Boolean) as Item[]
  }

  async findByCode(tenantId: string, itemCode: string): Promise<Item | null> {
    const record = await this.prisma.getExecutionClient().item.findFirst({
      where: {
        tenantId,
        itemCode
      },
      include: {
        primaryCategory: true
      }
    })

    return record ? toItem(record) : null
  }

  async save(item: Item): Promise<Item> {
    const state = item.toPrimitives()
    const record = await this.prisma.getExecutionClient().item.upsert({
      where: {
        id: state.id
      },
      create: {
        id: state.id,
        tenantId: state.tenantId,
        itemCode: state.itemCode,
        itemName: state.itemName,
        structureType: state.structureType,
        natureType: state.natureType,
        status: state.status,
        primaryCategoryId: state.primaryCategory?.categoryId,
        sellable: state.capabilities.sellable,
        purchasable: state.capabilities.purchasable,
        stockable: state.capabilities.stockable,
        manufacturable: state.capabilities.manufacturable
      },
      update: {
        itemCode: state.itemCode,
        itemName: state.itemName,
        status: state.status,
        primaryCategoryId: state.primaryCategory?.categoryId,
        sellable: state.capabilities.sellable,
        purchasable: state.capabilities.purchasable,
        stockable: state.capabilities.stockable,
        manufacturable: state.capabilities.manufacturable
      },
      include: {
        primaryCategory: true
      }
    })

    return toItem(record)
  }

  async search(input: SearchItemsInput): Promise<SearchItemsResult> {
    const where: Prisma.ItemWhereInput = {
      tenantId: input.tenantId
    }

    if (input.keyword) {
      where.OR = [
        {
          itemCode: {
            contains: input.keyword,
            mode: 'insensitive'
          }
        },
        {
          itemName: {
            contains: input.keyword,
            mode: 'insensitive'
          }
        }
      ]
    }

    if (input.structureType) {
      where.structureType = input.structureType
    }

    if (input.natureType) {
      where.natureType = input.natureType
    }

    if (input.status) {
      where.status = input.status
    }

    if (input.categoryIds && input.categoryIds.length > 0) {
      where.primaryCategoryId = {
        in: input.categoryIds
      }
    } else if (input.categoryId) {
      where.primaryCategoryId = input.categoryId
    }

    if (input.capabilityFilters) {
      if (input.capabilityFilters.sellable !== undefined) {
        where.sellable = input.capabilityFilters.sellable
      }
      if (input.capabilityFilters.purchasable !== undefined) {
        where.purchasable = input.capabilityFilters.purchasable
      }
      if (input.capabilityFilters.stockable !== undefined) {
        where.stockable = input.capabilityFilters.stockable
      }
      if (input.capabilityFilters.manufacturable !== undefined) {
        where.manufacturable = input.capabilityFilters.manufacturable
      }
    }

    const queryArgs = {
      where,
      include: {
        primaryCategory: true
      },
      orderBy: [{ itemCode: 'asc' as const }, { id: 'asc' as const }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    }

    const [total, records] = this.prisma.hasActiveTransaction()
      ? await Promise.all([
          this.prisma.getExecutionClient().item.count({ where }),
          this.prisma.getExecutionClient().item.findMany(queryArgs)
        ])
      : await this.prisma.$transaction([
          this.prisma.item.count({ where }),
          this.prisma.item.findMany(queryArgs)
        ])

    return {
      items: records.map(toItem),
      total,
      page: input.page,
      pageSize: input.pageSize
    }
  }
}

/** toItem maps one Prisma row back into the domain aggregate shape. */
function toItem(record: {
  id: string
  tenantId: string
  itemCode: string
  itemName: string
  structureType: string
  natureType: string
  status: string
  sellable: boolean
  purchasable: boolean
  stockable: boolean
  manufacturable: boolean
  primaryCategory?: {
    id: string
    categoryCode: string
    categoryName: string
    status: string
  } | null
}): Item {
  return Item.reconstitute({
    id: record.id,
    tenantId: record.tenantId,
    itemCode: record.itemCode,
    itemName: record.itemName,
    structureType: record.structureType as ItemStructureType,
    natureType: record.natureType as ItemNatureType,
    status: record.status as ItemStatus,
    capabilities: ItemCapabilities.from({
      sellable: record.sellable,
      purchasable: record.purchasable,
      stockable: record.stockable,
      manufacturable: record.manufacturable
    }),
    primaryCategory: record.primaryCategory
      ? {
          categoryId: record.primaryCategory.id,
          categoryCode: record.primaryCategory.categoryCode,
          categoryName: record.primaryCategory.categoryName,
          status: record.primaryCategory.status as ItemCategoryStatus
        }
      : undefined
  })
}
