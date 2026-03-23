import { OperatorContextPayload } from '@oes/common/security'

export interface OperatorScope {
  operatorId: string
  tenantId?: string
  isSystemScope: boolean
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
