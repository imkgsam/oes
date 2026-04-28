/** GetItemQuery captures one tenant-scoped item lookup by item_id. */
export declare class GetItemQuery {
    readonly tenantId: string;
    readonly itemId: string;
    constructor(tenantId: string, itemId: string);
}
