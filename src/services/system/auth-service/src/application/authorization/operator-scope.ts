import { OperatorContextPayload } from '@oes/common/authorization'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'

// Defines the auth-service operator scope projection used by query-scope authorization.
export interface OperatorScope {
  operatorId: string
  tenantId?: string
  isSystemScope: boolean
}

// Carries the tenant constraint derived from operator scope for auth-service queries.
export interface TenantQueryScope {
  tenantId?: string
}

// Resolves the shared operator context payload into the local auth-service operator scope view.
export function resolveOperatorScope(
  operatorContext: OperatorContextPayload | undefined
): OperatorScope | undefined {
  const operatorId = operatorContext?.operator_id?.trim()
  if (!operatorId) {
    return undefined
  }

  const tenantId = operatorContext?.tenant_id?.trim() || undefined

  return {
    operatorId,
    tenantId,
    isSystemScope: !tenantId
  }
}

// Builds a tenant-bound query scope that follows the current operator tenant boundary.
export function buildTenantQueryScope(
  operatorScope: OperatorScope | undefined
): TenantQueryScope {
  if (!operatorScope || operatorScope.isSystemScope) {
    return {}
  }

  return {
    tenantId: operatorScope.tenantId
  }
}

// Builds a tenant-bound query scope while rejecting mismatched requested tenant filters.
export function buildRequestedTenantQueryScope(
  operatorScope: OperatorScope | undefined,
  requestedTenantId?: string | null
): TenantQueryScope {
  const normalizedRequestedTenantId = requestedTenantId?.trim() || undefined

  if (!operatorScope || operatorScope.isSystemScope) {
    return {
      tenantId: normalizedRequestedTenantId
    }
  }

  if (
    normalizedRequestedTenantId &&
    normalizedRequestedTenantId !== operatorScope.tenantId
  ) {
    throw ExceptionFactory.application(ACCESS_DENIED, {
      operatorId: operatorScope.operatorId,
      tenantId: operatorScope.tenantId,
      requestedTenantId: normalizedRequestedTenantId
    })
  }

  return {
    tenantId: operatorScope.tenantId
  }
}
