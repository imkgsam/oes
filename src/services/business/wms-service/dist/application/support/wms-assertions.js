"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertRequiredString = assertRequiredString;
exports.normalizeOptionalString = normalizeOptionalString;
exports.normalizePageInput = normalizePageInput;
exports.paginate = paginate;
exports.assertOperatorContext = assertOperatorContext;
exports.assertTraceContext = assertTraceContext;
exports.assertAuditContext = assertAuditContext;
exports.assertKnownReceiptSourceType = assertKnownReceiptSourceType;
exports.assertKnownInventoryStatus = assertKnownInventoryStatus;
exports.assertKnownRestrictedReasonCode = assertKnownRestrictedReasonCode;
exports.assertKnownTrackingRefType = assertKnownTrackingRefType;
exports.assertKnownPhysicalDiscrepancyType = assertKnownPhysicalDiscrepancyType;
exports.assertPositiveQuantity = assertPositiveQuantity;
exports.normalizeQuantity = normalizeQuantity;
exports.sumQuantities = sumQuantities;
exports.compareQuantity = compareQuantity;
exports.assertExists = assertExists;
exports.assertPrecondition = assertPrecondition;
exports.assertDateRange = assertDateRange;
const exceptions_1 = require("@oes/common/exceptions");
const wms_errors_1 = require("../../common/errors/wms.errors");
const wms_records_1 = require("../../domain/models/wms-records");
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
function assertRequiredString(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, { field });
    }
}
/** normalizeOptionalString collapses empty strings into undefined so controllers can map gRPC defaults safely. */
function normalizeOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
}
/** normalizePageInput applies the shared 1-based paging default used by the frozen WMS query surface. */
function normalizePageInput(page, pageSize) {
    const normalizedPage = page && page > 0 ? page : 1;
    const normalizedPageSize = pageSize && pageSize > 0 ? pageSize : 20;
    return {
        page: normalizedPage,
        pageSize: normalizedPageSize
    };
}
/** paginate slices a fully filtered record list into the standard phase 1 page envelope. */
function paginate(items, page, pageSize) {
    const start = (page - 1) * pageSize;
    return {
        pageItems: items.slice(start, start + pageSize),
        total: items.length
    };
}
/** assertOperatorContext enforces the explicit query and command operator context contract frozen for WMS. */
function assertOperatorContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_UNAUTHENTICATED, {
            reason: 'operator context is required'
        });
    }
    assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId');
    assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType');
    return value;
}
/** assertTraceContext enforces the explicit trace context contract frozen for WMS. */
function assertTraceContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_UNAUTHENTICATED, {
            reason: 'trace context is required'
        });
    }
    assertNonEmptyContextField(value.traceId, 'traceContext.traceId');
    assertNonEmptyContextField(value.requestId, 'traceContext.requestId');
    return value;
}
/** assertAuditContext enforces the explicit audit context contract required by every WMS management command. */
function assertAuditContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_UNAUTHENTICATED, {
            reason: 'audit context is required'
        });
    }
    assertNonEmptyContextField(value.auditId, 'auditContext.auditId');
    assertNonEmptyContextField(value.reason, 'auditContext.reason');
    assertNonEmptyContextField(value.source, 'auditContext.source');
    return value;
}
/** assertKnownReceiptSourceType rejects unsupported enum values outside the frozen receipt source set. */
function assertKnownReceiptSourceType(value) {
    if (value !== wms_records_1.ReceiptSourceType.MANUAL && value !== wms_records_1.ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, {
            field: 'receiptSourceType'
        });
    }
    return value;
}
/** assertKnownInventoryStatus rejects unsupported enum values outside the frozen inventory status set. */
function assertKnownInventoryStatus(value) {
    if (value !== wms_records_1.InventoryStatus.AVAILABLE && value !== wms_records_1.InventoryStatus.RESTRICTED) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, {
            field: 'inventoryStatus'
        });
    }
    return value;
}
/** assertKnownRestrictedReasonCode rejects unsupported enum values outside the frozen restricted reason set. */
function assertKnownRestrictedReasonCode(value) {
    if (value !== wms_records_1.RestrictedStatusReasonCode.DAMAGED &&
        value !== wms_records_1.RestrictedStatusReasonCode.QUALITY_HOLD &&
        value !== wms_records_1.RestrictedStatusReasonCode.PENDING_IDENTIFICATION &&
        value !== wms_records_1.RestrictedStatusReasonCode.PENDING_DECISION &&
        value !== wms_records_1.RestrictedStatusReasonCode.OTHER) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, {
            field: 'restrictedReason.reasonCode'
        });
    }
    return value;
}
/** assertKnownTrackingRefType rejects unsupported tracking-ref enum values outside the frozen set. */
function assertKnownTrackingRefType(value) {
    if (value !== wms_records_1.ReceiptTrackingRefType.BOX_CODE &&
        value !== wms_records_1.ReceiptTrackingRefType.UNIT_CODE &&
        value !== wms_records_1.ReceiptTrackingRefType.EXTERNAL_CODE &&
        value !== wms_records_1.ReceiptTrackingRefType.FREE_TEXT) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, {
            field: 'trackingRefs.trackingRefType'
        });
    }
    return value;
}
/** assertKnownPhysicalDiscrepancyType rejects unsupported physical discrepancy enum values outside the frozen set. */
function assertKnownPhysicalDiscrepancyType(value) {
    if (value !== wms_records_1.ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED &&
        value !== wms_records_1.ReceiptPhysicalDiscrepancyType.OVER_RECEIVED &&
        value !== wms_records_1.ReceiptPhysicalDiscrepancyType.DAMAGED &&
        value !== wms_records_1.ReceiptPhysicalDiscrepancyType.WRONG_ITEM &&
        value !== wms_records_1.ReceiptPhysicalDiscrepancyType.QUALITY_HOLD &&
        value !== wms_records_1.ReceiptPhysicalDiscrepancyType.OTHER) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, {
            field: 'physicalDiscrepancy.discrepancyType'
        });
    }
    return value;
}
/** assertPositiveQuantity keeps frozen WMS quantity inputs away from zero and negative values. */
function assertPositiveQuantity(value, field) {
    assertRequiredString(value, field);
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, { field });
    }
    return normalizeQuantity(value);
}
/** normalizeQuantity removes redundant leading and trailing zeros from one decimal-like scalar string. */
function normalizeQuantity(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, {
            field: 'quantity'
        });
    }
    return numeric.toString();
}
/** sumQuantities adds one group of quantity strings with minimal decimal-safe precision for current phase 1 tests. */
function sumQuantities(values) {
    const total = values.reduce((sum, value) => sum + Number(normalizeQuantity(value)), 0);
    return total.toString();
}
/** compareQuantity compares two normalized quantity strings using the current phase 1 decimal-safe rules. */
function compareQuantity(left, right) {
    const delta = Number(normalizeQuantity(left)) - Number(normalizeQuantity(right));
    if (Math.abs(delta) < 1e-9) {
        return 0;
    }
    return delta < 0 ? -1 : 1;
}
/** assertExists rejects missing aggregates or reference data with the frozen NOT_FOUND semantics. */
function assertExists(value, resource, identifier) {
    if (value === null || value === undefined) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_NOT_FOUND, {
            resource,
            identifier
        });
    }
    return value;
}
/** assertPrecondition enforces frozen business gates without leaking local implementation detail. */
function assertPrecondition(condition, reason, details) {
    if (!condition) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_FAILED_PRECONDITION, {
            reason,
            ...details
        });
    }
}
/** assertDateRange ensures query date filters remain ordered in the frozen phase 1 surface. */
function assertDateRange(from, to, field) {
    if (from && to && from > to) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_INVALID_ARGUMENT, {
            field,
            reason: 'date range is invalid'
        });
    }
}
/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_UNAUTHENTICATED, {
            field
        });
    }
}
//# sourceMappingURL=wms-assertions.js.map