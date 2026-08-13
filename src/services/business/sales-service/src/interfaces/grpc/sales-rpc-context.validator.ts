import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import {
  assertAuditContext,
  assertOperatorContext,
  assertRequiredString,
  assertTraceContext
} from '../../application/support/sales-assertions'
import { SalesAuditContext, SalesOperatorContext, SalesTraceContext } from '../../domain/models/sales-records'

export interface SalesQueryContext {
  tenantId: string
  orgId?: string
  operatorContext: SalesOperatorContext
  traceContext: SalesTraceContext
}

export interface SalesManagementContext extends SalesQueryContext {
  auditContext: SalesAuditContext
}

/** Derives every Sales authority and audit fact solely from guard-attached verified execution context. */
export class SalesRpcContextValidator {
  /** Establishes tenant, operator, organization, and correlation facts for one Sales query. */
  static assertQueryContext(request: object): SalesQueryContext {
    const context = getAuthenticatedGrpcRequestContext(request)
    const token = context?.verifiedExecutionToken
    if (!token) throw new Error('Trusted execution context is required')
    assertRequiredString(token.tenantId ?? '', 'tenantId')
    assertRequiredString(token.subject, 'operatorId')
    const correlation = context as (typeof context & { requestId?: string; traceId?: string }) | undefined
    return {
      tenantId: token.tenantId ?? '',
      ...(token.orgId === undefined ? {} : { orgId: token.orgId }),
      operatorContext: assertOperatorContext({
        operatorId: token.subject,
        operatorType: token.principalType,
        orgId: token.orgId ?? null
      }),
      traceContext: assertTraceContext({
        traceId: correlation?.traceId ?? '',
        requestId: correlation?.requestId ?? ''
      })
    }
  }

  /** Establishes trusted audit facts while preserving an optional bounded business reason. */
  static assertManagementContext(
    request: object & { reason?: string | null },
    commandName: string
  ): SalesManagementContext {
    const queryContext = this.assertQueryContext(request)
    const reason = normalizeBusinessReason(request.reason) ?? commandName
    return {
      ...queryContext,
      auditContext: assertAuditContext({
        auditId: queryContext.traceContext.requestId,
        reason,
        source: 'trusted-execution'
      })
    }
  }
}

/** Normalizes an optional command reason without allowing it to become a credential or audit authority. */
function normalizeBusinessReason(value: string | null | undefined): string | undefined {
  const normalized = value?.trim()
  if (!normalized) return undefined
  if (normalized.length > 256) throw new Error('reason must contain at most 256 characters')
  if (isRestrictedReasonMaterial(normalized)) throw new Error('reason contains restricted material')
  return normalized
}

/** Rejects structured data, secret material, and personal identifiers before any audit envelope is built. */
function isRestrictedReasonMaterial(value: string): boolean {
  if (isJson(value)) return true
  return [
    /(?:^|[^a-z0-9])(?:access[\s_-]*token|refresh[\s_-]*token|client[\s_-]*secret|password|private[\s_-]*key|api[\s_-]*key|secret|credential|authorization|bearer|token)(?:$|[^a-z0-9])/i,
    /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i,
    /\bsk_(?:live|test)_[A-Za-z0-9]+\b/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)/
  ].some((pattern) => pattern.test(value))
}

/** Detects any standalone JSON value without retaining or echoing its source text. */
function isJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
