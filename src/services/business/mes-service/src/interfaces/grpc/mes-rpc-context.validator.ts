import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { assertAuditContext, assertOperatorContext, assertRequiredString, assertTraceContext } from '../../application/support/mes-assertions'
import { MesAuditContext, MesOperatorContext, MesQueryContext, MesTraceContext } from '../../domain/models/mes-mold-records'

export interface MesManagementContext extends MesQueryContext { auditContext: MesAuditContext }

/** Derives MES tenant, operator, trace, and audit facts exclusively from verified trusted execution context. */
export class MesRpcContextValidator {
  /** Establishes query authority from the guard-attached ExecutionToken and transport correlation metadata. */
  static assertQueryContext(request: object): MesQueryContext {
    const context = getAuthenticatedGrpcRequestContext(request)
    const token = context?.verifiedExecutionToken
    if (!token) throw new Error('Trusted execution context is required')
    assertRequiredString(token.tenantId ?? '', 'tenantId')
    assertRequiredString(token.subject, 'operatorId')
    const correlation = context as (typeof context & { requestId?: string; traceId?: string }) | undefined
    return {
      tenantId: token.tenantId ?? '',
      ...(token.orgId === undefined ? {} : { orgId: token.orgId }),
      operatorContext: assertOperatorContext({ operatorId: token.subject, operatorType: token.principalType, orgId: token.orgId ?? null }),
      traceContext: assertTraceContext({ traceId: correlation?.traceId ?? '', requestId: correlation?.requestId ?? '' })
    }
  }

  /** Establishes an auditable command context while retaining only a bounded business reason from the request. */
  static assertManagementContext(request: object & { reason?: string | null }, commandName: string): MesManagementContext {
    const queryContext = this.assertQueryContext(request)
    return {
      ...queryContext,
      auditContext: assertAuditContext({
        auditId: queryContext.traceContext.requestId,
        reason: normalizeReason(request.reason) ?? commandName,
        source: 'trusted-execution'
      })
    }
  }
}

/** Enforces the frozen bounded reason policy without treating reason as identity or audit authority. */
function normalizeReason(value: string | null | undefined): string | undefined {
  const normalized = value?.trim()
  if (!normalized) return undefined
  if (normalized.length > 256) throw new Error('reason must contain at most 256 characters')
  if (isJson(normalized) || isRestrictedReasonMaterial(normalized)) throw new Error('reason contains restricted material')
  return normalized
}

/** Rejects structured values, credentials, and personal identifiers before audit context creation. */
function isRestrictedReasonMaterial(value: string): boolean {
  return [
    /(?:^|[^a-z0-9])(?:access[ _-]*token|refresh[ _-]*token|client[ _-]*secret|password|private[ _-]*key|api[ _-]*key|secret|credential|authorization|bearer|token)(?:$|[^a-z0-9])/i,
    /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i,
    /\bsk_(?:live|test)_[A-Za-z0-9]+\b/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)/
  ].some((pattern) => pattern.test(value))
}

/** Detects JSON objects, arrays, and scalar literals without retaining caller material. */
function isJson(value: string): boolean {
  try { JSON.parse(value); return true } catch { return false }
}

export type { MesAuditContext, MesOperatorContext, MesQueryContext, MesTraceContext }
