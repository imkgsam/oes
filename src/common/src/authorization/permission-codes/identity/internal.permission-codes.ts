import type { PermissionDefinitionGroup } from '../types'

export const IDENTITY_INTERNAL_PERMISSION_CODES = {
  MACHINE_PRINCIPAL_RESOLVE: 'identity.internal.machine_principal.resolve'
} as const

export const IDENTITY_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'identity-service',
  permissions: {
    [IDENTITY_INTERNAL_PERMISSION_CODES.MACHINE_PRINCIPAL_RESOLVE]: {
      description: '解析 Auth 发证所需的第一方机器主体绑定事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
