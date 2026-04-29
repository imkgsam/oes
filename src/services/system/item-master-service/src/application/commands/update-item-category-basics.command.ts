import { Allow } from 'class-validator'

/** UpdateItemCategoryBasicsCommand captures the only mutable phase 1 category basic fields. */
export class UpdateItemCategoryBasicsCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    categoryId: string
    categoryCode: string
    categoryName: string
  }

  constructor(input: {
    tenantId: string
    categoryId: string
    categoryCode: string
    categoryName: string
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get categoryId(): string {
    return this.input.categoryId
  }

  get categoryCode(): string {
    return this.input.categoryCode
  }

  get categoryName(): string {
    return this.input.categoryName
  }
}
