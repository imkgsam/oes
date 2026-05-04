"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWarehouseQuery = void 0;
/** GetWarehouseQuery captures one tenant-scoped warehouse lookup by warehouse_id. */
class GetWarehouseQuery {
    tenantId;
    warehouseId;
    constructor(tenantId, warehouseId) {
        this.tenantId = tenantId;
        this.warehouseId = warehouseId;
    }
}
exports.GetWarehouseQuery = GetWarehouseQuery;
//# sourceMappingURL=get-warehouse.query.js.map