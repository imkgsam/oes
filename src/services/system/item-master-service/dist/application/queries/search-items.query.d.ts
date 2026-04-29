import { ItemCapabilitiesProps } from '../../domain/value-objects/item.value-objects';
/** SearchItemsQuery captures the frozen phase 1 catalog search filters and pagination controls. */
export declare class SearchItemsQuery {
    readonly input: {
        tenantId: string;
        keyword?: string;
        structureType?: number;
        natureType?: number;
        capabilityFilters?: Partial<ItemCapabilitiesProps>;
        status?: number;
        categoryId?: string;
        includeDescendants?: boolean;
        page?: number;
        pageSize?: number;
    };
    readonly tenantId: string;
    readonly keyword?: string;
    readonly structureType?: number;
    readonly natureType?: number;
    readonly capabilityFilters?: Partial<ItemCapabilitiesProps>;
    readonly status?: number;
    readonly categoryId?: string;
    readonly includeDescendants?: boolean;
    readonly page?: number;
    readonly pageSize?: number;
    constructor(input: {
        tenantId: string;
        keyword?: string;
        structureType?: number;
        natureType?: number;
        capabilityFilters?: Partial<ItemCapabilitiesProps>;
        status?: number;
        categoryId?: string;
        includeDescendants?: boolean;
        page?: number;
        pageSize?: number;
    });
}
