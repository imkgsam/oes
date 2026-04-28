"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPurchaseOrderQuery = void 0;
/** GetPurchaseOrderQuery carries the tenant-scoped PO lookup key. */
class GetPurchaseOrderQuery {
    constructor(tenantId, purchaseOrderId) {
        this.tenantId = tenantId;
        this.purchaseOrderId = purchaseOrderId;
    }
}
exports.GetPurchaseOrderQuery = GetPurchaseOrderQuery;
//# sourceMappingURL=get-purchase-order.query.js.map