import { OperatorContextPayload } from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTHORIZATION_DENIED } from '../../common/constants/exception-enums'
import { ScopeLevel } from '../../domain/enums/scope-level.enum'

export interface OperatorScope {
  operatorId: string
  tenantId?: string
  isSystemScope: boolean
  requestId?: string
  traceId?: string
}

export interface RoleInstanceQueryScope {
  tenantId?: string
  scopeLevel?: ScopeLevel
}

export interface TenantBoundQueryScope {
  tenantId: string
}

export interface AccountRoleQueryScope {
  tenantId: string | null
  scopeLevel: ScopeLevel
}

export interface SystemQueryScope {
  systemScopeOnly: true
}

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
    isSystemScope: !tenantId,
    requestId: operatorContext?.request_id?.trim() || undefined,
    traceId: operatorContext?.trace_id?.trim() || undefined
  }
}

export function assertSystemScope(operatorScope: OperatorScope | undefined, reason: string): void {
  if (operatorScope && !operatorScope.isSystemScope) {
    throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
      operatorId: operatorScope.operatorId,
      tenantId: operatorScope.tenantId,
      reason
    })
  }
}

export function assertTenantAccess(
  operatorScope: OperatorScope | undefined,
  tenantId: string | null | undefined,
  details?: Record<string, unknown>
): void {
  if (!operatorScope || operatorScope.isSystemScope) {
    return
  }

  if (!tenantId || tenantId !== operatorScope.tenantId) {
    throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
      operatorId: operatorScope.operatorId,
      tenantId: operatorScope.tenantId,
      resourceTenantId: tenantId ?? null,
      ...details
    })
  }
}

export function assertRoleScopeAccess(
  operatorScope: OperatorScope | undefined,
  scopeLevel: ScopeLevel,
  tenantId?: string | null,
  details?: Record<string, unknown>
): void {
  if (scopeLevel === ScopeLevel.SYSTEM) {
    assertSystemScope(operatorScope, 'system role scope requires system operator scope')
    return
  }

  assertTenantAccess(operatorScope, tenantId, details)
}

export function buildRoleInstanceQueryScope(
  operatorScope: OperatorScope | undefined,
  requestedTenantId?: string | null,
  requestedScopeLevel?: ScopeLevel | null
): RoleInstanceQueryScope {
  const normalizedRequestedTenantId = requestedTenantId?.trim() || undefined
  const normalizedScopeLevel = requestedScopeLevel ?? undefined

  if (operatorScope && !operatorScope.isSystemScope) {
    if (normalizedScopeLevel === ScopeLevel.SYSTEM) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        operatorId: operatorScope.operatorId,
        tenantId: operatorScope.tenantId,
        requestedScopeLevel: normalizedScopeLevel
      })
    }

    if (normalizedRequestedTenantId && normalizedRequestedTenantId !== operatorScope.tenantId) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        operatorId: operatorScope.operatorId,
        tenantId: operatorScope.tenantId,
        requestedTenantId: normalizedRequestedTenantId
      })
    }

    return {
      tenantId: operatorScope.tenantId,
      scopeLevel: ScopeLevel.TENANT
    }
  }

  return {
    tenantId: normalizedScopeLevel === ScopeLevel.SYSTEM ? undefined : normalizedRequestedTenantId,
    scopeLevel: normalizedScopeLevel
  }
}

export function buildAccountRoleQueryScope(
  operatorScope: OperatorScope | undefined,
  scopeLevel: ScopeLevel,
  tenantId?: string | null
): AccountRoleQueryScope {
  const normalizedTenantId = tenantId?.trim() || null
  assertRoleScopeAccess(operatorScope, scopeLevel, normalizedTenantId, {
    requestedTenantId: normalizedTenantId,
    requestedScopeLevel: scopeLevel
  })

  if (scopeLevel === ScopeLevel.SYSTEM) {
    return { tenantId: null, scopeLevel }
  }

  if (!normalizedTenantId && (!operatorScope || operatorScope.isSystemScope)) {
    throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
      operatorId: operatorScope?.operatorId,
      requestedScopeLevel: scopeLevel,
      reason: 'tenant role scope requires tenantId'
    })
  }

  return {
    tenantId:
      operatorScope && !operatorScope.isSystemScope ? operatorScope.tenantId! : normalizedTenantId!,
    scopeLevel
  }
}

export function buildTenantBoundQueryScope(
  operatorScope: OperatorScope | undefined,
  tenantId: string,
  details?: Record<string, unknown>
): TenantBoundQueryScope {
  const normalizedTenantId = tenantId.trim()

  assertTenantAccess(operatorScope, normalizedTenantId, details)

  return {
    tenantId:
      operatorScope && !operatorScope.isSystemScope ? operatorScope.tenantId! : normalizedTenantId
  }
}

export function buildSystemQueryScope(
  operatorScope: OperatorScope | undefined,
  reason: string
): SystemQueryScope {
  assertSystemScope(operatorScope, reason)

  return {
    systemScopeOnly: true
  }
}
