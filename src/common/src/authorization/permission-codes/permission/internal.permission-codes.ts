import type { PermissionDefinitionGroup } from '../types'

export const PERMISSION_INTERNAL_PERMISSION_CODES = {
  PERMISSION_CHECK: 'permission.internal.permission.check',
  ACCOUNT_TERMINAL_ACCESS_RESOLVE: 'permission.internal.account_terminal_access.resolve',
  RESOURCE_CHECK: 'permission.internal.resource.check',
  QUERY_SCOPE_BUILD: 'permission.internal.query_scope.build',
  ACCOUNT_ACCESS_SUMMARY_RESOLVE: 'permission.internal.account_access_summary.resolve',
  ACCOUNT_NAVIGATION_RESOLVE: 'permission.internal.account_navigation.resolve',
  PRINCIPAL_AUTHORIZATION_RESOLVE: 'permission.internal.principal_authorization.resolve',
  DELEGATED_AUTHORIZATION_RESOLVE: 'permission.internal.delegated_authorization.resolve'
} as const

export const PERMISSION_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'permission-service',
  permissions: {
    [PERMISSION_INTERNAL_PERMISSION_CODES.PERMISSION_CHECK]: {
      description: '执行受信任调用链中的精确权限检查',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_INTERNAL_PERMISSION_CODES.ACCOUNT_TERMINAL_ACCESS_RESOLVE]: {
      description: '解析受信任调用链中的账号终端准入',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_INTERNAL_PERMISSION_CODES.RESOURCE_CHECK]: {
      description: '执行受信任调用链中的资源授权检查',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_INTERNAL_PERMISSION_CODES.QUERY_SCOPE_BUILD]: {
      description: '构造受信任调用链中的资源查询范围',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_INTERNAL_PERMISSION_CODES.ACCOUNT_ACCESS_SUMMARY_RESOLVE]: {
      description: '解析受信任调用链中的账号访问摘要',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_INTERNAL_PERMISSION_CODES.ACCOUNT_NAVIGATION_RESOLVE]: {
      description: '解析受信任调用链中的账号导航',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE]: {
      description: '解析 Auth 发证所需的 principal BUSINESS authorization upper bound',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_INTERNAL_PERMISSION_CODES.DELEGATED_AUTHORIZATION_RESOLVE]: {
      description: '解析 Auth 编排的 delegated action authorization upper bound',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
