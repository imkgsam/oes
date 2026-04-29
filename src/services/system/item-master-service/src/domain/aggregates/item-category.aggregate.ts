import { ExceptionFactory } from '@oes/common/exceptions'
import { ITEM_MASTER_INVALID_ARGUMENT } from '../../common/errors/item-master.errors'
import {
  ItemCategoryReference,
  ItemCategoryStatus
} from '../value-objects/item-category.value-objects'

export interface ItemCategoryState {
  id: string
  tenantId: string
  categoryCode: string
  categoryName: string
  parentCategoryId?: string
  status: ItemCategoryStatus
}

/** ItemCategory models the tenant-scoped lightweight category tree node used by phase 1 item browsing. */
export class ItemCategory {
  private constructor(private readonly state: ItemCategoryState) {}

  /** create builds a new active category node with an optional parent relation. */
  static create(input: {
    id: string
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId?: string
  }): ItemCategory {
    assertNonBlank(input.tenantId, 'tenantId')
    assertNonBlank(input.categoryCode, 'categoryCode')
    assertNonBlank(input.categoryName, 'categoryName')

    return new ItemCategory({
      id: input.id,
      tenantId: input.tenantId.trim(),
      categoryCode: input.categoryCode.trim(),
      categoryName: input.categoryName.trim(),
      parentCategoryId: normalizeOptional(input.parentCategoryId),
      status: ItemCategoryStatus.ACTIVE
    })
  }

  /** reconstitute rebuilds a category aggregate from validated persistence state. */
  static reconstitute(state: ItemCategoryState): ItemCategory {
    return new ItemCategory({
      ...state,
      parentCategoryId: normalizeOptional(state.parentCategoryId)
    })
  }

  get id(): string {
    return this.state.id
  }

  get tenantId(): string {
    return this.state.tenantId
  }

  get categoryCode(): string {
    return this.state.categoryCode
  }

  get categoryName(): string {
    return this.state.categoryName
  }

  get parentCategoryId(): string | undefined {
    return this.state.parentCategoryId
  }

  get status(): ItemCategoryStatus {
    return this.state.status
  }

  /** updateBasics replaces the only mutable phase 1 category fields: code and name. */
  updateBasics(input: { categoryCode: string; categoryName: string }): ItemCategory {
    assertNonBlank(input.categoryCode, 'categoryCode')
    assertNonBlank(input.categoryName, 'categoryName')
    this.state.categoryCode = input.categoryCode.trim()
    this.state.categoryName = input.categoryName.trim()
    return this
  }

  /** changeStatus switches the minimal phase 1 category lifecycle summary. */
  changeStatus(targetStatus: ItemCategoryStatus): ItemCategory {
    this.state.status = targetStatus
    return this
  }

  /** toReference renders the summary shape reused by item reads and category responses. */
  toReference(): ItemCategoryReference {
    return {
      categoryId: this.state.id,
      categoryCode: this.state.categoryCode,
      categoryName: this.state.categoryName,
      status: this.state.status
    }
  }

  /** toPrimitives exposes aggregate state for persistence. */
  toPrimitives(): ItemCategoryState {
    return {
      ...this.state
    }
  }
}

/** assertNonBlank rejects empty strings before they can become category state. */
function assertNonBlank(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.domain(ITEM_MASTER_INVALID_ARGUMENT, {
      field
    })
  }
}

/** normalizeOptional converts blank strings into absent parent-category references. */
function normalizeOptional(value?: string): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}
