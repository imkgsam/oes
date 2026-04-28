"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertRequiredString = assertRequiredString;
exports.normalizeOptionalString = normalizeOptionalString;
exports.normalizePageInput = normalizePageInput;
exports.paginate = paginate;
exports.assertOperatorContext = assertOperatorContext;
exports.assertTraceContext = assertTraceContext;
exports.assertAuditContext = assertAuditContext;
exports.assertKnownPurchaseRequestLineType = assertKnownPurchaseRequestLineType;
exports.assertKnownPurchaseRequestDecision = assertKnownPurchaseRequestDecision;
exports.assertKnownAllocationType = assertKnownAllocationType;
exports.assertKnownReceivingResolutionCode = assertKnownReceivingResolutionCode;
exports.assertPositiveQuantity = assertPositiveQuantity;
exports.normalizeQuantity = normalizeQuantity;
exports.sumQuantities = sumQuantities;
exports.compareQuantity = compareQuantity;
exports.subtractQuantity = subtractQuantity;
exports.inferAllocationType = inferAllocationType;
exports.assertExists = assertExists;
exports.assertPrecondition = assertPrecondition;
const exceptions_1 = require("@oes/common/exceptions");
const procurement_errors_1 = require("../../common/errors/procurement.errors");
const procurement_records_1 = require("../../domain/models/procurement-records");
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
function assertRequiredString(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, { field });
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
/** normalizePageInput applies the shared 1-based paging default used by the frozen phase 1 query surface. */
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
/** assertOperatorContext enforces the explicit command and query operator context contract frozen for procurement-service. */
function assertOperatorContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_UNAUTHENTICATED, {
            reason: 'operator context is required'
        });
    }
    assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId');
    assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType');
    return value;
}
/** assertTraceContext enforces the explicit trace context contract frozen for procurement-service. */
function assertTraceContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_UNAUTHENTICATED, {
            reason: 'trace context is required'
        });
    }
    assertNonEmptyContextField(value.traceId, 'traceContext.traceId');
    assertNonEmptyContextField(value.requestId, 'traceContext.requestId');
    return value;
}
/** assertAuditContext enforces the explicit audit context contract required by every procurement management command. */
function assertAuditContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_UNAUTHENTICATED, {
            reason: 'audit context is required'
        });
    }
    assertNonEmptyContextField(value.auditId, 'auditContext.auditId');
    assertNonEmptyContextField(value.reason, 'auditContext.reason');
    assertNonEmptyContextField(value.source, 'auditContext.source');
    return value;
}
/** assertKnownPurchaseRequestLineType rejects unsupported enum values outside the frozen PR line type set. */
function assertKnownPurchaseRequestLineType(value) {
    if (value !== procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM && value !== procurement_records_1.PurchaseRequestLineType.TEXT) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, {
            field: 'lineType'
        });
    }
    return value;
}
/** assertKnownPurchaseRequestDecision rejects unsupported enum values outside the frozen PR decision set. */
function assertKnownPurchaseRequestDecision(value) {
    if (value !== procurement_records_1.PurchaseRequestDecision.APPROVED && value !== procurement_records_1.PurchaseRequestDecision.REJECTED) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, {
            field: 'decision'
        });
    }
    return value;
}
/** assertKnownAllocationType rejects unsupported enum values outside the frozen PO allocation type set. */
function assertKnownAllocationType(value) {
    if (value !== procurement_records_1.PurchaseOrderLineAllocationType.SALES_ORDER_LINE &&
        value !== procurement_records_1.PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND &&
        value !== procurement_records_1.PurchaseOrderLineAllocationType.GENERAL_STOCK) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, {
            field: 'allocationType'
        });
    }
    return value;
}
/** assertKnownReceivingResolutionCode rejects unsupported discrepancy resolution codes outside the frozen set. */
function assertKnownReceivingResolutionCode(value) {
    if (value !== procurement_records_1.ReceivingResolutionCode.WAIT_REDELIVERY &&
        value !== procurement_records_1.ReceivingResolutionCode.ACCEPT_SHORT_CLOSE &&
        value !== procurement_records_1.ReceivingResolutionCode.RETURN_OR_REJECT_EXCESS &&
        value !== procurement_records_1.ReceivingResolutionCode.MANUAL_FOLLOW_UP) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, {
            field: 'resolutionCode'
        });
    }
    return value;
}
/** assertPositiveQuantity keeps frozen procurement quantity inputs away from zero and negative values. */
function assertPositiveQuantity(value, field) {
    assertRequiredString(value, field);
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, { field });
    }
    return normalizeQuantity(value);
}
/** normalizeQuantity removes redundant leading and trailing zeros from one decimal-like scalar string. */
function normalizeQuantity(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, {
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
/** subtractQuantity subtracts right from left and returns the normalized non-negative result string. */
function subtractQuantity(left, right) {
    const delta = Number(normalizeQuantity(left)) - Number(normalizeQuantity(right));
    if (delta < -1e-9) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_FAILED_PRECONDITION, {
            reason: 'quantity underflow'
        });
    }
    return Math.max(delta, 0).toString();
}
/** inferAllocationType converts frozen PR demand-reference types into the supported allocation enum set. */
function inferAllocationType(value) {
    if (value === procurement_records_1.PurchaseOrderLineAllocationType.SALES_ORDER_LINE || value === 'SALES_ORDER_LINE') {
        return procurement_records_1.PurchaseOrderLineAllocationType.SALES_ORDER_LINE;
    }
    if (value === procurement_records_1.PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND || value === 'FULFILLMENT_DEMAND') {
        return procurement_records_1.PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND;
    }
    return procurement_records_1.PurchaseOrderLineAllocationType.GENERAL_STOCK;
}
/** assertExists rejects missing aggregates or reference data with the frozen NOT_FOUND semantics. */
function assertExists(value, resource, identifier) {
    if (value === null || value === undefined) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_NOT_FOUND, {
            resource,
            identifier
        });
    }
    return value;
}
/** assertPrecondition enforces frozen business gates without leaking local implementation detail. */
function assertPrecondition(condition, reason, details) {
    if (!condition) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_FAILED_PRECONDITION, {
            reason,
            ...details
        });
    }
}
/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_UNAUTHENTICATED, {
            field
        });
    }
}
//# sourceMappingURL=procurement-assertions.js.map