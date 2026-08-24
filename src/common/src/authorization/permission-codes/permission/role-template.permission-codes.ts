import type { PermissionDefinitionGroup } from '../types'

export const ROLE_TEMPLATE_PERMISSION_CODES = {
  CREATE: 'permission.role_template.create',
  UPDATE: 'permission.role_template.update',
  DELETE: 'permission.role_template.delete',
  ASSIGN_PERMISSIONS: 'permission.role_template.assign_permissions',
  LIST: 'permission.role_template.list',
  GET_BY_ID: 'permission.role_template.get_by_id'
} as const

export const ROLE_TEMPLATE_PERMISSION_DEFINITIONS = {
  ownerService: 'permission-service',
  permissions: {
    [ROLE_TEMPLATE_PERMISSION_CODES.CREATE]: {
      description: '创建系统角色模板',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [ROLE_TEMPLATE_PERMISSION_CODES.UPDATE]: {
      description: '更新系统角色模板',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [ROLE_TEMPLATE_PERMISSION_CODES.DELETE]: {
      description: '删除系统角色模板',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [ROLE_TEMPLATE_PERMISSION_CODES.ASSIGN_PERMISSIONS]: {
      description: '维护系统角色模板权限',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [ROLE_TEMPLATE_PERMISSION_CODES.LIST]: {
      description: '查看角色模板列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_TEMPLATE_PERMISSION_CODES.GET_BY_ID]: {
      description: '查看角色模板详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
