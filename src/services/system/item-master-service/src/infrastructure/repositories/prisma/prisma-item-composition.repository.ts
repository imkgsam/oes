import { Injectable } from '@nestjs/common'
import { ItemCompositionRecord, ItemCompositionRepository } from '../../../domain/repositories/item-composition.repository'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaItemCompositionRepository persists full-replacement bundle composition rows with stable ordering. */
@Injectable()
export class PrismaItemCompositionRepository implements ItemCompositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replaceForParent(
    tenantId: string,
    parentItemId: string,
    componentItemIds: string[]
  ): Promise<ItemCompositionRecord[]> {
    await this.prisma.runInTransaction(async () => {
      await this.prisma.getExecutionClient().itemComposition.deleteMany({
        where: {
          tenantId,
          parentItemId
        }
      })

      if (componentItemIds.length > 0) {
        await this.prisma.getExecutionClient().itemComposition.createMany({
          data: componentItemIds.map((componentItemId, index) => ({
            tenantId,
            parentItemId,
            componentItemId,
            sortOrder: index
          }))
        })
      }
    })

    return this.listByParentId(tenantId, parentItemId)
  }

  async listByParentId(tenantId: string, parentItemId: string): Promise<ItemCompositionRecord[]> {
    const records = await this.prisma.getExecutionClient().itemComposition.findMany({
      where: {
        tenantId,
        parentItemId
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return records.map((record) => ({
      parentItemId: record.parentItemId,
      componentItemId: record.componentItemId,
      sortOrder: record.sortOrder
    }))
  }
}
