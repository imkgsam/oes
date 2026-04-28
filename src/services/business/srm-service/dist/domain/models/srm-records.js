"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierOfferingStatus = exports.SupplierPartyBindingStatus = exports.SupplierStatus = void 0;
exports.cloneRecord = cloneRecord;
var SupplierStatus;
(function (SupplierStatus) {
    SupplierStatus["ACTIVE"] = "ACTIVE";
    SupplierStatus["INACTIVE"] = "INACTIVE";
})(SupplierStatus || (exports.SupplierStatus = SupplierStatus = {}));
var SupplierPartyBindingStatus;
(function (SupplierPartyBindingStatus) {
    SupplierPartyBindingStatus["ACTIVE"] = "ACTIVE";
})(SupplierPartyBindingStatus || (exports.SupplierPartyBindingStatus = SupplierPartyBindingStatus = {}));
var SupplierOfferingStatus;
(function (SupplierOfferingStatus) {
    SupplierOfferingStatus["ACTIVE"] = "ACTIVE";
    SupplierOfferingStatus["INACTIVE"] = "INACTIVE";
})(SupplierOfferingStatus || (exports.SupplierOfferingStatus = SupplierOfferingStatus = {}));
/** cloneRecord deep-clones plain SRM records so repositories do not leak mutable state across calls. */
function cloneRecord(value) {
    return structuredClone(value);
}
//# sourceMappingURL=srm-records.js.map