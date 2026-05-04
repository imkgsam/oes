/** GetWarehouseQuery captures one tenant-scoped warehouse lookup by warehouse_id. */
export declare class GetWarehouseQuery {
    readonly tenantId: string;
    readonly warehouseId: string;
    constructor(tenantId: string, warehouseId: string);
}
