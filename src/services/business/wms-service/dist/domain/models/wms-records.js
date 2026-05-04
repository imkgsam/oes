"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryBalanceStatusFilter = exports.StockLedgerSourceDocumentType = exports.StockLedgerDirection = exports.StockLedgerEntryType = exports.ReceiptPhysicalDiscrepancyType = exports.ReceiptTrackingRefType = exports.RestrictedStatusReasonCode = exports.InventoryStatus = exports.ReceiptSourceType = exports.ReceiptStatus = exports.LocationStatus = exports.LocationType = exports.LocationScope = exports.WarehouseStatus = exports.WarehouseScope = void 0;
/** WarehouseScope describes the phase 1 runtime scope allowed by the frozen WMS warehouse contract. */
var WarehouseScope;
(function (WarehouseScope) {
    WarehouseScope["INTERNAL"] = "INTERNAL";
})(WarehouseScope || (exports.WarehouseScope = WarehouseScope = {}));
/** WarehouseStatus describes the readable warehouse lifecycle states frozen for phase 1. */
var WarehouseStatus;
(function (WarehouseStatus) {
    WarehouseStatus["ACTIVE"] = "ACTIVE";
    WarehouseStatus["INACTIVE"] = "INACTIVE";
})(WarehouseStatus || (exports.WarehouseStatus = WarehouseStatus = {}));
/** LocationScope describes the phase 1 runtime scope allowed by the frozen WMS location contract. */
var LocationScope;
(function (LocationScope) {
    LocationScope["INTERNAL"] = "INTERNAL";
})(LocationScope || (exports.LocationScope = LocationScope = {}));
/** LocationType describes the supported internal stock-responsible location categories. */
var LocationType;
(function (LocationType) {
    LocationType["RECEIVING"] = "RECEIVING";
    LocationType["STORAGE"] = "STORAGE";
    LocationType["STAGING"] = "STAGING";
    LocationType["RESTRICTED"] = "RESTRICTED";
})(LocationType || (exports.LocationType = LocationType = {}));
/** LocationStatus describes the readable location lifecycle states frozen for phase 1. */
var LocationStatus;
(function (LocationStatus) {
    LocationStatus["ACTIVE"] = "ACTIVE";
    LocationStatus["INACTIVE"] = "INACTIVE";
})(LocationStatus || (exports.LocationStatus = LocationStatus = {}));
/** ReceiptStatus describes the WMS-owned receipt lifecycle without borrowing procurement semantics. */
var ReceiptStatus;
(function (ReceiptStatus) {
    ReceiptStatus["DRAFT"] = "DRAFT";
    ReceiptStatus["POSTED"] = "POSTED";
    ReceiptStatus["CANCELLED"] = "CANCELLED";
})(ReceiptStatus || (exports.ReceiptStatus = ReceiptStatus = {}));
/** ReceiptSourceType distinguishes manual receiving from expectation-referenced receiving. */
var ReceiptSourceType;
(function (ReceiptSourceType) {
    ReceiptSourceType["MANUAL"] = "MANUAL";
    ReceiptSourceType["RECEIVING_EXPECTATION_REFERENCE"] = "RECEIVING_EXPECTATION_REFERENCE";
})(ReceiptSourceType || (exports.ReceiptSourceType = ReceiptSourceType = {}));
/** InventoryStatus describes whether posted stock is available or restricted. */
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["AVAILABLE"] = "AVAILABLE";
    InventoryStatus["RESTRICTED"] = "RESTRICTED";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
/** RestrictedStatusReasonCode captures the allowed restricted stock reasons frozen for phase 1. */
var RestrictedStatusReasonCode;
(function (RestrictedStatusReasonCode) {
    RestrictedStatusReasonCode["DAMAGED"] = "DAMAGED";
    RestrictedStatusReasonCode["QUALITY_HOLD"] = "QUALITY_HOLD";
    RestrictedStatusReasonCode["PENDING_IDENTIFICATION"] = "PENDING_IDENTIFICATION";
    RestrictedStatusReasonCode["PENDING_DECISION"] = "PENDING_DECISION";
    RestrictedStatusReasonCode["OTHER"] = "OTHER";
})(RestrictedStatusReasonCode || (exports.RestrictedStatusReasonCode = RestrictedStatusReasonCode = {}));
/** ReceiptTrackingRefType captures the mixed coded and uncoded trace references accepted on receipt lines. */
var ReceiptTrackingRefType;
(function (ReceiptTrackingRefType) {
    ReceiptTrackingRefType["BOX_CODE"] = "BOX_CODE";
    ReceiptTrackingRefType["UNIT_CODE"] = "UNIT_CODE";
    ReceiptTrackingRefType["EXTERNAL_CODE"] = "EXTERNAL_CODE";
    ReceiptTrackingRefType["FREE_TEXT"] = "FREE_TEXT";
})(ReceiptTrackingRefType || (exports.ReceiptTrackingRefType = ReceiptTrackingRefType = {}));
/** ReceiptPhysicalDiscrepancyType captures the physical-only discrepancy facts WMS may record. */
var ReceiptPhysicalDiscrepancyType;
(function (ReceiptPhysicalDiscrepancyType) {
    ReceiptPhysicalDiscrepancyType["SHORT_RECEIVED"] = "SHORT_RECEIVED";
    ReceiptPhysicalDiscrepancyType["OVER_RECEIVED"] = "OVER_RECEIVED";
    ReceiptPhysicalDiscrepancyType["DAMAGED"] = "DAMAGED";
    ReceiptPhysicalDiscrepancyType["WRONG_ITEM"] = "WRONG_ITEM";
    ReceiptPhysicalDiscrepancyType["QUALITY_HOLD"] = "QUALITY_HOLD";
    ReceiptPhysicalDiscrepancyType["OTHER"] = "OTHER";
})(ReceiptPhysicalDiscrepancyType || (exports.ReceiptPhysicalDiscrepancyType = ReceiptPhysicalDiscrepancyType = {}));
/** StockLedgerEntryType keeps the ledger surface posting-friendly while phase 1 only supports receipt postings. */
var StockLedgerEntryType;
(function (StockLedgerEntryType) {
    StockLedgerEntryType["RECEIPT_POSTED"] = "RECEIPT_POSTED";
})(StockLedgerEntryType || (exports.StockLedgerEntryType = StockLedgerEntryType = {}));
/** StockLedgerDirection describes the quantity movement direction for immutable ledger facts. */
var StockLedgerDirection;
(function (StockLedgerDirection) {
    StockLedgerDirection["IN"] = "IN";
})(StockLedgerDirection || (exports.StockLedgerDirection = StockLedgerDirection = {}));
/** StockLedgerSourceDocumentType captures which WMS-owned source object produced one ledger fact. */
var StockLedgerSourceDocumentType;
(function (StockLedgerSourceDocumentType) {
    StockLedgerSourceDocumentType["RECEIPT"] = "RECEIPT";
})(StockLedgerSourceDocumentType || (exports.StockLedgerSourceDocumentType = StockLedgerSourceDocumentType = {}));
/** InventoryBalanceStatusFilter captures the search-time inventory exposure filter including ANY. */
var InventoryBalanceStatusFilter;
(function (InventoryBalanceStatusFilter) {
    InventoryBalanceStatusFilter["ANY"] = "ANY";
    InventoryBalanceStatusFilter["AVAILABLE"] = "AVAILABLE";
    InventoryBalanceStatusFilter["RESTRICTED"] = "RESTRICTED";
})(InventoryBalanceStatusFilter || (exports.InventoryBalanceStatusFilter = InventoryBalanceStatusFilter = {}));
//# sourceMappingURL=wms-records.js.map