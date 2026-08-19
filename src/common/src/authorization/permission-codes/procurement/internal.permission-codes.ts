import type { PermissionDefinitionGroup } from '../types'

export const PROCUREMENT_INTERNAL_PERMISSION_CODES = {
  RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT:
    'procurement.internal.receiving_expectation.resolve_for_receipt'
} as const

export const PROCUREMENT_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'procurement-service',
  permissions: {
    [PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT]: {
      description: '为 WMS 收货引用解析最小 ReceivingExpectation 资格事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
