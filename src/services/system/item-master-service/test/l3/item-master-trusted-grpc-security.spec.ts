import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import {
  ITEM_MASTER_INTERNAL_PERMISSION_CODES,
  ITEM_MASTER_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { ItemMasterInternalQueryGrpcController } from '../../src/interfaces/grpc/item-master-internal-query.grpc.controller'
import { ItemMasterManagementGrpcController } from '../../src/interfaces/grpc/item-master-management.grpc.controller'
import { ItemMasterQueryGrpcController } from '../../src/interfaces/grpc/item-master-query.grpc.controller'
import { ITEM_MASTER_INTERNAL_WORKLOAD_ALLOWLIST } from '../../src/modules/item-master-trusted-execution.module'

const queryCodes = {
  getItemModel: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_MODEL_DETAIL,
  batchGetItemModels: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
  searchItemModels: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
  listAttributeDefinitions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  listAttributeOptions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  getItemModelAttributeRules: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  getItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
  batchGetItems: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
  searchItems: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
  resolveItemVariant: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
  listItemCategories: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_CATEGORIES,
  listPackagingMethods: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  getPackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  searchPackagingSpecs: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  getBom: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  searchBoms: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  getBomByOutputItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  listSupplierItemMappingsByItem:
    ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS,
  resolveSupplierItemMapping: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS
} as const

const managementCodes = {
  createItemModel: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_MODEL,
  updateItemModelBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  setItemModelCapabilities: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  changeItemModelStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  setItemModelPrimaryCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_PRIMARY_CATEGORY,
  createAttributeDefinition: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
  updateAttributeDefinition: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  createAttributeOption: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
  updateAttributeOption: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  setItemModelAttributeRules: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  createItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM,
  updateItemBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_BASICS,
  setItemCapabilities: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_CAPABILITIES,
  changeItemStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_STATUS,
  createItemCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_CATEGORY,
  updateItemCategoryBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_BASICS,
  moveItemCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_BASICS,
  changeItemCategoryStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_STATUS,
  deleteItemCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.DELETE_ITEM_CATEGORY,
  createPackagingMethod: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_PACKAGING,
  updatePackagingMethod: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  changePackagingMethodStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  deletePackagingMethod: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  createPackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_PACKAGING,
  updatePackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  changePackagingSpecStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  createBom: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_BOM,
  updateBomBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
  replaceBomLines: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
  changeBomStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
  upsertSupplierItemMapping: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ITEM_MAPPING
} as const

const internalCodes = {
  resolveManufacturableItem: ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM,
  resolveStockableItem: ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM,
  resolvePurchasableItem: ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM
} as const

/** Locks all 53 Item Master RPCs to their frozen authorization modes and exact codes. */
describe('Item Master trusted gRPC security matrix L3', () => {
  it('declares all 50 HUMAN/WEB RPCs with one exact BUSINESS code', () => {
    const entries = [
      ...Object.entries(queryCodes).map(
        (entry) => [ItemMasterQueryGrpcController.prototype, ...entry] as const
      ),
      ...Object.entries(managementCodes).map(
        (entry) => [ItemMasterManagementGrpcController.prototype, ...entry] as const
      )
    ]
    expect(entries).toHaveLength(50)
    for (const [prototype, method, code] of entries) {
      expect(getRpcAuthorizationModeDeclaration(prototype, method)).toEqual({
        mode: 'BUSINESS',
        permissions: { all: [code] },
        principalType: 'HUMAN',
        sessionTerminal: 'WEB'
      })
    }
  })

  it('declares the three workload-only RPCs with exact INTERNAL allowlists', () => {
    expect(Object.keys(internalCodes)).toHaveLength(3)
    for (const [method, code] of Object.entries(internalCodes)) {
      expect(
        getRpcAuthorizationModeDeclaration(ItemMasterInternalQueryGrpcController.prototype, method)
      ).toEqual({
        mode: 'INTERNAL',
        permissions: { all: [code] }
      })
    }
    expect(ITEM_MASTER_INTERNAL_WORKLOAD_ALLOWLIST).toEqual({
      [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM]: ['mes-service'],
      [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM]: ['wms-service'],
      [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM]: [
        'procurement-service',
        'srm-service'
      ]
    })
  })
})
