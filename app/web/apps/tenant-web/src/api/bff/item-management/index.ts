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
  export type ItemCategoryStatus = ItemStatus
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

  export interface UpdateItemModelBasicsPayload {
    modelCode: string
    modelName: string
  }

  export interface SetItemModelCapabilitiesPayload {
    capabilities: ItemCapabilities
  }

  export interface SetItemModelPrimaryCategoryPayload {
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

  export interface UpdateItemCategoryBasicsPayload {
    categoryCode: string
    categoryName: string
  }

  export interface MoveItemCategoryPayload {
    parentCategoryId?: string
  }

  export interface AttributeDefinitionRecord {
    attributeDefinitionId: string
    attributeCode: string
    attributeName: string
    optionCount: number
    status: ItemStatus | string
  }

  export interface AttributeDefinitionListQuery {
    keyword?: string
    page?: number
    pageSize?: number
    status?: ItemStatus
  }

  export interface AttributeDefinitionListResult {
    attributeDefinitions: AttributeDefinitionRecord[]
    page: number
    pageSize: number
    total: number
  }

  export interface CreateAttributeDefinitionPayload {
    attributeCode: string
    attributeName: string
  }

  export interface UpdateAttributeDefinitionPayload extends CreateAttributeDefinitionPayload {
    status: ItemStatus
  }

  export interface AttributeOptionRecord {
    attributeOptionId: string
    attributeDefinitionId: string
    optionCode: string
    optionName: string
    description: string
    status: ItemStatus | string
  }

  export interface AttributeOptionListQuery {
    status?: ItemStatus
  }

  export interface AttributeOptionListResult {
    attributeOptions: AttributeOptionRecord[]
  }

  export interface CreateAttributeOptionPayload {
    description?: string
    optionCode: string
    optionName: string
  }

  export interface UpdateAttributeOptionPayload extends CreateAttributeOptionPayload {
    status: ItemStatus
  }

  export interface ItemModelAttributeRuleRecord {
    allowedOptionIds: string[]
    attributeDefinitionId: string
    itemModelId: string
    required: boolean
  }

  export interface SetItemModelAttributeRulesPayload {
    rules: Array<{
      allowedOptionIds: string[]
      attributeDefinitionId: string
      required: boolean
    }>
  }

  export interface PackagingMethodRecord {
    packagingMethodId: string
    methodCode: string
    methodName: string
    description: string
    status: ItemStatus | string
  }

  export interface PackagingMethodListQuery {
    keyword?: string
    status?: ItemStatus
  }

  export interface PackagingMethodListResult {
    packagingMethods: PackagingMethodRecord[]
  }

  export interface CreatePackagingMethodPayload {
    description?: string
    methodCode: string
    methodName: string
  }

  export type UpdatePackagingMethodPayload = CreatePackagingMethodPayload

  export interface PackagingSpecRecord {
    packagingSpecId: string
    itemModelId: string
    packagingMethodId: string
    customerId?: string
    specCode: string
    specName: string
    grossWeight?: string
    volume?: string
    outerLength?: string
    outerWidth?: string
    outerHeight?: string
    workInstruction?: string
    version?: string
    effectiveFrom?: string
    effectiveTo?: string
    status: ItemStatus | string
  }

  export interface PackagingSpecListQuery {
    customerId?: string
    itemModelId?: string
    keyword?: string
    packagingMethodId?: string
    page?: number
    pageSize?: number
    status?: ItemStatus
  }

  export interface PackagingSpecListResult {
    packagingSpecs: PackagingSpecRecord[]
    page: number
    pageSize: number
    total: number
  }

  export interface PackagingSpecPayload {
    itemModelId: string
    packagingMethodId: string
    customerId?: string
    specCode: string
    specName: string
    grossWeight?: string
    volume?: string
    outerLength?: string
    outerWidth?: string
    outerHeight?: string
    workInstruction?: string
    version?: string
    effectiveFrom?: string
    effectiveTo?: string
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

  export interface UpdateBomBasicsPayload {
    bomCode: string
    bomName: string
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

// Loads one tenant-scoped ItemModel detail record.
export async function getManagedItemModelByIdApi(tenantId: string, itemModelId: string) {
  return requestClient.get<ItemManagementApi.ItemModelRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/item-models/${encodeURIComponent(itemModelId)}`
  )
}

// Updates one ItemModel identity without changing derived Item truth.
export async function updateManagedItemModelBasicsApi(
  tenantId: string,
  itemModelId: string,
  data: ItemManagementApi.UpdateItemModelBasicsPayload
) {
  return requestClient.request<{ itemModel?: ItemManagementApi.ItemModelRecord }>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/item-models/${encodeURIComponent(itemModelId)}/basics`,
    { data, method: 'PATCH' }
  )
}

// Full-replaces one ItemModel's default capability profile.
export async function setManagedItemModelCapabilitiesApi(
  tenantId: string,
  itemModelId: string,
  data: ItemManagementApi.SetItemModelCapabilitiesPayload
) {
  return requestClient.put<{ itemModel?: ItemManagementApi.ItemModelRecord }>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/item-models/${encodeURIComponent(itemModelId)}/capabilities`,
    data
  )
}

// Sets or clears one ItemModel's primary category.
export async function setManagedItemModelPrimaryCategoryApi(
  tenantId: string,
  itemModelId: string,
  data: ItemManagementApi.SetItemModelPrimaryCategoryPayload
) {
  return requestClient.put<{ itemModel?: ItemManagementApi.ItemModelRecord }>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/item-models/${encodeURIComponent(itemModelId)}/primary-category`,
    data
  )
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

// Updates one item category code and name.
export async function updateManagedItemCategoryBasicsApi(
  tenantId: string,
  categoryId: string,
  data: ItemManagementApi.UpdateItemCategoryBasicsPayload
) {
  return requestClient.request<ItemManagementApi.ItemCategoryNode>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/categories/${encodeURIComponent(categoryId)}/basics`,
    { data, method: 'PATCH' }
  )
}

// Moves one item category under a new parent, or to the root level when parentCategoryId is empty.
export async function moveManagedItemCategoryApi(
  tenantId: string,
  categoryId: string,
  data: ItemManagementApi.MoveItemCategoryPayload
) {
  return requestClient.request<ItemManagementApi.ItemCategoryNode>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/categories/${encodeURIComponent(categoryId)}/parent`,
    { data, method: 'PATCH' }
  )
}

// Changes one item category lifecycle status.
export async function changeManagedItemCategoryStatusApi(
  tenantId: string,
  categoryId: string,
  data: ItemManagementApi.ChangeStatusPayload
) {
  return requestClient.request<ItemManagementApi.ItemCategoryNode>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/categories/${encodeURIComponent(categoryId)}/status`,
    { data, method: 'PATCH' }
  )
}

// Deletes one unused leaf item category.
export async function deleteManagedItemCategoryApi(
  tenantId: string,
  categoryId: string
) {
  return requestClient.request<Record<string, never>>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/categories/${encodeURIComponent(categoryId)}`,
    { method: 'DELETE' }
  )
}

// Lists tenant-scoped attribute definitions.
export async function listManagedAttributeDefinitionsApi(
  tenantId: string,
  params: ItemManagementApi.AttributeDefinitionListQuery
) {
  return requestClient.get<ItemManagementApi.AttributeDefinitionListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/attributes/definitions`,
    { params }
  )
}

// Creates one attribute definition.
export async function createManagedAttributeDefinitionApi(
  tenantId: string,
  data: ItemManagementApi.CreateAttributeDefinitionPayload
) {
  return requestClient.post<ItemManagementApi.AttributeDefinitionRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/attributes/definitions`,
    data
  )
}

// Updates one attribute definition.
export async function updateManagedAttributeDefinitionApi(
  tenantId: string,
  attributeDefinitionId: string,
  data: ItemManagementApi.UpdateAttributeDefinitionPayload
) {
  return requestClient.request<ItemManagementApi.AttributeDefinitionRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/attributes/definitions/${encodeURIComponent(attributeDefinitionId)}`,
    { data, method: 'PATCH' }
  )
}

// Lists options under one attribute definition.
export async function listManagedAttributeOptionsApi(
  tenantId: string,
  attributeDefinitionId: string,
  params: ItemManagementApi.AttributeOptionListQuery
) {
  return requestClient.get<ItemManagementApi.AttributeOptionListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/attributes/definitions/${encodeURIComponent(attributeDefinitionId)}/options`,
    { params }
  )
}

// Creates one attribute option.
export async function createManagedAttributeOptionApi(
  tenantId: string,
  attributeDefinitionId: string,
  data: ItemManagementApi.CreateAttributeOptionPayload
) {
  return requestClient.post<ItemManagementApi.AttributeOptionRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/attributes/definitions/${encodeURIComponent(attributeDefinitionId)}/options`,
    data
  )
}

// Updates one attribute option.
export async function updateManagedAttributeOptionApi(
  tenantId: string,
  attributeOptionId: string,
  data: ItemManagementApi.UpdateAttributeOptionPayload
) {
  return requestClient.request<ItemManagementApi.AttributeOptionRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/attributes/options/${encodeURIComponent(attributeOptionId)}`,
    { data, method: 'PATCH' }
  )
}

// Reads one ItemModel's simple attribute rule set.
export async function getManagedItemModelAttributeRulesApi(tenantId: string, itemModelId: string) {
  return requestClient.get<{ rules: ItemManagementApi.ItemModelAttributeRuleRecord[] }>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/item-models/${encodeURIComponent(itemModelId)}/attribute-rules`
  )
}

// Full-replaces one ItemModel's simple attribute rule set.
export async function setManagedItemModelAttributeRulesApi(
  tenantId: string,
  itemModelId: string,
  data: ItemManagementApi.SetItemModelAttributeRulesPayload
) {
  return requestClient.put<{ rules: ItemManagementApi.ItemModelAttributeRuleRecord[] }>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/item-models/${encodeURIComponent(itemModelId)}/attribute-rules`,
    data
  )
}

// Lists tenant-scoped packaging methods.
export async function listManagedPackagingMethodsApi(
  tenantId: string,
  params: ItemManagementApi.PackagingMethodListQuery
) {
  return requestClient.get<ItemManagementApi.PackagingMethodListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/methods`,
    { params }
  )
}

// Creates one packaging method.
export async function createManagedPackagingMethodApi(
  tenantId: string,
  data: ItemManagementApi.CreatePackagingMethodPayload
) {
  return requestClient.post<ItemManagementApi.PackagingMethodRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/methods`,
    data
  )
}

// Updates one packaging method.
export async function updateManagedPackagingMethodApi(
  tenantId: string,
  packagingMethodId: string,
  data: ItemManagementApi.UpdatePackagingMethodPayload
) {
  return requestClient.request<ItemManagementApi.PackagingMethodRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/methods/${encodeURIComponent(packagingMethodId)}/basics`,
    { data, method: 'PATCH' }
  )
}

// Changes one packaging method lifecycle status.
export async function changeManagedPackagingMethodStatusApi(
  tenantId: string,
  packagingMethodId: string,
  data: ItemManagementApi.ChangeStatusPayload
) {
  return requestClient.request<ItemManagementApi.PackagingMethodRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/methods/${encodeURIComponent(packagingMethodId)}/status`,
    { data, method: 'PATCH' }
  )
}

// Hard-deletes one unused packaging method.
export async function deleteManagedPackagingMethodApi(
  tenantId: string,
  packagingMethodId: string
) {
  return requestClient.request<Record<string, never>>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/methods/${encodeURIComponent(packagingMethodId)}`,
    { method: 'DELETE' }
  )
}

// Searches tenant-scoped packaging specs.
export async function listManagedPackagingSpecsApi(
  tenantId: string,
  params: ItemManagementApi.PackagingSpecListQuery
) {
  return requestClient.get<ItemManagementApi.PackagingSpecListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/specs`,
    { params }
  )
}

// Loads one packaging spec.
export async function getManagedPackagingSpecApi(tenantId: string, packagingSpecId: string) {
  return requestClient.get<ItemManagementApi.PackagingSpecRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/specs/${encodeURIComponent(packagingSpecId)}`
  )
}

// Creates one packaging spec.
export async function createManagedPackagingSpecApi(
  tenantId: string,
  data: ItemManagementApi.PackagingSpecPayload
) {
  return requestClient.post<ItemManagementApi.PackagingSpecRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/specs`,
    data
  )
}

// Updates one packaging spec.
export async function updateManagedPackagingSpecApi(
  tenantId: string,
  packagingSpecId: string,
  data: ItemManagementApi.PackagingSpecPayload
) {
  return requestClient.request<ItemManagementApi.PackagingSpecRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/specs/${encodeURIComponent(packagingSpecId)}`,
    { data, method: 'PATCH' }
  )
}

// Changes one packaging spec lifecycle status.
export async function changeManagedPackagingSpecStatusApi(
  tenantId: string,
  packagingSpecId: string,
  data: ItemManagementApi.ChangeStatusPayload
) {
  return requestClient.request<ItemManagementApi.PackagingSpecRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/packaging/specs/${encodeURIComponent(packagingSpecId)}/status`,
    { data, method: 'PATCH' }
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

// Updates one BOM code and name.
export async function updateManagedBomBasicsApi(
  tenantId: string,
  bomId: string,
  data: ItemManagementApi.UpdateBomBasicsPayload
) {
  return requestClient.request<ItemManagementApi.BomRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/boms/${encodeURIComponent(bomId)}/basics`,
    { data, method: 'PATCH' }
  )
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

// Changes one BOM lifecycle status.
export async function changeManagedBomStatusApi(
  tenantId: string,
  bomId: string,
  data: ItemManagementApi.ChangeStatusPayload
) {
  return requestClient.request<ItemManagementApi.BomRecord>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/boms/${encodeURIComponent(bomId)}/status`,
    { data, method: 'PATCH' }
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
