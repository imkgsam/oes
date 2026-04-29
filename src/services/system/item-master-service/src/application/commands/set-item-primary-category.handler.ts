import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemCategoryRepository } from '../../domain/repositories/item-category.repository'
import { ItemRepository } from '../../domain/repositories/item.repository'
import { SetItemPrimaryCategoryCommand } from './set-item-primary-category.command'

/** SetItemPrimaryCategoryHandler maintains the phase 1 single-value primary-category association on Item. */
@Injectable()
@CommandHandler(SetItemPrimaryCategoryCommand)
export class SetItemPrimaryCategoryHandler implements ICommandHandler<SetItemPrimaryCategoryCommand, Item> {
  constructor(
    @Inject(TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
    @Inject(TOKENS.ITEM_CATEGORY_REPOSITORY)
    private readonly itemCategoryRepository: ItemCategoryRepository
  ) {}

  async execute(command: SetItemPrimaryCategoryCommand): Promise<Item> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.itemId, 'itemId')

    const item = await this.itemRepository.findById(command.tenantId, command.itemId)
    if (!item) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        itemId: command.itemId
      })
    }

    const categoryId = normalizeOptional(command.categoryId)
    if (!categoryId) {
      if (!item.primaryCategory) {
        return item
      }

      item.setPrimaryCategory(undefined)
      return this.itemRepository.save(item)
    }

    const category = await this.itemCategoryRepository.findById(command.tenantId, categoryId)
    if (!category) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        categoryId
      })
    }

    if (item.primaryCategory?.categoryId === category.id) {
      return item
    }

    item.setPrimaryCategory(category.toReference())
    return this.itemRepository.save(item)
  }
}

/** assertRequired rejects missing primary-category assignment coordinates. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}

/** normalizeOptional converts blank category ids into a phase 1 clear-primary-category request. */
function normalizeOptional(value?: string): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}
