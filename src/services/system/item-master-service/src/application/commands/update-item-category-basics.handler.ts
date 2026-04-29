import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_ALREADY_EXISTS,
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { ItemCategory } from '../../domain/aggregates/item-category.aggregate'
import { ItemCategoryRepository } from '../../domain/repositories/item-category.repository'
import { UpdateItemCategoryBasicsCommand } from './update-item-category-basics.command'

/** UpdateItemCategoryBasicsHandler updates only code and name while preserving the frozen tree structure. */
@Injectable()
@CommandHandler(UpdateItemCategoryBasicsCommand)
export class UpdateItemCategoryBasicsHandler
  implements ICommandHandler<UpdateItemCategoryBasicsCommand, ItemCategory>
{
  constructor(
    @Inject(TOKENS.ITEM_CATEGORY_REPOSITORY)
    private readonly itemCategoryRepository: ItemCategoryRepository
  ) {}

  async execute(command: UpdateItemCategoryBasicsCommand): Promise<ItemCategory> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.categoryId, 'categoryId')
    assertRequired(command.categoryCode, 'categoryCode')
    assertRequired(command.categoryName, 'categoryName')

    const category = await this.itemCategoryRepository.findById(command.tenantId, command.categoryId)
    if (!category) {
      throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
        categoryId: command.categoryId
      })
    }

    const existing = await this.itemCategoryRepository.findByCode(command.tenantId, command.categoryCode)
    if (existing && existing.id !== category.id) {
      throw ExceptionFactory.domain(ITEM_MASTER_ALREADY_EXISTS, {
        field: 'categoryCode'
      })
    }

    category.updateBasics({
      categoryCode: command.categoryCode,
      categoryName: command.categoryName
    })

    return this.itemCategoryRepository.save(category)
  }
}

/** assertRequired rejects blank update fields before category business logic runs. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}
