import type { PermissionDefinitionGroup } from '../types'

export const SRM_MANAGEMENT_PERMISSION_CODES = {
  LIST_SUPPLIER_PROFILE: 'srm.supplier_profile.list',
  VIEW_SUPPLIER_DETAIL: 'srm.supplier_profile.get_by_id',
  CREATE_SUPPLIER_PROFILE: 'srm.supplier_profile.create',
  UPDATE_SUPPLIER_PROFILE_BASICS: 'srm.supplier_profile.update_basics',
  BIND_SUPPLIER_TO_TENANT_PARTY: 'srm.supplier_profile.bind_tenant_party',
  CHANGE_SUPPLIER_STATUS: 'srm.supplier_profile.change_status',
  UPSERT_SUPPLIER_CONTACT: 'srm.supplier_contact.upsert',
  UPSERT_SUPPLIER_ADDRESS: 'srm.supplier_address.upsert',
  LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER: 'srm.supplier_offering.list_by_supplier',
  LIST_SUPPLIER_OFFERINGS_BY_ITEM: 'srm.supplier_offering.list_by_item',
  UPSERT_SUPPLIER_OFFERING: 'srm.supplier_offering.upsert'
} as const

export const SRM_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'srm-service',
  permissions: {
    [SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_PROFILE]: {
      description: '查看 SRM 供应商列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL]: {
      description: '查看 SRM 供应商详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.CREATE_SUPPLIER_PROFILE]: {
      description: '创建 SRM 供应商档案外壳',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.UPDATE_SUPPLIER_PROFILE_BASICS]: {
      description: '更新 SRM 供应商基础信息',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.BIND_SUPPLIER_TO_TENANT_PARTY]: {
      description: '绑定 SRM 供应商到租户主体',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.CHANGE_SUPPLIER_STATUS]: {
      description: '切换 SRM 供应商状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_CONTACT]: {
      description: '新增或更新 SRM 供应商联系人',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ADDRESS]: {
      description: '新增或更新 SRM 供应商地址',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER]: {
      description: '查看供应商可供应 Item 列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_ITEM]: {
      description: '查看可供应指定 Item 的供应商列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_OFFERING]: {
      description: '新增或更新供应商可供应关系',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
