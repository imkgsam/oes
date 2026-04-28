export interface ItemCompositionRecord {
    parentItemId: string;
    componentItemId: string;
    sortOrder: number;
}
/** ItemCompositionRepository stores the full replacement bundle-to-component relation set. */
export interface ItemCompositionRepository {
    replaceForParent(tenantId: string, parentItemId: string, componentItemIds: string[]): Promise<ItemCompositionRecord[]>;
    listByParentId(tenantId: string, parentItemId: string): Promise<ItemCompositionRecord[]>;
}
