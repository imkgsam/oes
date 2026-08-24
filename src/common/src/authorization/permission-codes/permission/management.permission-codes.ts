import type { PermissionDefinitionGroup } from '../types'

export const PERMISSION_MANAGEMENT_PERMISSION_CODES = {
  CREATE_PERMISSION: 'permission.create',
  UPDATE_PERMISSION: 'permission.update',
  DELETE_PERMISSION: 'permission.delete',
  VIEW_PERMISSION: 'permission.list',
  VIEW_PERMISSION_DETAIL: 'permission.get_by_id',
  VIEW_PERMISSION_DETAIL_BY_CODE: 'permission.get_by_code',
  VIEW_AUDIT_EVENT: 'permission.audit.list',
  VIEW_NAVIGATION_ENTRY: 'permission.navigation.entry.list',
  VIEW_NAVIGATION_ENTRY_DETAIL: 'permission.navigation.entry.get_by_key',
  CREATE_NAVIGATION_ENTRY: 'permission.navigation.entry.create',
  UPDATE_NAVIGATION_ENTRY: 'permission.navigation.entry.update',
  RESOLVE_NAVIGATION_PREVIEW: 'permission.navigation.resolve_preview',
  VIEW_TERMINAL_ACCESS: 'permission.terminal_access.view',
  MANAGE_ROLE_TERMINAL_ACCESS: 'permission.terminal_access.role.manage',
  MANAGE_ACCOUNT_TERMINAL_ACCESS: 'permission.terminal_access.account.manage',
  ASSIGN_ACCOUNT_ROLE: 'permission.account.assign_roles',
  REVOKE_ACCOUNT_ROLE: 'permission.account.assign_roles',
  VIEW_ACCOUNT_ROLE: 'permission.account.get_roles',
  SET_ACCOUNT_ROLES: 'permission.account.assign_roles',
  CREATE_POLICY: 'permission.policy.create',
  UPDATE_POLICY: 'permission.policy.update',
  DELETE_POLICY: 'permission.policy.delete',
  VIEW_POLICY: 'permission.policy.list'
} as const

export const PERMISSION_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'permission-service',
  permissions: {
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.CREATE_PERMISSION]: {
      description: '创建权限定义',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_PERMISSION]: {
      description: '更新权限元数据或维护角色权限关系',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.DELETE_PERMISSION]: {
      description: '删除权限定义',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION]: {
      description: '查看权限列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION_DETAIL]: {
      description: '查看权限详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION_DETAIL_BY_CODE]: {
      description: '按权限码查看权限详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_AUDIT_EVENT]: {
      description: '查看权限审计事件',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_NAVIGATION_ENTRY]: {
      description: '查看导航项列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_NAVIGATION_ENTRY_DETAIL]: {
      description: '查看导航项详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.CREATE_NAVIGATION_ENTRY]: {
      description: '创建导航项',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_NAVIGATION_ENTRY]: {
      description: '更新导航项',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.RESOLVE_NAVIGATION_PREVIEW]: {
      description: '预览导航解析结果',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_TERMINAL_ACCESS]: {
      description: '查看账号或角色终端准入',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ROLE_TERMINAL_ACCESS]: {
      description: '维护角色默认终端准入',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_TERMINAL_ACCESS]: {
      description: '维护账号专属终端准入覆盖',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.ASSIGN_ACCOUNT_ROLE]: {
      description: '为账号分配或调整角色',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE]: {
      description: '查看账号角色',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.CREATE_POLICY]: {
      description: '创建权限策略',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_POLICY]: {
      description: '更新权限策略',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY]: {
      description: '查看权限策略列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
