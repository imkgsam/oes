"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetReceiptLineQuery = void 0;
/** GetReceiptLineQuery captures one tenant-scoped receipt-line lookup by receipt_line_id. */
class GetReceiptLineQuery {
    tenantId;
    receiptLineId;
    constructor(tenantId, receiptLineId) {
        this.tenantId = tenantId;
        this.receiptLineId = receiptLineId;
    }
}
exports.GetReceiptLineQuery = GetReceiptLineQuery;
//# sourceMappingURL=get-receipt-line.query.js.map