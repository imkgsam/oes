import { Allow } from 'class-validator'

/** SetItemPrimaryCategoryCommand captures the phase 1 single-value primary-category assignment intent. */
export class SetItemPrimaryCategoryCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    itemId: string
    categoryId?: string
  }

  constructor(input: { tenantId: string; itemId: string; categoryId?: string }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get itemId(): string {
    return this.input.itemId
  }

  get categoryId(): string | undefined {
    return this.input.categoryId
  }
}
