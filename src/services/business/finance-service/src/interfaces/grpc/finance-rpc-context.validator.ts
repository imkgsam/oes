import {
  assertAuditContext,
  assertOperatorContext,
  assertRequiredString,
  assertTraceContext
} from '../../application/support/finance-assertions'
import {
  FinanceAuditContext,
  FinanceOperatorContext,
  FinanceTraceContext
} from '../../domain/models/finance-records'

export interface FinanceQueryContext {
  tenantId: string
  operatorContext: FinanceOperatorContext
  traceContext: FinanceTraceContext
}

export interface FinanceManagementContext extends FinanceQueryContext {
  auditContext: FinanceAuditContext
}

/** FinanceRpcContextValidator validates the explicit tenant, operator, trace, and audit contexts frozen in the finance contracts. */
export class FinanceRpcContextValidator {
  /** assertQueryContext validates the read-path explicit tenant, operator, and trace context payload. */
  static assertQueryContext(request: {
    tenantId?: string
    operatorContext?: {
      operatorId?: string | null
      operatorType?: string | null
      orgId?: string | null
    } | null
    traceContext?: {
      traceId?: string | null
      requestId?: string | null
    } | null
  }): FinanceQueryContext {
    assertRequiredString(request.tenantId ?? '', 'tenantId')
    return {
      tenantId: request.tenantId ?? '',
      operatorContext: assertOperatorContext(
        request.operatorContext
          ? {
              operatorId: request.operatorContext.operatorId ?? '',
              operatorType: request.operatorContext.operatorType ?? '',
              orgId: request.operatorContext.orgId ?? null
            }
          : null
      ),
      traceContext: assertTraceContext(
        request.traceContext
          ? {
              traceId: request.traceContext.traceId ?? '',
              requestId: request.traceContext.requestId ?? ''
            }
          : null
      )
    }
  }

  /** assertManagementContext validates the write-path explicit tenant, operator, trace, and audit contexts. */
  static assertManagementContext(request: {
    tenantId?: string
    operatorContext?: {
      operatorId?: string | null
      operatorType?: string | null
      orgId?: string | null
    } | null
    traceContext?: {
      traceId?: string | null
      requestId?: string | null
    } | null
    auditContext?: {
      auditId?: string | null
      reason?: string | null
      source?: string | null
    } | null
  }): FinanceManagementContext {
    const queryContext = this.assertQueryContext(request)
    return {
      ...queryContext,
      auditContext: assertAuditContext(
        request.auditContext
          ? {
              auditId: request.auditContext.auditId ?? '',
              reason: request.auditContext.reason ?? '',
              source: request.auditContext.source ?? ''
            }
          : null
      )
    }
  }
}
