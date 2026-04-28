import { SrmAuditContext, SrmOperatorContext, SrmTraceContext } from '../../domain/models/srm-records';
export interface SrmQueryContext {
    tenantId: string;
    operatorContext: SrmOperatorContext;
    traceContext: SrmTraceContext;
}
export interface SrmManagementContext extends SrmQueryContext {
    auditContext: SrmAuditContext;
}
/** SupplierRpcContextValidator validates the explicit tenant, operator, trace, and audit contexts frozen in SRM contracts. */
export declare class SupplierRpcContextValidator {
    /** assertQueryContext validates the read-path explicit tenant, operator, and trace context payload. */
    static assertQueryContext(request: {
        tenantId?: string;
        operatorContext?: {
            operatorId?: string | null;
            operatorType?: string | null;
            orgId?: string | null;
        } | null;
        traceContext?: {
            traceId?: string | null;
            requestId?: string | null;
        } | null;
    }): SrmQueryContext;
    /** assertManagementContext validates the write-path explicit tenant, operator, trace, and audit contexts. */
    static assertManagementContext(request: {
        tenantId?: string;
        operatorContext?: {
            operatorId?: string | null;
            operatorType?: string | null;
            orgId?: string | null;
        } | null;
        traceContext?: {
            traceId?: string | null;
            requestId?: string | null;
        } | null;
        auditContext?: {
            auditId?: string | null;
            reason?: string | null;
            source?: string | null;
        } | null;
    }): SrmManagementContext;
}
