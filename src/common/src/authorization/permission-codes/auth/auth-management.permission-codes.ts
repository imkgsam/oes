import type { PermissionDefinitionGroup } from '../types'

export const AUTH_MANAGEMENT_PERMISSION_CODES = {
  VIEW_AUDIT_EVENT: 'auth.audit.list',
  BOOTSTRAP_ACCOUNT_CREDENTIALS: 'auth.account_credentials.bootstrap',
  MANAGE_ACCOUNT_LOGIN_METHODS: 'auth.account_login_methods.manage',
  MANAGE_TENANT_MFA_POLICY: 'auth.mfa_policy.manage',
  MANAGE_PLATFORM_MFA_POLICY: 'auth.platform_mfa_policy.manage',
  REVOKE_MACHINE_WORKLOAD_SOURCE_CREDENTIAL: 'auth.machine_workload_source_credential.revoke'
} as const

export const AUTH_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'auth-service',
  permissions: {
    [AUTH_MANAGEMENT_PERMISSION_CODES.VIEW_AUDIT_EVENT]: {
      description: '查看认证审计事件',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [AUTH_MANAGEMENT_PERMISSION_CODES.BOOTSTRAP_ACCOUNT_CREDENTIALS]: {
      description: '初始化账号登录凭据',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_LOGIN_METHODS]: {
      description: '管理账号登录方式',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_TENANT_MFA_POLICY]: {
      description: '管理租户 MFA 策略',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [AUTH_MANAGEMENT_PERMISSION_CODES.MANAGE_PLATFORM_MFA_POLICY]: {
      description: '管理平台 MFA 策略',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [AUTH_MANAGEMENT_PERMISSION_CODES.REVOKE_MACHINE_WORKLOAD_SOURCE_CREDENTIAL]: {
      description: '撤销第一方机器工作负载源凭据',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
