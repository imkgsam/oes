import type { PermissionDefinitionGroup } from '../types'

export const HR_INTERNAL_PERMISSION_CODES = {
  AUTH_LOGIN_EMPLOYEE_RESOLVE: 'hr.internal.auth_login_employee.resolve',
  PUBLIC_BUSINESS_CARD_EMPLOYEE_RESOLVE: 'hr.internal.public_business_card_employee.resolve'
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
    },
    [HR_INTERNAL_PERMISSION_CODES.PUBLIC_BUSINESS_CARD_EMPLOYEE_RESOLVE]: {
      description: '解析公开名片所需的在职员工公开投影',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
