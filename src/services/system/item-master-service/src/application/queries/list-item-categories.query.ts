import { Allow } from 'class-validator'

/** ListItemCategoriesQuery captures the phase 1 lightweight category-tree listing intent. */
export class ListItemCategoriesQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    parentCategoryId?: string
  }

  constructor(input: { tenantId: string; parentCategoryId?: string }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get parentCategoryId(): string | undefined {
    return this.input.parentCategoryId
  }
}
