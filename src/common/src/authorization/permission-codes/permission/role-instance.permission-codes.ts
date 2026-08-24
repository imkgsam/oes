import type { PermissionDefinitionGroup } from '../types'

export const ROLE_INSTANCE_PERMISSION_CODES = {
  CREATE: 'permission.role_instance.create',
  CREATE_FROM_TEMPLATE: 'permission.role_instance.create_from_template',
  UPDATE: 'permission.role_instance.update',
  DELETE: 'permission.role_instance.delete',
  ASSIGN_PERMISSIONS: 'permission.role_instance.assign_permissions',
  SYNC_FROM_TEMPLATE: 'permission.role_instance.sync_from_template',
  LIST: 'permission.role_instance.list',
  GET_BY_ID: 'permission.role_instance.get_by_id'
} as const

export const ROLE_INSTANCE_PERMISSION_DEFINITIONS = {
  ownerService: 'permission-service',
  permissions: {
    [ROLE_INSTANCE_PERMISSION_CODES.CREATE]: {
      description: '创建角色实例',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_INSTANCE_PERMISSION_CODES.CREATE_FROM_TEMPLATE]: {
      description: '从角色模板创建角色实例',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_INSTANCE_PERMISSION_CODES.UPDATE]: {
      description: '更新角色实例',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_INSTANCE_PERMISSION_CODES.DELETE]: {
      description: '删除角色实例',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_INSTANCE_PERMISSION_CODES.ASSIGN_PERMISSIONS]: {
      description: '维护角色实例权限',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_INSTANCE_PERMISSION_CODES.SYNC_FROM_TEMPLATE]: {
      description: '从模板同步角色实例权限',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_INSTANCE_PERMISSION_CODES.LIST]: {
      description: '查看角色实例列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [ROLE_INSTANCE_PERMISSION_CODES.GET_BY_ID]: {
      description: '查看角色实例详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
