import { Allow } from 'class-validator'

/** CreateItemCategoryCommand captures phase 1 lightweight category-node creation intent. */
export class CreateItemCategoryCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId?: string
  }

  constructor(input: {
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId?: string
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get categoryCode(): string {
    return this.input.categoryCode
  }

  get categoryName(): string {
    return this.input.categoryName
  }

  get parentCategoryId(): string | undefined {
    return this.input.parentCategoryId
  }
}
