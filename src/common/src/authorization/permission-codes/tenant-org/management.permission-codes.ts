import type { PermissionDefinitionGroup } from '../types'

export const TENANT_ORG_MANAGEMENT_PERMISSION_CODES = {
  LIST_TENANT: 'tenant_org.tenant.list',
  VIEW_TENANT_DETAIL: 'tenant_org.tenant.get_by_id',
  CREATE_TENANT: 'tenant_org.tenant.create',
  UPDATE_TENANT_PROFILE: 'tenant_org.tenant.update_profile',
  UPDATE_TENANT_STATUS: 'tenant_org.tenant.update_status',
  LIST_ORG_TREE: 'tenant_org.org_unit.list_tree',
  VIEW_ORG_UNIT_DETAIL: 'tenant_org.org_unit.get_by_id',
  CREATE_ORG_UNIT: 'tenant_org.org_unit.create',
  UPDATE_ORG_UNIT: 'tenant_org.org_unit.update',
  ARCHIVE_ORG_UNIT: 'tenant_org.org_unit.archive'
} as const

export const TENANT_ORG_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'tenant-org-service',
  permissions: {
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_TENANT]: {
      description: '查看租户列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_TENANT_DETAIL]: {
      description: '查看租户详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT]: {
      description: '创建租户',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_PROFILE]: {
      description: '更新租户基础信息',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_STATUS]: {
      description: '更新租户状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_ORG_TREE]: {
      description: '查看组织树',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_ORG_UNIT_DETAIL]: {
      description: '查看组织节点详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_ORG_UNIT]: {
      description: '创建组织节点',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_ORG_UNIT]: {
      description: '更新组织节点',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [TENANT_ORG_MANAGEMENT_PERMISSION_CODES.ARCHIVE_ORG_UNIT]: {
      description: '归档组织节点',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
