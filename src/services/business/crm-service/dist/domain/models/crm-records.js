"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPartyBindingStatus = exports.CustomerStatus = void 0;
exports.cloneRecord = cloneRecord;
var CustomerStatus;
(function (CustomerStatus) {
    CustomerStatus["ACTIVE_CUSTOMER"] = "ACTIVE_CUSTOMER";
    CustomerStatus["BLOCKED"] = "BLOCKED";
    CustomerStatus["ARCHIVED"] = "ARCHIVED";
})(CustomerStatus || (exports.CustomerStatus = CustomerStatus = {}));
var CustomerPartyBindingStatus;
(function (CustomerPartyBindingStatus) {
    CustomerPartyBindingStatus["ACTIVE_PRIMARY"] = "ACTIVE_PRIMARY";
})(CustomerPartyBindingStatus || (exports.CustomerPartyBindingStatus = CustomerPartyBindingStatus = {}));
/** cloneRecord deep-clones plain CRM records so repositories do not leak mutable state across calls. */
function cloneRecord(value) {
    return structuredClone(value);
}
//# sourceMappingURL=crm-records.js.map