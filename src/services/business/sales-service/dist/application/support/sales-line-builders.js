"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toQuoteLineRecords = toQuoteLineRecords;
exports.toSalesOrderLineRecords = toSalesOrderLineRecords;
const node_crypto_1 = require("node:crypto");
/** toQuoteLineRecords materializes quote draft inputs into persisted quote line records with stable ids. */
function toQuoteLineRecords(lines) {
    return lines.map((line) => ({
        quoteLineId: (0, node_crypto_1.randomUUID)(),
        lineNo: line.lineNo,
        itemId: line.itemId,
        itemSnapshot: structuredClone(line.itemSnapshot),
        salesConfigSnapshot: structuredClone(line.salesConfigSnapshot),
        packagingRequirementSnapshot: structuredClone(line.packagingRequirementSnapshot),
        priceQuantityDeliverySnapshot: structuredClone(line.priceQuantityDeliverySnapshot),
        customerItemSnapshot: structuredClone(line.customerItemSnapshot)
    }));
}
/** toSalesOrderLineRecords freezes published quote version lines into established order line records. */
function toSalesOrderLineRecords(lines) {
    return lines.map((line) => ({
        salesOrderLineId: (0, node_crypto_1.randomUUID)(),
        lineNo: line.lineNo,
        itemId: line.itemId,
        itemSnapshot: structuredClone(line.itemSnapshot),
        salesConfigSnapshot: structuredClone(line.salesConfigSnapshot),
        packagingRequirementSnapshot: structuredClone(line.packagingRequirementSnapshot),
        priceQuantityDeliverySnapshot: structuredClone(line.priceQuantityDeliverySnapshot),
        customerItemSnapshot: structuredClone(line.customerItemSnapshot)
    }));
}
//# sourceMappingURL=sales-line-builders.js.map