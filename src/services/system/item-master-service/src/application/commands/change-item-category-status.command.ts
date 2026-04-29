import { Allow } from 'class-validator'
import { ItemCategoryStatus } from '../../domain/value-objects/item-category.value-objects'

/** ChangeItemCategoryStatusCommand captures the minimal phase 1 category status transition intent. */
export class ChangeItemCategoryStatusCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    categoryId: string
    targetStatus: ItemCategoryStatus
  }

  constructor(input: { tenantId: string; categoryId: string; targetStatus: ItemCategoryStatus }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get categoryId(): string {
    return this.input.categoryId
  }

  get targetStatus(): ItemCategoryStatus {
    return this.input.targetStatus
  }
}
