import { randomUUID } from 'node:crypto'
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
import { CreateItemCategoryCommand } from './create-item-category.command'

/** CreateItemCategoryHandler creates tenant-scoped lightweight category nodes while preserving parent and code validity. */
@Injectable()
@CommandHandler(CreateItemCategoryCommand)
export class CreateItemCategoryHandler implements ICommandHandler<CreateItemCategoryCommand, ItemCategory> {
  constructor(
    @Inject(TOKENS.ITEM_CATEGORY_REPOSITORY)
    private readonly itemCategoryRepository: ItemCategoryRepository
  ) {}

  async execute(command: CreateItemCategoryCommand): Promise<ItemCategory> {
    assertRequired(command.tenantId, 'tenantId')
    assertRequired(command.categoryCode, 'categoryCode')
    assertRequired(command.categoryName, 'categoryName')

    const parentCategoryId = normalizeOptional(command.parentCategoryId)
    if (parentCategoryId) {
      const parentCategory = await this.itemCategoryRepository.findById(command.tenantId, parentCategoryId)
      if (!parentCategory) {
        throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
          categoryId: parentCategoryId
        })
      }
    }

    const existing = await this.itemCategoryRepository.findByCode(command.tenantId, command.categoryCode)
    if (existing) {
      throw ExceptionFactory.domain(ITEM_MASTER_ALREADY_EXISTS, {
        field: 'categoryCode'
      })
    }

    const category = ItemCategory.create({
      id: randomUUID(),
      tenantId: command.tenantId,
      categoryCode: command.categoryCode,
      categoryName: command.categoryName,
      parentCategoryId
    })

    return this.itemCategoryRepository.save(category)
  }
}

/** assertRequired rejects blank command fields before repository access. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}

/** normalizeOptional converts blank parent ids into root-node creation. */
function normalizeOptional(value?: string): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}
