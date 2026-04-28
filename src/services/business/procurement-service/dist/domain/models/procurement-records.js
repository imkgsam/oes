"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceivingResolutionCode = exports.ReceivingDiscrepancyStatus = exports.ReceivingDiscrepancyType = exports.ReceivingExpectationStatus = exports.PurchaseOrderChangeStatus = exports.PurchaseOrderSupplierAcknowledgementStatus = exports.PurchaseOrderLineAllocationType = exports.PurchaseOrderStatus = exports.PurchaseRequestDecision = exports.PurchaseRequestLineType = exports.PurchaseRequestStatus = exports.PurchaseRequestType = void 0;
exports.cloneRecord = cloneRecord;
var PurchaseRequestType;
(function (PurchaseRequestType) {
    PurchaseRequestType["DEPARTMENTAL"] = "DEPARTMENTAL";
    PurchaseRequestType["SALES_DEDICATED"] = "SALES_DEDICATED";
    PurchaseRequestType["PRODUCTION_PACKAGING"] = "PRODUCTION_PACKAGING";
    PurchaseRequestType["MAINTENANCE"] = "MAINTENANCE";
    PurchaseRequestType["SAMPLE"] = "SAMPLE";
})(PurchaseRequestType || (exports.PurchaseRequestType = PurchaseRequestType = {}));
var PurchaseRequestStatus;
(function (PurchaseRequestStatus) {
    PurchaseRequestStatus["DRAFT"] = "DRAFT";
    PurchaseRequestStatus["SUBMITTED"] = "SUBMITTED";
    PurchaseRequestStatus["APPROVED"] = "APPROVED";
    PurchaseRequestStatus["REJECTED"] = "REJECTED";
    PurchaseRequestStatus["CANCELLED"] = "CANCELLED";
})(PurchaseRequestStatus || (exports.PurchaseRequestStatus = PurchaseRequestStatus = {}));
var PurchaseRequestLineType;
(function (PurchaseRequestLineType) {
    PurchaseRequestLineType["STANDARD_ITEM"] = "STANDARD_ITEM";
    PurchaseRequestLineType["TEXT"] = "TEXT";
})(PurchaseRequestLineType || (exports.PurchaseRequestLineType = PurchaseRequestLineType = {}));
var PurchaseRequestDecision;
(function (PurchaseRequestDecision) {
    PurchaseRequestDecision["APPROVED"] = "APPROVED";
    PurchaseRequestDecision["REJECTED"] = "REJECTED";
})(PurchaseRequestDecision || (exports.PurchaseRequestDecision = PurchaseRequestDecision = {}));
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["DRAFT"] = "DRAFT";
    PurchaseOrderStatus["ISSUED"] = "ISSUED";
    PurchaseOrderStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    PurchaseOrderStatus["CANCELLED"] = "CANCELLED";
})(PurchaseOrderStatus || (exports.PurchaseOrderStatus = PurchaseOrderStatus = {}));
var PurchaseOrderLineAllocationType;
(function (PurchaseOrderLineAllocationType) {
    PurchaseOrderLineAllocationType["SALES_ORDER_LINE"] = "SALES_ORDER_LINE";
    PurchaseOrderLineAllocationType["FULFILLMENT_DEMAND"] = "FULFILLMENT_DEMAND";
    PurchaseOrderLineAllocationType["GENERAL_STOCK"] = "GENERAL_STOCK";
})(PurchaseOrderLineAllocationType || (exports.PurchaseOrderLineAllocationType = PurchaseOrderLineAllocationType = {}));
var PurchaseOrderSupplierAcknowledgementStatus;
(function (PurchaseOrderSupplierAcknowledgementStatus) {
    PurchaseOrderSupplierAcknowledgementStatus["PENDING"] = "PENDING";
    PurchaseOrderSupplierAcknowledgementStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
})(PurchaseOrderSupplierAcknowledgementStatus || (exports.PurchaseOrderSupplierAcknowledgementStatus = PurchaseOrderSupplierAcknowledgementStatus = {}));
var PurchaseOrderChangeStatus;
(function (PurchaseOrderChangeStatus) {
    PurchaseOrderChangeStatus["APPLIED"] = "APPLIED";
})(PurchaseOrderChangeStatus || (exports.PurchaseOrderChangeStatus = PurchaseOrderChangeStatus = {}));
var ReceivingExpectationStatus;
(function (ReceivingExpectationStatus) {
    ReceivingExpectationStatus["OPEN"] = "OPEN";
    ReceivingExpectationStatus["PARTIALLY_RECEIVED"] = "PARTIALLY_RECEIVED";
    ReceivingExpectationStatus["COMPLETED"] = "COMPLETED";
    ReceivingExpectationStatus["CANCELLED"] = "CANCELLED";
})(ReceivingExpectationStatus || (exports.ReceivingExpectationStatus = ReceivingExpectationStatus = {}));
var ReceivingDiscrepancyType;
(function (ReceivingDiscrepancyType) {
    ReceivingDiscrepancyType["SHORT_RECEIPT"] = "SHORT_RECEIPT";
    ReceivingDiscrepancyType["OVER_RECEIPT"] = "OVER_RECEIPT";
    ReceivingDiscrepancyType["DAMAGED"] = "DAMAGED";
    ReceivingDiscrepancyType["RESTRICTED"] = "RESTRICTED";
    ReceivingDiscrepancyType["OTHER"] = "OTHER";
})(ReceivingDiscrepancyType || (exports.ReceivingDiscrepancyType = ReceivingDiscrepancyType = {}));
var ReceivingDiscrepancyStatus;
(function (ReceivingDiscrepancyStatus) {
    ReceivingDiscrepancyStatus["OPEN"] = "OPEN";
    ReceivingDiscrepancyStatus["RESOLVED"] = "RESOLVED";
})(ReceivingDiscrepancyStatus || (exports.ReceivingDiscrepancyStatus = ReceivingDiscrepancyStatus = {}));
var ReceivingResolutionCode;
(function (ReceivingResolutionCode) {
    ReceivingResolutionCode["WAIT_REDELIVERY"] = "WAIT_REDELIVERY";
    ReceivingResolutionCode["ACCEPT_SHORT_CLOSE"] = "ACCEPT_SHORT_CLOSE";
    ReceivingResolutionCode["RETURN_OR_REJECT_EXCESS"] = "RETURN_OR_REJECT_EXCESS";
    ReceivingResolutionCode["MANUAL_FOLLOW_UP"] = "MANUAL_FOLLOW_UP";
})(ReceivingResolutionCode || (exports.ReceivingResolutionCode = ReceivingResolutionCode = {}));
/** cloneRecord deep-clones plain procurement records so repositories do not leak mutable state across calls. */
function cloneRecord(value) {
    return structuredClone(value);
}
//# sourceMappingURL=procurement-records.js.map