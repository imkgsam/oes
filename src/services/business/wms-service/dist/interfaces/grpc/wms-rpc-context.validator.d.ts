import { WmsAuditContext, WmsOperatorContext, WmsTraceContext } from '../../domain/models/wms-records';
export interface WmsQueryContext {
    tenantId: string;
    operatorContext: WmsOperatorContext;
    traceContext: WmsTraceContext;
}
export interface WmsManagementContext extends WmsQueryContext {
    auditContext: WmsAuditContext;
}
/** WmsRpcContextValidator validates the explicit tenant, operator, trace, and audit contexts frozen in the WMS contracts. */
export declare class WmsRpcContextValidator {
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
    }): WmsQueryContext;
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
    }): WmsManagementContext;
}
