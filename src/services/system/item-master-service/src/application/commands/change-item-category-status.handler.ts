import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { ItemCategory } from '../../domain/aggregates/item-category.aggregate'
import { ItemCategoryRepository } from '../../domain/repositories/item-category.repository'
import { ChangeItemCategoryStatusCommand } from './change-item-category-status.command'

/** ChangeItemCategoryStatusHandler switches the minimal category lifecycle summary and keeps no-op transitions stable. */
@Injectable()
@CommandHandler(ChangeItemCategoryStatusCommand)
export class ChangeItemCategoryStatusHandler
  implements ICommandHandler<ChangeItemCategoryStatusCommand, ItemCategory>
{
  constructor(
    @Inject(TOKENS.ITEM_CATEGORY_REPOSITORY)
    private readonly itemCategoryRepository: ItemCategoryRepository
  ) {}

  async execute(command: ChangeItemCategoryStatusCommand): Promise<ItemCategory> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.categoryId, 'categoryId')

    const category = await this.itemCategoryRepository.findById(command.tenantId, command.categoryId)
    if (!category) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        categoryId: command.categoryId
      })
    }

    if (category.status === command.targetStatus) {
      return category
    }

    category.changeStatus(command.targetStatus)
    return this.itemCategoryRepository.save(category)
  }
}

/** assertRequired rejects missing category status transition coordinates. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
