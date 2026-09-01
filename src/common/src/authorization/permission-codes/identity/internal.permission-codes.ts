import type { PermissionDefinitionGroup } from '../types'

export const IDENTITY_INTERNAL_PERMISSION_CODES = {
  INTEGRATION_MACHINE_RESOLVE: 'identity.internal.integration_machine.resolve',
  MACHINE_PRINCIPAL_RESOLVE: 'identity.internal.machine_principal.resolve',
  AUTH_LOGIN_ACCOUNT_RESOLVE: 'identity.internal.auth_login_account.resolve',
  PUBLIC_BUSINESS_CARD_IDENTITY_RESOLVE: 'identity.internal.public_business_card_identity.resolve'
} as const

export const IDENTITY_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'identity-service',
  permissions: {
    [IDENTITY_INTERNAL_PERMISSION_CODES.INTEGRATION_MACHINE_RESOLVE]: {
      description: '解析 Auth External API Key 交换所需的 Integration Machine 事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_INTERNAL_PERMISSION_CODES.MACHINE_PRINCIPAL_RESOLVE]: {
      description: '解析 Auth 发证所需的第一方机器主体绑定事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_INTERNAL_PERMISSION_CODES.AUTH_LOGIN_ACCOUNT_RESOLVE]: {
      description: '解析 Auth 登录与会话复核所需的账户归属事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_INTERNAL_PERMISSION_CODES.PUBLIC_BUSINESS_CARD_IDENTITY_RESOLVE]: {
      description: '解析公开名片所需的身份与公开联系方式投影',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
