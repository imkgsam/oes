import type { PermissionDefinitionGroup } from '../types'

export const SRM_INTERNAL_PERMISSION_CODES = {
  RESOLVE_ACTIVE_SUPPLIER: 'srm.internal.supplier_profile.resolve_active',
  RESOLVE_ACTIVE_SUPPLIER_OFFERING: 'srm.internal.supplier_offering.resolve_active'
} as const

export const SRM_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'srm-service',
  permissions: {
    [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER]: {
      description: '解析可用于采购的 active 供应商',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING]: {
      description: '解析可用于采购的 exact active 供应商可供应关系',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
