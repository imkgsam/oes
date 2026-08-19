import type { PermissionDefinitionGroup } from '../types'

export const WMS_MANAGEMENT_PERMISSION_CODES = {
  READ_WAREHOUSE: 'wms.warehouse.read',
  READ_LOCATION: 'wms.location.read',
  READ_RECEIPT: 'wms.receipt.read',
  MANAGE_RECEIPT: 'wms.receipt.manage',
  READ_INVENTORY: 'wms.inventory.read'
} as const

export const WMS_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'wms-service',
  permissions: {
    [WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE]: {
      description: '查看仓库列表与仓库详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION]: {
      description: '查看库位列表与库位详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT]: {
      description: '查看收货单与收货行目录及详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT]: {
      description: '创建收货草稿、替换草稿行并执行过账或取消',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY]: {
      description: '查看库存余额与库存总账目录及详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
