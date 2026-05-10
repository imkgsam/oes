import { requestClient } from '#/api/request'

export namespace ItemManagementApi {
  export type ItemCapabilityKey =
    | 'assemblable'
    | 'manufacturable'
    | 'packable'
    | 'packaged'
    | 'purchasable'
    | 'sellable'
    | 'stockable'
    | 'transformable'
  export type ItemModelKind = 'DIGITAL' | 'PHYSICAL' | 'SERVICE' | 'VIRTUAL'
  export type ItemModelType =
    | 'ACCESSORY'
    | 'FINISHED_PRODUCT'
    | 'PACKAGING_MATERIAL'
    | 'PART'
    | 'RAW_MATERIAL'
    | 'SEMI_FINISHED_PRODUCT'
    | 'SERVICE'
    | 'SUB_ASSEMBLY'
    | 'VIRTUAL_KIT'
  export type ItemStatus = 'ACTIVE' | 'INACTIVE'
  export type ItemType = 'PACKAGED_FINISHED_GOOD' | 'STANDARD'
  export type BomType = 'COMPOSITION' | 'PACKAGING' | 'TRANSFORMATION'
  export type BomLineRole = 'COMPONENT' | 'PACKAGING_MATERIAL' | 'PRIMARY_INPUT'

  export interface ItemCapabilities {
    assemblable: boolean
    manufacturable: boolean
    packable: boolean
    packaged: boolean
    purchasable: boolean
    sellable: boolean
    stockable: boolean
    transformable: boolean
  }

  export interface ItemCategorySummary {
    categoryId: string
    categoryCode: string
    categoryName: string
    status: ItemStatus | string
  }

  export interface ItemCategoryNode extends ItemCategorySummary {
    hasChildren: boolean
    parentCategoryId: string
  }

  export interface ItemModelSummary {
    itemModelId: string
    modelCode: string
    modelKind: ItemModelKind | string
    modelName: string
    modelType: ItemModelType | string
    status: ItemStatus | string
  }

  export interface ItemModelRecord extends ItemModelSummary {
    capabilities: ItemCapabilities
    createdAt?: string
    primaryCategorySummary?: ItemCategorySummary
    updatedAt?: string
  }

  export interface ItemSummary {
    itemId: string
    itemModelId: string
    itemCode: string
    itemName: string
    itemType: ItemType | string
    lockedAttributeOptionIds: string[]
    packagingSpecId?: string
    status: ItemStatus | string
    capabilities: ItemCapabilities
    itemModelSummary?: ItemModelSummary
    primaryCategorySummary?: ItemCategorySummary
  }

  export interface ItemModelListQuery {
    capabilities?: ItemCapabilityKey[]
    categoryId?: string
    includeDescendants?: boolean
    keyword?: string
    modelKind?: ItemModelKind
    modelType?: ItemModelType
    page?: number
    pageSize?: number
    status?: ItemStatus
  }

  export interface ItemModelListResult {
    itemModels: ItemModelRecord[]
    page: number
    pageSize: number
    total: number
  }

  export interface ItemListQuery {
    capabilities?: ItemCapabilityKey[]
    categoryId?: string
    includeDescendants?: boolean
    itemModelId?: string
    itemType?: ItemType
    keyword?: string
    packagingSpecId?: string
    page?: number
    pageSize?: number
    status?: ItemStatus
  }

  export interface ItemListResult {
    items: ItemSummary[]
    page: number
    pageSize: number
    total: number
  }

  export interface CreateItemModelPayload {
    capabilities?: ItemCapabilities
    modelCode: string
    modelKind: ItemModelKind
    modelName: string
    modelType: ItemModelType
    primaryCategoryId?: string
  }

  export interface CreateItemPayload {
    capabilities?: ItemCapabilities
    itemCode: string
    itemModelId: string
    itemName: string
    itemType: ItemType
    lockedAttributeOptionIds?: string[]
    packagingSpecId?: string
  }

  export interface UpdateItemBasicsPayload {
    itemCode: string
    itemName: string
  }

  export interface SetItemCapabilitiesPayload {
    capabilities: ItemCapabilities
  }

  export interface ChangeStatusPayload {
    status: ItemStatus
  }

  export interface ItemCategoryListQuery {
    parentCategoryId?: string
  }

  export interface ItemCategoryListResult {
    categories: ItemCategoryNode[]
  }

  export interface CreateItemCategoryPayload {
    categoryCode: string
    categoryName: string
    parentCategoryId?: string
  }

  export interface BomLineInput {
    componentItemId: string
    lineRole: BomLineRole
    lineNote?: string
    quantity: string
    uomCode: string
  }

  export interface BomLineRecord extends BomLineInput {
    bomLineId: string
    componentItem?: ItemSummary
  }

  export interface BomRecord {
    bomId: string
    bomCode: string
    bomName: string
    bomType: BomType | string
    outputItemId: string
    status: ItemStatus | string
    lines: BomLineRecord[]
  }

  export interface BomListQuery {
    bomType?: BomType
    componentItemId?: string
    keyword?: string
    outputItemId?: string
    page?: number
    pageSize?: number
    status?: ItemStatus
  }

  export interface BomListResult {
    boms: BomRecord[]
    page: number
    pageSize: number
    total: number
  }

  export interface CreateBomPayload {
    bomCode: string
    bomName: string
    bomType: BomType
    outputItemId: string
    lines: BomLineInput[]
  }

  export interface ReplaceBomLinesPayload {
    lines: BomLineInput[]
  }

  export interface SupplierItemMappingListQuery {
    page?: number
    pageSize?: number
  }

  export interface SupplierItemMappingListEntry {
    active: boolean
    itemId: string
    supplierId: string
    supplierItemCode: string
    supplierItemName: string
  }

  export interface SupplierItemMappingRecord extends SupplierItemMappingListEntry {
    itemCode: string
    itemName: string
  }

  export interface SupplierItemMappingListResult {
    mappings: SupplierItemMappingListEntry[]
    page: number
    pageSize: number
    total: number
  }

  export interface UpsertSupplierItemMappingPayload {
    active?: boolean
    supplierId: string
    supplierItemCode?: string
    supplierItemName?: string
  }
}

// Lists tenant-scoped item models as the model-level master data entry.
export async function listManagedItemModelsApi(
  tenantId: string,
  params: ItemManagementApi.ItemModelListQuery
) {
  return requestClient.get<ItemManagementApi.ItemModelListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/item-models`,
    { params }
  )
}

// Creates one ItemModel before executable Items are derived from it.
export async function createManagedItemModelApi(
  tenantId: string,
  data: ItemManagementApi.CreateItemModelPayload
) {
  return requestClient.post<{
    itemModelId: string
    itemModel?: ItemManagementApi.ItemModelRecord
  }>(`/item-management/tenants/${encodeURIComponent(tenantId)}/item-models`, data)
}

// Lists tenant-scoped executable Items.
export async function listManagedItemsApi(
  tenantId: string,
  params: ItemManagementApi.ItemListQuery
) {
  return requestClient.get<ItemManagementApi.ItemListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items`,
    { params }
  )
}

// Loads one executable Item detail snapshot.
export async function getManagedItemByIdApi(tenantId: string, itemId: string) {
  return requestClient.get<ItemManagementApi.ItemSummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}`
  )
}

// Creates one executable Item from an ItemModel.
export async function createManagedItemApi(
  tenantId: string,
  data: ItemManagementApi.CreateItemPayload
) {
  return requestClient.post<{
    itemId: string
    item?: ItemManagementApi.ItemSummary
  }>(`/item-management/tenants/${encodeURIComponent(tenantId)}/items`, data)
}

// Updates one executable Item code and name only.
export async function updateManagedItemBasicsApi(
  tenantId: string,
  itemId: string,
  data: ItemManagementApi.UpdateItemBasicsPayload
) {
  return requestClient.request<ItemManagementApi.ItemSummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/basics`,
    { data, method: 'PATCH' }
  )
}

// Full-replaces one executable Item capability truth.
export async function setManagedItemCapabilitiesApi(
  tenantId: string,
  itemId: string,
  data: ItemManagementApi.SetItemCapabilitiesPayload
) {
  return requestClient.put<ItemManagementApi.ItemSummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/capabilities`,
    data
  )
}

// Changes one executable Item lifecycle status.
export async function changeManagedItemStatusApi(
  tenantId: string,
  itemId: string,
  data: ItemManagementApi.ChangeStatusPayload
) {
  return requestClient.request<ItemManagementApi.ItemSummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/status`,
    { data, method: 'PATCH' }
  )
}

// Lists one tenant-scoped item category tree layer for filters and management use.
export async function listManagedItemCategoriesApi(
  tenantId: string,
  params: ItemManagementApi.ItemCategoryListQuery
) {
  return requestClient.get<ItemManagementApi.ItemCategoryListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/categories`,
    { params }
  )
}

// Creates one lightweight item category node.
export async function createManagedItemCategoryApi(
  tenantId: string,
  data: ItemManagementApi.CreateItemCategoryPayload
) {
  return requestClient.post<ItemManagementApi.ItemCategorySummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/categories`,
    data
  )
}

// Lists BOMs owned by item-master.
export async function listManagedBomsApi(
  tenantId: string,
  params: ItemManagementApi.BomListQuery
) {
  return requestClient.get<ItemManagementApi.BomListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/boms`,
    { params }
  )
}

// Resolves the BOM for one output Item and optional BOM type.
export async function getManagedBomByOutputItemApi(
  tenantId: string,
  outputItemId: string,
  params: Pick<ItemManagementApi.BomListQuery, 'bomType'>
) {
  return requestClient.get<{
    bom?: ItemManagementApi.BomRecord
    resolutionStatus: number
  }>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(outputItemId)}/bom`,
    { params }
  )
}

// Creates one BOM with typed line roles.
export async function createManagedBomApi(
  tenantId: string,
  data: ItemManagementApi.CreateBomPayload
) {
  return requestClient.post<{
    bomId: string
    bom?: ItemManagementApi.BomRecord
  }>(`/item-management/tenants/${encodeURIComponent(tenantId)}/boms`, data)
}

// Full-replaces one BOM line set.
export async function replaceManagedBomLinesApi(
  tenantId: string,
  bomId: string,
  data: ItemManagementApi.ReplaceBomLinesPayload
) {
  return requestClient.put<ItemManagementApi.BomRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/boms/${encodeURIComponent(bomId)}/lines`,
    data
  )
}

// Lists the current supplier mapping rows for one Item detail page.
export async function listManagedSupplierItemMappingsApi(
  tenantId: string,
  itemId: string,
  params: ItemManagementApi.SupplierItemMappingListQuery
) {
  return requestClient.get<ItemManagementApi.SupplierItemMappingListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/supplier-mappings`,
    { params }
  )
}

// Upserts one supplier-to-Item mapping row.
export async function upsertManagedSupplierItemMappingApi(
  tenantId: string,
  itemId: string,
  data: ItemManagementApi.UpsertSupplierItemMappingPayload
) {
  return requestClient.post<ItemManagementApi.SupplierItemMappingRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/supplier-mappings`,
    data
  )
}
