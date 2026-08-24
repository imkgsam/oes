import type { PermissionDefinitionGroup } from '../types'

export const CRM_INTERNAL_PERMISSION_CODES = {
  VALIDATE_OBJECT_REFERENCE: 'crm.internal.object_reference.validate'
} as const

export const CRM_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'crm-service',
  permissions: {
    [CRM_INTERNAL_PERMISSION_CODES.VALIDATE_OBJECT_REFERENCE]: {
      description: '验证 Collaboration 引用的 CRM 对象最小事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
