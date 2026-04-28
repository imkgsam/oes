"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesFulfillmentHandoffStatus = exports.SalesQuoteStatus = void 0;
exports.cloneRecord = cloneRecord;
exports.buildInitialCommercialGateSummary = buildInitialCommercialGateSummary;
exports.buildInitialHandoffSummary = buildInitialHandoffSummary;
var SalesQuoteStatus;
(function (SalesQuoteStatus) {
    SalesQuoteStatus["DRAFT"] = "DRAFT";
    SalesQuoteStatus["PUBLISHED"] = "PUBLISHED";
})(SalesQuoteStatus || (exports.SalesQuoteStatus = SalesQuoteStatus = {}));
var SalesFulfillmentHandoffStatus;
(function (SalesFulfillmentHandoffStatus) {
    SalesFulfillmentHandoffStatus["NOT_SUBMITTED"] = "NOT_SUBMITTED";
    SalesFulfillmentHandoffStatus["SUBMITTED"] = "SUBMITTED";
})(SalesFulfillmentHandoffStatus || (exports.SalesFulfillmentHandoffStatus = SalesFulfillmentHandoffStatus = {}));
/** cloneRecord deep-clones plain sales records so repositories do not leak mutable state between calls. */
function cloneRecord(value) {
    return structuredClone(value);
}
/** buildInitialCommercialGateSummary creates the frozen phase 1 order-established baseline. */
function buildInitialCommercialGateSummary(orderEstablished) {
    return {
        orderEstablished,
        productionGate: false,
        stockingGate: false,
        shippingGate: false
    };
}
/** buildInitialHandoffSummary creates the phase 1 sales-side handoff summary before submission. */
function buildInitialHandoffSummary() {
    return {
        status: SalesFulfillmentHandoffStatus.NOT_SUBMITTED
    };
}
//# sourceMappingURL=sales-records.js.map