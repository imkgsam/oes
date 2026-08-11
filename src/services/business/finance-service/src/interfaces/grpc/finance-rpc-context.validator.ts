import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
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
  orgId?: string
  operatorContext: FinanceOperatorContext
  traceContext: FinanceTraceContext
}

export interface FinanceManagementContext extends FinanceQueryContext {
  auditContext: FinanceAuditContext
}

/** Derives every Finance authority and audit fact solely from guard-attached verified execution context. */
export class FinanceRpcContextValidator {
  /** Establishes the tenant, operator, organization, and correlation facts for one Finance query. */
  static assertQueryContext(request: object): FinanceQueryContext {
    const context = getAuthenticatedGrpcRequestContext(request)
    const token = context?.verifiedExecutionToken
    if (!token) throw new Error('Trusted execution context is required')
    assertRequiredString(token.tenantId ?? '', 'tenantId')
    const operatorId = token.subject
    assertRequiredString(operatorId, 'operatorId')
    const correlation = context as
      | (typeof context & { requestId?: string; traceId?: string })
      | undefined
    const requestId = correlation?.requestId
    const traceId = correlation?.traceId
    return {
      tenantId: token.tenantId ?? '',
      ...(token.orgId === undefined ? {} : { orgId: token.orgId }),
      operatorContext: assertOperatorContext({
        operatorId,
        operatorType: token.principalType,
        orgId: token.orgId ?? null
      }),
      traceContext: assertTraceContext({ traceId: traceId ?? '', requestId: requestId ?? '' })
    }
  }

  /** Establishes a method-owned audit record from trusted claims rather than caller payload fields. */
  static assertManagementContext(request: object, commandName: string): FinanceManagementContext {
    const queryContext = this.assertQueryContext(request)
    return {
      ...queryContext,
      auditContext: assertAuditContext({
        auditId: queryContext.traceContext.requestId,
        reason: commandName,
        source: 'trusted-execution'
      })
    }
  }
}
