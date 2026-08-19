import type { PermissionDefinitionGroup } from '../types'

export const ITEM_MASTER_INTERNAL_PERMISSION_CODES = {
  RESOLVE_MANUFACTURABLE_ITEM: 'item_master.internal.manufacturable_item.resolve',
  RESOLVE_STOCKABLE_ITEM: 'item_master.internal.stockable_item.resolve',
  RESOLVE_PURCHASABLE_ITEM: 'item_master.internal.purchasable_item.resolve'
} as const

export const ITEM_MASTER_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'item-master-service',
  permissions: {
    [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM]: {
      description: '解析可制造 Item',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM]: {
      description: '解析可库存 Item',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM]: {
      description: '解析可采购 Item',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
