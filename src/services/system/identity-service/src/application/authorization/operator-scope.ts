import { OperatorContextPayload } from '@oes/common/authorization'

export interface OperatorScope {
  operatorId: string
  tenantId?: string
  isSystemScope: boolean
}

export interface TenantQueryScope {
  tenantId?: string
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
    isSystemScope: !tenantId
  }
}

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
