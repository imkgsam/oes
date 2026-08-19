import type { PermissionDefinitionGroup } from '../types'

export const HR_MANAGEMENT_PERMISSION_CODES = {
  LIST_EMPLOYEE: 'hr.employee.list',
  VIEW_EMPLOYEE_DETAIL: 'hr.employee.get_by_id',
  CREATE_EMPLOYEE: 'hr.employee.create',
  CREATE_EMPLOYMENT: 'hr.employment.create',
  END_EMPLOYMENT: 'hr.employment.end',
  CHANGE_PRIMARY_EMPLOYMENT: 'hr.employment.change_primary'
} as const

export const HR_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'hr-service',
  permissions: {
    [HR_MANAGEMENT_PERMISSION_CODES.LIST_EMPLOYEE]: {
      description: '查看员工列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [HR_MANAGEMENT_PERMISSION_CODES.VIEW_EMPLOYEE_DETAIL]: {
      description: '查看员工详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE]: {
      description: '创建员工主档',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYMENT]: {
      description: '创建员工任职',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [HR_MANAGEMENT_PERMISSION_CODES.END_EMPLOYMENT]: {
      description: '结束员工任职',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [HR_MANAGEMENT_PERMISSION_CODES.CHANGE_PRIMARY_EMPLOYMENT]: {
      description: '调岗并切换主任职',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
