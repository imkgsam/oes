import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { GetItemQuery } from './get-item.query'

/** GetItemHandler resolves one item summary or raises NOT_FOUND for missing targets. */
@Injectable()
@QueryHandler(GetItemQuery)
export class GetItemHandler implements IQueryHandler<GetItemQuery, Item> {
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository
  ) {}

  async execute(query: GetItemQuery): Promise<Item> {
    assertRequired(query.tenantId, 'tenantId')
    assertRequired(query.itemId, 'itemId')

    const item = await this.itemRepository.findById(query.tenantId, query.itemId)
    if (!item) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: query.itemId
      })
    }

    return item
  }
}

/** assertRequired rejects missing lookup coordinates before repository access. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
