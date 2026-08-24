import type { PermissionDefinitionGroup } from '../types'

export const ITEM_MASTER_MANAGEMENT_PERMISSION_CODES = {
  LIST_ITEM_MODEL: 'item_master.item_model.list',
  VIEW_ITEM_MODEL_DETAIL: 'item_master.item_model.get_by_id',
  CREATE_ITEM_MODEL: 'item_master.item_model.create',
  MANAGE_ITEM_MODEL: 'item_master.item_model.manage',
  LIST_ITEM: 'item_master.item.list',
  VIEW_ITEM_DETAIL: 'item_master.item.get_by_id',
  CREATE_ITEM: 'item_master.item.create',
  UPDATE_ITEM_BASICS: 'item_master.item.update_basics',
  UPDATE_ITEM_STATUS: 'item_master.item.update_status',
  SET_ITEM_PRIMARY_CATEGORY: 'item_master.item.set_primary_category',
  LIST_ITEM_CATEGORIES: 'item_master.item_category.list',
  CREATE_ITEM_CATEGORY: 'item_master.item_category.create',
  UPDATE_ITEM_CATEGORY_BASICS: 'item_master.item_category.update_basics',
  UPDATE_ITEM_CATEGORY_STATUS: 'item_master.item_category.update_status',
  DELETE_ITEM_CATEGORY: 'item_master.item_category.delete',
  LIST_ATTRIBUTE: 'item_master.attribute.list',
  CREATE_ATTRIBUTE: 'item_master.attribute.create',
  MANAGE_ATTRIBUTE: 'item_master.attribute.manage',
  LIST_PACKAGING: 'item_master.packaging.list',
  CREATE_PACKAGING: 'item_master.packaging.create',
  MANAGE_PACKAGING: 'item_master.packaging.manage',
  LIST_BOM: 'item_master.bom.list',
  CREATE_BOM: 'item_master.bom.create',
  MANAGE_BOM: 'item_master.bom.manage',
  SET_ITEM_CAPABILITIES: 'item_master.item.set_capabilities',
  SET_ITEM_COMPOSITION: 'item_master.item.set_composition',
  LIST_SUPPLIER_ITEM_MAPPINGS: 'item_master.supplier_item_mapping.list_by_item',
  UPSERT_SUPPLIER_ITEM_MAPPING: 'item_master.supplier_item_mapping.upsert'
} as const

export const ITEM_MASTER_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'item-master-service',
  permissions: {
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL]: {
      description: '查看 ItemModel 列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_MODEL_DETAIL]: {
      description: '查看 ItemModel 详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_MODEL]: {
      description: '创建 ItemModel',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL]: {
      description: '维护 ItemModel 基础信息、能力与分类',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM]: {
      description: '查看 Item 列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL]: {
      description: '查看 Item 详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM]: {
      description: '创建 Item',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_BASICS]: {
      description: '更新 Item 基础信息',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_STATUS]: {
      description: '更新 Item 状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_PRIMARY_CATEGORY]: {
      description: '设置或清空 Item 主分类',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_CATEGORIES]: {
      description: '查看 Item 分类列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_CATEGORY]: {
      description: '创建 Item 分类',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_BASICS]: {
      description: '更新 Item 分类基础信息',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_STATUS]: {
      description: '更新 Item 分类状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.DELETE_ITEM_CATEGORY]: {
      description: '删除未被引用的叶子 Item 分类',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE]: {
      description: '查看 Item 属性定义与选项',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE]: {
      description: '创建 Item 属性定义与选项',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE]: {
      description: '维护 Item 属性定义与选项',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING]: {
      description: '查看 Item 包装方式与包装规格',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_PACKAGING]: {
      description: '创建 Item 包装方式与包装规格',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING]: {
      description: '维护 Item 包装方式与包装规格',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM]: {
      description: '查看 Item BOM',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_BOM]: {
      description: '创建 Item BOM',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM]: {
      description: '维护 Item BOM',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_CAPABILITIES]: {
      description: '全量替换 Item 能力',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS]: {
      description: '查看 Item 的供应商型号映射',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ITEM_MAPPING]: {
      description: '新增或更新供应商型号映射',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
