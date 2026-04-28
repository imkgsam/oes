"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPurchaseRequestQuery = void 0;
/** GetPurchaseRequestQuery carries the tenant-scoped PR lookup key. */
class GetPurchaseRequestQuery {
    constructor(tenantId, purchaseRequestId) {
        this.tenantId = tenantId;
        this.purchaseRequestId = purchaseRequestId;
    }
}
exports.GetPurchaseRequestQuery = GetPurchaseRequestQuery;
//# sourceMappingURL=get-purchase-request.query.js.map