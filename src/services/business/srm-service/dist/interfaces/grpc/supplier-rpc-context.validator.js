"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierRpcContextValidator = void 0;
const srm_assertions_1 = require("../../application/support/srm-assertions");
/** SupplierRpcContextValidator validates the explicit tenant, operator, trace, and audit contexts frozen in SRM contracts. */
class SupplierRpcContextValidator {
    /** assertQueryContext validates the read-path explicit tenant, operator, and trace context payload. */
    static assertQueryContext(request) {
        (0, srm_assertions_1.assertRequiredString)(request.tenantId ?? '', 'tenantId');
        return {
            tenantId: request.tenantId ?? '',
            operatorContext: (0, srm_assertions_1.assertOperatorContext)(request.operatorContext
                ? {
                    operatorId: request.operatorContext.operatorId ?? '',
                    operatorType: request.operatorContext.operatorType ?? '',
                    orgId: request.operatorContext.orgId ?? null
                }
                : null),
            traceContext: (0, srm_assertions_1.assertTraceContext)(request.traceContext
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
            auditContext: (0, srm_assertions_1.assertAuditContext)(request.auditContext
                ? {
                    auditId: request.auditContext.auditId ?? '',
                    reason: request.auditContext.reason ?? '',
                    source: request.auditContext.source ?? ''
                }
                : null)
        };
    }
}
exports.SupplierRpcContextValidator = SupplierRpcContextValidator;
//# sourceMappingURL=supplier-rpc-context.validator.js.map