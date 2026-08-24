import type { PermissionDefinitionGroup } from '../types'

export const AUTH_INTERNAL_PERMISSION_CODES = {
  EXTERNAL_API_KEY_EXCHANGE: 'auth.internal.external_api_key.exchange',
  EXTERNAL_API_KEY_VERIFIER_VERSION_COMPROMISE:
    'auth.internal.external_api_key.verifier_version.compromise'
} as const

export const AUTH_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'auth-service',
  permissions: {
    [AUTH_INTERNAL_PERMISSION_CODES.EXTERNAL_API_KEY_EXCHANGE]: {
      description: '受理 Gateway 发起的 External API Key 内部交换',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [AUTH_INTERNAL_PERMISSION_CODES.EXTERNAL_API_KEY_VERIFIER_VERSION_COMPROMISE]: {
      description: '触发 External API Key verifier version compromise 的内部安全处置调用',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
