import { Injectable } from '@nestjs/common'
import { ItemCategory } from '../../../domain/aggregates/item-category.aggregate'
import { ItemCategoryRepository } from '../../../domain/repositories/item-category.repository'
import {
  ItemCategoryStatus,
  ItemCategoryTreeNode
} from '../../../domain/value-objects/item-category.value-objects'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaItemCategoryRepository persists and traverses the lightweight phase 1 item-category tree. */
@Injectable()
export class PrismaItemCategoryRepository implements ItemCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, categoryId: string): Promise<ItemCategory | null> {
    const record = await this.prisma.getExecutionClient().itemCategory.findFirst({
      where: {
        tenantId,
        id: categoryId
      }
    })

    return record ? toItemCategory(record) : null
  }

  async findByCode(tenantId: string, categoryCode: string): Promise<ItemCategory | null> {
    const record = await this.prisma.getExecutionClient().itemCategory.findFirst({
      where: {
        tenantId,
        categoryCode
      }
    })

    return record ? toItemCategory(record) : null
  }

  async save(category: ItemCategory): Promise<ItemCategory> {
    const state = category.toPrimitives()
    const record = await this.prisma.getExecutionClient().itemCategory.upsert({
      where: {
        id: state.id
      },
      create: {
        id: state.id,
        tenantId: state.tenantId,
        categoryCode: state.categoryCode,
        categoryName: state.categoryName,
        parentCategoryId: state.parentCategoryId,
        status: state.status
      },
      update: {
        categoryCode: state.categoryCode,
        categoryName: state.categoryName,
        status: state.status
      }
    })

    return toItemCategory(record)
  }

  async listByParentId(tenantId: string, parentCategoryId?: string): Promise<ItemCategoryTreeNode[]> {
    const records = await this.prisma.getExecutionClient().itemCategory.findMany({
      where: {
        tenantId,
        parentCategoryId: parentCategoryId ?? null
      },
      include: {
        _count: {
          select: {
            children: true
          }
        }
      },
      orderBy: [{ categoryCode: 'asc' }, { id: 'asc' }]
    })

    return records.map((record) => ({
      categoryId: record.id,
      categoryCode: record.categoryCode,
      categoryName: record.categoryName,
      parentCategoryId: record.parentCategoryId ?? undefined,
      status: record.status as ItemCategoryStatus,
      hasChildren: record._count.children > 0
    }))
  }

  async listDescendantIds(tenantId: string, categoryId: string): Promise<string[]> {
    const descendants: string[] = []
    let frontier = [categoryId]

    while (frontier.length > 0) {
      const children = await this.prisma.getExecutionClient().itemCategory.findMany({
        where: {
          tenantId,
          parentCategoryId: {
            in: frontier
          }
        },
        select: {
          id: true
        }
      })

      frontier = children.map((child) => child.id)
      descendants.push(...frontier)
    }

    return descendants
  }
}

/** toItemCategory maps one Prisma category row back into the domain aggregate shape. */
function toItemCategory(record: {
  id: string
  tenantId: string
  categoryCode: string
  categoryName: string
  parentCategoryId: string | null
  status: string
}): ItemCategory {
  return ItemCategory.reconstitute({
    id: record.id,
    tenantId: record.tenantId,
    categoryCode: record.categoryCode,
    categoryName: record.categoryName,
    parentCategoryId: record.parentCategoryId ?? undefined,
    status: record.status as ItemCategoryStatus
  })
}
