"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertRequiredString = assertRequiredString;
exports.normalizePageInput = normalizePageInput;
exports.assertOperatorContext = assertOperatorContext;
exports.assertTraceContext = assertTraceContext;
exports.assertAuditContext = assertAuditContext;
exports.paginate = paginate;
const exceptions_1 = require("@oes/common/exceptions");
const sales_errors_1 = require("../../common/errors/sales.errors");
/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
function assertRequiredString(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_INVALID_ARGUMENT, { field });
    }
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
/** assertOperatorContext enforces the explicit command and query operator context contract frozen for sales-service. */
function assertOperatorContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_UNAUTHENTICATED, {
            reason: 'operator context is required'
        });
    }
    assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId');
    assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType');
    return value;
}
/** assertTraceContext enforces the explicit trace context contract frozen for sales-service. */
function assertTraceContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_UNAUTHENTICATED, {
            reason: 'trace context is required'
        });
    }
    assertNonEmptyContextField(value.traceId, 'traceContext.traceId');
    assertNonEmptyContextField(value.requestId, 'traceContext.requestId');
    return value;
}
/** assertAuditContext enforces the explicit audit context contract required by every management command. */
function assertAuditContext(value) {
    if (!value) {
        throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_UNAUTHENTICATED, {
            reason: 'audit context is required'
        });
    }
    assertNonEmptyContextField(value.auditId, 'auditContext.auditId');
    assertNonEmptyContextField(value.reason, 'auditContext.reason');
    assertNonEmptyContextField(value.source, 'auditContext.source');
    return value;
}
/** paginate slices a fully filtered record list into the standard phase 1 page envelope. */
function paginate(items, page, pageSize) {
    const start = (page - 1) * pageSize;
    return {
        pageItems: items.slice(start, start + pageSize),
        total: items.length
    };
}
/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_UNAUTHENTICATED, {
            field
        });
    }
}
//# sourceMappingURL=sales-assertions.js.map