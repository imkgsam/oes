import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { ITEM_MASTER_INVALID_ARGUMENT } from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { BatchGetItemsQuery } from './batch-get-items.query'

export interface BatchGetItemsResult {
  items: Item[]
  missingItemIds: string[]
}

/** BatchGetItemsHandler preserves normal partial-miss semantics instead of escalating missing ids to errors. */
@Injectable()
@QueryHandler(BatchGetItemsQuery)
export class BatchGetItemsHandler implements IQueryHandler<BatchGetItemsQuery, BatchGetItemsResult> {
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(query: BatchGetItemsQuery): Promise<BatchGetItemsResult> {
    assertRequired(query.tenantId, 'tenantId')
    if (!Array.isArray(query.itemIds)) {
      throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, {
        field: 'itemIds'
      })
    }

    if (query.itemIds.length === 0) {
      return {
        items: [],
        missingItemIds: []
      }
    }

    const items = await this.itemRepository.findByIds(query.tenantId, query.itemIds)
    const foundIds = new Set(items.map((item) => item.id))

    return {
      items,
      missingItemIds: query.itemIds.filter((itemId) => !foundIds.has(itemId))
    }
  }
}

/** assertRequired rejects blank query coordinates before repository access. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
