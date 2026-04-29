import { Item } from '../aggregates/item.aggregate';
import { ItemCapabilitiesProps, ItemNatureType, ItemStatus, ItemStructureType } from '../value-objects/item.value-objects';
export interface SearchItemsInput {
    tenantId: string;
    keyword?: string;
    structureType?: ItemStructureType;
    natureType?: ItemNatureType;
    capabilityFilters?: Partial<ItemCapabilitiesProps>;
    status?: ItemStatus;
    categoryId?: string;
    includeDescendants?: boolean;
    categoryIds?: string[];
    page: number;
    pageSize: number;
}
export interface SearchItemsResult {
    items: Item[];
    total: number;
    page: number;
    pageSize: number;
}
/** ItemRepository abstracts item aggregate persistence and catalog-style querying. */
export interface ItemRepository {
    findById(tenantId: string, itemId: string): Promise<Item | null>;
    findByIds(tenantId: string, itemIds: string[]): Promise<Item[]>;
    findByCode(tenantId: string, itemCode: string): Promise<Item | null>;
    save(item: Item): Promise<Item>;
    search(input: SearchItemsInput): Promise<SearchItemsResult>;
}
