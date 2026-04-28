/** BatchGetItemsQuery captures one tenant-scoped bulk item lookup. */
export declare class BatchGetItemsQuery {
    readonly tenantId: string;
    readonly itemIds: string[];
    constructor(tenantIdOrInput: string | {
        tenantId: string;
        itemIds: string[];
    }, itemIds?: string[]);
}
