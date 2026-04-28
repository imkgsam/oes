"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertRequiredString = assertRequiredString;
exports.normalizeOptionalString = normalizeOptionalString;
exports.normalizeTags = normalizeTags;
exports.normalizePageInput = normalizePageInput;
exports.paginate = paginate;
exports.assertOperatorContext = assertOperatorContext;
exports.assertTraceContext = assertTraceContext;
exports.assertAuditContext = assertAuditContext;
exports.assertKnownSupplierStatus = assertKnownSupplierStatus;
exports.assertKnownSupplierOfferingStatus = assertKnownSupplierOfferingStatus;
const exceptions_1 = require("@oes/common/exceptions");
const srm_errors_1 = require("../../common/errors/srm.errors");
const srm_records_1 = require("../../domain/models/srm-records");
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
function assertRequiredString(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_INVALID_ARGUMENT, { field });
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
/** normalizeTags trims, de-duplicates, and preserves the incoming SRM business-tag order. */
function normalizeTags(tags) {
    const normalized = [];
    const seen = new Set();
    for (const raw of tags ?? []) {
        const value = raw.trim();
        if (value.length === 0 || seen.has(value)) {
            continue;
        }
        seen.add(value);
        normalized.push(value);
    }
    return normalized;
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
/** assertOperatorContext enforces the explicit command and query operator context contract frozen for srm-service. */
function assertOperatorContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_UNAUTHENTICATED, {
            reason: 'operator context is required'
        });
    }
    assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId');
    assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType');
    return value;
}
/** assertTraceContext enforces the explicit trace context contract frozen for srm-service. */
function assertTraceContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_UNAUTHENTICATED, {
            reason: 'trace context is required'
        });
    }
    assertNonEmptyContextField(value.traceId, 'traceContext.traceId');
    assertNonEmptyContextField(value.requestId, 'traceContext.requestId');
    return value;
}
/** assertAuditContext enforces the explicit audit context contract required by every SRM management command. */
function assertAuditContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_UNAUTHENTICATED, {
            reason: 'audit context is required'
        });
    }
    assertNonEmptyContextField(value.auditId, 'auditContext.auditId');
    assertNonEmptyContextField(value.reason, 'auditContext.reason');
    assertNonEmptyContextField(value.source, 'auditContext.source');
    return value;
}
/** assertKnownSupplierStatus rejects unsupported enum values outside the frozen phase 1 SRM status set. */
function assertKnownSupplierStatus(status) {
    if (status !== srm_records_1.SupplierStatus.ACTIVE && status !== srm_records_1.SupplierStatus.INACTIVE) {
        throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_INVALID_ARGUMENT, {
            field: 'targetStatus'
        });
    }
    return status;
}
/** assertKnownSupplierOfferingStatus rejects unsupported enum values outside the frozen phase 1 offering status set. */
function assertKnownSupplierOfferingStatus(status) {
    if (status !== srm_records_1.SupplierOfferingStatus.ACTIVE && status !== srm_records_1.SupplierOfferingStatus.INACTIVE) {
        throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_INVALID_ARGUMENT, {
            field: 'targetStatus'
        });
    }
    return status;
}
/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(srm_errors_1.SRM_UNAUTHENTICATED, {
            field
        });
    }
}
//# sourceMappingURL=srm-assertions.js.map