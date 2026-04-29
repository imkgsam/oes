/** ItemCategoryStatus keeps the phase 1 category lifecycle to the same active or inactive summary. */
export enum ItemCategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface ItemCategoryReference {
  categoryId: string
  categoryCode: string
  categoryName: string
  status: ItemCategoryStatus
}

/** ItemCategoryTreeNode represents one lightweight category tree row with direct-child presence metadata. */
export interface ItemCategoryTreeNode extends ItemCategoryReference {
  parentCategoryId?: string
  hasChildren: boolean
}
