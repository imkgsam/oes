import { Metadata } from '@grpc/grpc-js'
import { ITEM_MASTER_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ItemMasterManagementGrpcAdapter } from './item-master-management-grpc.adapter'
import { ItemMasterQueryGrpcAdapter } from './item-master-query-grpc.adapter'

const audience = 'urn:oes:service:item-master-service'
const source = {
  user: { holderId: 'holder-1', sid: 'session-1', terminal: 'WEB' },
  requestId: 'request-1',
  traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
}

const queryCodes = {
  searchItemModels: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
  getItemModel: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_MODEL_DETAIL,
  searchItems: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
  getItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
  listAttributeDefinitions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  listAttributeOptions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  getItemModelAttributeRules: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  listItemCategories: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_CATEGORIES,
  listPackagingMethods: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  getPackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  searchPackagingSpecs: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  searchBoms: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  getBom: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  getBomByOutputItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  listSupplierItemMappingsByItem:
    ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS
} as const

const managementCodes = {
  createItemModel: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_MODEL,
  updateItemModelBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  setItemModelCapabilities: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  changeItemModelStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  setItemModelPrimaryCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_PRIMARY_CATEGORY,
  createItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM,
  updateItemBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_BASICS,
  setItemCapabilities: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_CAPABILITIES,
  changeItemStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_STATUS,
  createAttributeDefinition: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
  updateAttributeDefinition: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  createAttributeOption: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
  updateAttributeOption: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  setItemModelAttributeRules: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
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

/** Verifies every active Gateway Item Master adapter call uses HUMAN trusted execution and no body tenant. */
describe('Gateway Item Master trusted adapters', () => {
  it.each([
    ['query', ItemMasterQueryGrpcAdapter, queryCodes],
    ['management', ItemMasterManagementGrpcAdapter, managementCodes]
  ] as const)(
    'maps the complete %s adapter surface to exact target codes',
    async (kind, Adapter, codes) => {
      const calls = new Map<string, jest.Mock>()
      const service = new Proxy(
        {},
        {
          get: (_target, method: string) => {
            const call = calls.get(method) ?? jest.fn(() => of({}))
            calls.set(method, call)
            return call
          }
        }
      )
      const client = kind === 'query' ? { query: () => service } : { management: () => service }
      const trustedExecution = { forBusinessCall: jest.fn(async () => new Metadata()) }
      const adapter = new Adapter(client as never, trustedExecution as never) as any
      adapter.onModuleInit()

      for (const [method, code] of Object.entries(codes)) {
        await adapter[method]({ tenantId: 'retired-body-authority', id: 'value' }, source)
        expect(trustedExecution.forBusinessCall).toHaveBeenLastCalledWith(source, audience, [code])
        expect(calls.get(method)).toHaveBeenLastCalledWith({ id: 'value' }, expect.any(Metadata))
      }
      expect(trustedExecution.forBusinessCall).toHaveBeenCalledTimes(Object.keys(codes).length)
    }
  )
})
