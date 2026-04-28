import { SalesAuditContext, SalesOperatorContext, SalesTraceContext } from '../../domain/models/sales-records';
export interface SalesQueryContext {
    tenantId: string;
    operatorContext: SalesOperatorContext;
    traceContext: SalesTraceContext;
}
export interface SalesManagementContext extends SalesQueryContext {
    auditContext: SalesAuditContext;
}
/** SalesRpcContextValidator validates the explicit tenant, operator, trace, and audit contexts frozen in the sales contracts. */
export declare class SalesRpcContextValidator {
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
    }): SalesQueryContext;
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
    }): SalesManagementContext;
}
