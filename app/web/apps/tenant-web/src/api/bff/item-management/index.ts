import { requestClient } from '#/api/request'

export namespace ItemManagementApi {
  export type ItemCapabilityKey =
    | 'manufacturable'
    | 'purchasable'
    | 'sellable'
    | 'stockable'
  export type ItemNatureType = 'PHYSICAL' | 'SERVICE' | 'VIRTUAL'
  export type ItemStatus = 'ACTIVE' | 'INACTIVE'
  export type ItemStructureType = 'BUNDLE' | 'SINGLE'

  export interface ItemCapabilities {
    manufacturable: boolean
    purchasable: boolean
    sellable: boolean
    stockable: boolean
  }

  export interface ItemSummary {
    itemId: string
    itemCode: string
    itemName: string
    structureType: ItemStructureType | string
    natureType: ItemNatureType | string
    status: ItemStatus | string
    capabilities: ItemCapabilities
  }

  export interface ItemListQuery {
    capability?: ItemCapabilityKey
    keyword?: string
    natureType?: ItemNatureType
    page?: number
    pageSize?: number
    status?: ItemStatus
    structureType?: ItemStructureType
  }

  export interface ItemListResult {
    items: ItemSummary[]
    page: number
    pageSize: number
    total: number
  }

  export interface CreateItemPayload {
    itemCode: string
    itemName: string
    structureType: ItemStructureType
    natureType: ItemNatureType
  }

  export interface UpdateItemBasicsPayload {
    itemCode: string
    itemName: string
  }

  export interface SetItemCapabilitiesPayload {
    capabilities: ItemCapabilities
  }

  export interface ItemCompositionComponentInput {
    componentItemId: string
  }

  export interface ItemCompositionComponent extends ItemCompositionComponentInput {
    componentItemCode: string
    componentItemName: string
  }

  export interface ItemComposition {
    itemId: string
    components: ItemCompositionComponent[]
  }

  export interface SetItemCompositionPayload {
    components: ItemCompositionComponentInput[]
  }

  export interface SupplierItemMappingListQuery {
    page?: number
    pageSize?: number
  }

  export interface SupplierItemMappingListEntry {
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
    supplierId: string
    supplierItemCode?: string
    supplierItemName?: string
  }

  export interface ChangeItemStatusPayload {
    status: ItemStatus
  }
}

// Lists tenant-scoped phase 1 items for the dedicated item-management entry.
export async function listManagedItemsApi(
  tenantId: string,
  params: ItemManagementApi.ItemListQuery
) {
  return requestClient.get<ItemManagementApi.ItemListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items`,
    {
      params
    }
  )
}

// Loads one phase 1 item detail snapshot.
export async function getManagedItemByIdApi(tenantId: string, itemId: string) {
  return requestClient.get<ItemManagementApi.ItemSummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}`
  )
}

// Creates one phase 1 item without widening the immutable classification inputs.
export async function createManagedItemApi(
  tenantId: string,
  data: ItemManagementApi.CreateItemPayload
) {
  return requestClient.post<{
    itemId: string
    item?: ItemManagementApi.ItemSummary
  }>(`/item-management/tenants/${encodeURIComponent(tenantId)}/items`, data)
}

// Updates one phase 1 item code and name only.
export async function updateManagedItemBasicsApi(
  tenantId: string,
  itemId: string,
  data: ItemManagementApi.UpdateItemBasicsPayload
) {
  return requestClient.request<ItemManagementApi.ItemSummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/basics`,
    {
      data,
      method: 'PATCH'
    }
  )
}

// Full-replaces one phase 1 capability set.
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

// Loads the current phase 1 bundle composition snapshot.
export async function getManagedItemCompositionApi(tenantId: string, itemId: string) {
  return requestClient.get<ItemManagementApi.ItemComposition>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/composition`
  )
}

// Full-replaces the phase 1 bundle composition set.
export async function setManagedItemCompositionApi(
  tenantId: string,
  itemId: string,
  data: ItemManagementApi.SetItemCompositionPayload
) {
  return requestClient.put<ItemManagementApi.ItemComposition>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/composition`,
    data
  )
}

// Lists the current supplier mapping rows for one item detail page.
export async function listManagedSupplierItemMappingsApi(
  tenantId: string,
  itemId: string,
  params: ItemManagementApi.SupplierItemMappingListQuery
) {
  return requestClient.get<ItemManagementApi.SupplierItemMappingListResult>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/supplier-mappings`,
    {
      params
    }
  )
}

// Upserts one supplier-to-item mapping row.
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

// Changes one phase 1 item lifecycle status.
export async function changeManagedItemStatusApi(
  tenantId: string,
  itemId: string,
  data: ItemManagementApi.ChangeItemStatusPayload
) {
  return requestClient.request<ItemManagementApi.ItemSummary>(
    `/item-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/status`,
    {
      data,
      method: 'PATCH'
    }
  )
}
