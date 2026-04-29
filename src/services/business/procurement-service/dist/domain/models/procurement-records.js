"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceivingResolutionCode = exports.ReceivingDiscrepancyStatus = exports.ReceivingDiscrepancyType = exports.ReceivingExpectationStatus = exports.PurchaseOrderChangeStatus = exports.PurchaseOrderSupplierAcknowledgementStatus = exports.PurchaseOrderLineAllocationType = exports.PurchaseOrderStatus = exports.PurchaseRequestDecision = exports.PurchaseRequestLineConversionStatus = exports.PurchaseRequestLineType = exports.PurchaseRequestStatus = exports.PurchaseRequestType = void 0;
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
    PurchaseRequestStatus["PARTIALLY_CONVERTED"] = "PARTIALLY_CONVERTED";
    PurchaseRequestStatus["CONVERTED"] = "CONVERTED";
    PurchaseRequestStatus["REJECTED"] = "REJECTED";
    PurchaseRequestStatus["CANCELLED"] = "CANCELLED";
})(PurchaseRequestStatus || (exports.PurchaseRequestStatus = PurchaseRequestStatus = {}));
var PurchaseRequestLineType;
(function (PurchaseRequestLineType) {
    PurchaseRequestLineType["STANDARD_ITEM"] = "STANDARD_ITEM";
    PurchaseRequestLineType["TEXT"] = "TEXT";
})(PurchaseRequestLineType || (exports.PurchaseRequestLineType = PurchaseRequestLineType = {}));
var PurchaseRequestLineConversionStatus;
(function (PurchaseRequestLineConversionStatus) {
    PurchaseRequestLineConversionStatus["NOT_CONVERTED"] = "NOT_CONVERTED";
    PurchaseRequestLineConversionStatus["PARTIALLY_CONVERTED"] = "PARTIALLY_CONVERTED";
    PurchaseRequestLineConversionStatus["CONVERTED"] = "CONVERTED";
})(PurchaseRequestLineConversionStatus || (exports.PurchaseRequestLineConversionStatus = PurchaseRequestLineConversionStatus = {}));
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
    PurchaseOrderLineAllocationType["PURCHASE_REQUEST_LINE"] = "PURCHASE_REQUEST_LINE";
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
    ReceivingDiscrepancyType["SHORT_RECEIVED"] = "SHORT_RECEIVED";
    ReceivingDiscrepancyType["OVER_RECEIVED"] = "OVER_RECEIVED";
    ReceivingDiscrepancyType["DAMAGED"] = "DAMAGED";
    ReceivingDiscrepancyType["WRONG_ITEM"] = "WRONG_ITEM";
    ReceivingDiscrepancyType["QUALITY_HOLD"] = "QUALITY_HOLD";
})(ReceivingDiscrepancyType || (exports.ReceivingDiscrepancyType = ReceivingDiscrepancyType = {}));
var ReceivingDiscrepancyStatus;
(function (ReceivingDiscrepancyStatus) {
    ReceivingDiscrepancyStatus["OPEN"] = "OPEN";
    ReceivingDiscrepancyStatus["RESOLVED"] = "RESOLVED";
})(ReceivingDiscrepancyStatus || (exports.ReceivingDiscrepancyStatus = ReceivingDiscrepancyStatus = {}));
var ReceivingResolutionCode;
(function (ReceivingResolutionCode) {
    ReceivingResolutionCode["WAIT_REDELIVERY"] = "WAIT_REDELIVERY";
    ReceivingResolutionCode["CLOSE_UNRECEIVED"] = "CLOSE_UNRECEIVED";
    ReceivingResolutionCode["REQUEST_RESEND"] = "REQUEST_RESEND";
    ReceivingResolutionCode["ACCEPT_WITH_PO_CHANGE"] = "ACCEPT_WITH_PO_CHANGE";
    ReceivingResolutionCode["REJECT_EXCESS"] = "REJECT_EXCESS";
    ReceivingResolutionCode["TEMP_HOLD"] = "TEMP_HOLD";
    ReceivingResolutionCode["REJECT_DAMAGED"] = "REJECT_DAMAGED";
    ReceivingResolutionCode["RECEIVE_WITH_RESTRICTION"] = "RECEIVE_WITH_RESTRICTION";
    ReceivingResolutionCode["CLAIM"] = "CLAIM";
    ReceivingResolutionCode["REJECT_WRONG_ITEM"] = "REJECT_WRONG_ITEM";
    ReceivingResolutionCode["TEMP_RECEIVE_PENDING_DECISION"] = "TEMP_RECEIVE_PENDING_DECISION";
    ReceivingResolutionCode["ACCEPT_WITH_CONTROLLED_CHANGE"] = "ACCEPT_WITH_CONTROLLED_CHANGE";
    ReceivingResolutionCode["WAIT_INSPECTION"] = "WAIT_INSPECTION";
    ReceivingResolutionCode["ACCEPT_WITH_ALLOWANCE"] = "ACCEPT_WITH_ALLOWANCE";
    ReceivingResolutionCode["RETURN_TO_SUPPLIER"] = "RETURN_TO_SUPPLIER";
})(ReceivingResolutionCode || (exports.ReceivingResolutionCode = ReceivingResolutionCode = {}));
/** cloneRecord deep-clones plain procurement records so repositories do not leak mutable state across calls. */
function cloneRecord(value) {
    return structuredClone(value);
}
//# sourceMappingURL=procurement-records.js.map