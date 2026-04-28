import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_FAILED_PRECONDITION,
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemCompositionRepository } from '../../domain/repositories/item-composition.repository'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { GetItemCompositionQuery } from './get-item-composition.query'

export interface GetItemCompositionResult {
  itemId: string
  components: Item[]
}

/** GetItemCompositionHandler reads bundle composition and preserves the empty-components success shape. */
@Injectable()
@QueryHandler(GetItemCompositionQuery)
export class GetItemCompositionHandler
  implements IQueryHandler<GetItemCompositionQuery, GetItemCompositionResult>
{
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
    @Inject(TOKENS.ITEM_COMPOSITION_REPOSITORY)
    private readonly compositionRepository: ItemCompositionRepository
  ) {}

  async execute(query: GetItemCompositionQuery): Promise<GetItemCompositionResult> {
    assertRequired(query.tenantId, 'tenantId')
    assertRequired(query.itemId, 'itemId')

    const parent = await this.itemRepository.findById(query.tenantId, query.itemId)
    if (!parent) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: query.itemId
      })
    }

    if (!parent.isBundle()) {
      throw ExceptionFactory.domain(ITEM_MASTER_FAILED_PRECONDITION, {
        reason: 'composition parent must be BUNDLE'
      })
    }

    const records = await this.compositionRepository.listByParentId(query.tenantId, query.itemId)
    if (records.length === 0) {
      return {
        itemId: query.itemId,
        components: []
      }
    }

    const componentIds = records
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((record) => record.componentItemId)
    const components = await this.itemRepository.findByIds(query.tenantId, componentIds)
    const componentMap = new Map(components.map((item) => [item.id, item]))

    return {
      itemId: query.itemId,
      components: componentIds.map((componentId) => componentMap.get(componentId)!).filter(Boolean)
    }
  }
}

/** assertRequired rejects missing composition read coordinates. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
