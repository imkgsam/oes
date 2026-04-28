import { ProcurementAuditContext, ProcurementOperatorContext, ProcurementTraceContext } from '../../domain/models/procurement-records';
export interface ProcurementQueryContext {
    tenantId: string;
    operatorContext: ProcurementOperatorContext;
    traceContext: ProcurementTraceContext;
}
export interface ProcurementManagementContext extends ProcurementQueryContext {
    auditContext: ProcurementAuditContext;
}
/** ProcurementRpcContextValidator validates the explicit tenant, operator, trace, and audit contexts frozen in the procurement contracts. */
export declare class ProcurementRpcContextValidator {
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
    }): ProcurementQueryContext;
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
    }): ProcurementManagementContext;
}
