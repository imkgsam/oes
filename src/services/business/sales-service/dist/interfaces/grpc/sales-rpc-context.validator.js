"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesRpcContextValidator = void 0;
const sales_assertions_1 = require("../../application/support/sales-assertions");
/** SalesRpcContextValidator validates the explicit tenant, operator, trace, and audit contexts frozen in the sales contracts. */
class SalesRpcContextValidator {
    /** assertQueryContext validates the read-path explicit tenant, operator, and trace context payload. */
    static assertQueryContext(request) {
        (0, sales_assertions_1.assertRequiredString)(request.tenantId ?? '', 'tenantId');
        return {
            tenantId: request.tenantId ?? '',
            operatorContext: (0, sales_assertions_1.assertOperatorContext)(request.operatorContext
                ? {
                    operatorId: request.operatorContext.operatorId ?? '',
                    operatorType: request.operatorContext.operatorType ?? '',
                    orgId: request.operatorContext.orgId ?? null
                }
                : null),
            traceContext: (0, sales_assertions_1.assertTraceContext)(request.traceContext
                ? {
                    traceId: request.traceContext.traceId ?? '',
                    requestId: request.traceContext.requestId ?? ''
                }
                : null)
        };
    }
    /** assertManagementContext validates the write-path explicit tenant, operator, trace, and audit contexts. */
    static assertManagementContext(request) {
        const queryContext = this.assertQueryContext(request);
        return {
            ...queryContext,
            auditContext: (0, sales_assertions_1.assertAuditContext)(request.auditContext
                ? {
                    auditId: request.auditContext.auditId ?? '',
                    reason: request.auditContext.reason ?? '',
                    source: request.auditContext.source ?? ''
                }
                : null)
        };
    }
}
exports.SalesRpcContextValidator = SalesRpcContextValidator;
//# sourceMappingURL=sales-rpc-context.validator.js.map