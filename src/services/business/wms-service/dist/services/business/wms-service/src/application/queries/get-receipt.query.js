"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetReceiptQuery = void 0;
/** GetReceiptQuery captures one tenant-scoped receipt lookup by receipt_id. */
class GetReceiptQuery {
    tenantId;
    receiptId;
    constructor(tenantId, receiptId) {
        this.tenantId = tenantId;
        this.receiptId = receiptId;
    }
}
exports.GetReceiptQuery = GetReceiptQuery;
//# sourceMappingURL=get-receipt.query.js.map