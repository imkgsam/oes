import type { PermissionDefinitionGroup } from '../types'

export const HR_INTERNAL_PERMISSION_CODES = {
  AUTH_LOGIN_EMPLOYEE_RESOLVE: 'hr.internal.auth_login_employee.resolve'
} as const

export const HR_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'hr-service',
  permissions: {
    [HR_INTERNAL_PERMISSION_CODES.AUTH_LOGIN_EMPLOYEE_RESOLVE]: {
      description: '解析 Auth 登录所需的在职员工归属事实',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
