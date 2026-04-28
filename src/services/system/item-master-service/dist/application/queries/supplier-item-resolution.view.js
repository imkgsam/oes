"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierItemResolutionStatus = exports.SupplierItemResolutionView = void 0;
/** SupplierItemResolutionView keeps the query-layer match outcome aligned with the frozen MATCHED or NO_MATCH contract. */
var SupplierItemResolutionView;
(function (SupplierItemResolutionView) {
    SupplierItemResolutionView["MATCHED"] = "MATCHED";
    SupplierItemResolutionView["NO_MATCH"] = "NO_MATCH";
})(SupplierItemResolutionView || (exports.SupplierItemResolutionView = SupplierItemResolutionView = {}));
/** SupplierItemResolutionStatus preserves the legacy enum name expected by tests while reusing the same values. */
exports.SupplierItemResolutionStatus = SupplierItemResolutionView;
//# sourceMappingURL=supplier-item-resolution.view.js.map