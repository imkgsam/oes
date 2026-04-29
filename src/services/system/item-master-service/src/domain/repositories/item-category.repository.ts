import { ItemCategory } from '../aggregates/item-category.aggregate'
import { ItemCategoryTreeNode } from '../value-objects/item-category.value-objects'

/** ItemCategoryRepository abstracts lightweight category-tree persistence and traversal for phase 1. */
export interface ItemCategoryRepository {
  findById(tenantId: string, categoryId: string): Promise<ItemCategory | null>
  findByCode(tenantId: string, categoryCode: string): Promise<ItemCategory | null>
  save(category: ItemCategory): Promise<ItemCategory>
  listByParentId(tenantId: string, parentCategoryId?: string): Promise<ItemCategoryTreeNode[]>
  listDescendantIds(tenantId: string, categoryId: string): Promise<string[]>
}
