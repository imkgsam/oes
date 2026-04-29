import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../../common/errors/item-master.errors'
import { ItemCategoryRepository } from '../../domain/repositories/item-category.repository'
import { ItemCategoryTreeNode } from '../../domain/value-objects/item-category.value-objects'
import { ListItemCategoriesQuery } from './list-item-categories.query'

export interface ListItemCategoriesResult {
  categories: ItemCategoryTreeNode[]
}

/** ListItemCategoriesHandler returns one tenant-scoped tree layer while preserving normal empty-list semantics. */
@Injectable()
@QueryHandler(ListItemCategoriesQuery)
export class ListItemCategoriesHandler implements IQueryHandler<ListItemCategoriesQuery, ListItemCategoriesResult> {
  constructor(
    @Inject(TOKENS.ITEM_CATEGORY_REPOSITORY)
    private readonly itemCategoryRepository: ItemCategoryRepository
  ) {}

  async execute(query: ListItemCategoriesQuery): Promise<ListItemCategoriesResult> {
    assertRequired(query.tenantId, 'tenantId')
    const parentCategoryId = normalizeOptional(query.parentCategoryId)

    if (parentCategoryId) {
      const parentCategory = await this.itemCategoryRepository.findById(query.tenantId, parentCategoryId)
      if (!parentCategory) {
        throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, {
          categoryId: parentCategoryId
        })
      }
    }

    return {
      categories: await this.itemCategoryRepository.listByParentId(query.tenantId, parentCategoryId)
    }
  }
}

/** assertRequired rejects blank query coordinates before repository access. */
function assertRequired(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(ITEM_MASTER_INVALID_ARGUMENT, { field })
  }
}

/** normalizeOptional converts blank parent ids into root-level traversal. */
function normalizeOptional(value?: string): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}
