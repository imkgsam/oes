import { requestClient } from '#/api/request'

export namespace SupplierManagementApi {
  export type SupplierOfferingStatus = 'ACTIVE' | 'INACTIVE'
  export type SupplierPartyBindingStatus = 'ACTIVE'
  export type SupplierStatus = 'ACTIVE' | 'INACTIVE'

  export interface SupplierPartyBindingSummary {
    tenantPartyId: string
    bindingStatus?: SupplierPartyBindingStatus
    partyDisplayName: string
  }

  export interface SupplierProfile {
    supplierId: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: SupplierStatus | string
    supplierCategory: string
    tags: string[]
    partyBinding?: SupplierPartyBindingSummary
  }

  export interface SupplierContact {
    supplierContactId: string
    supplierId: string
    displayName: string
    roleTitle: string
    email: string
    phone: string
    isPrimaryContact: boolean
    isActive: boolean
  }

  export interface SupplierAddress {
    supplierAddressId: string
    supplierId: string
    label: string
    countryCode: string
    region: string
    locality: string
    addressLine1: string
    addressLine2: string
    postalCode: string
    isPrimaryAddress: boolean
    isActive: boolean
  }

  export interface SupplierOffering {
    supplierOfferingId: string
    supplierId: string
    itemId: string
    itemCode: string
    itemName: string
    status: SupplierOfferingStatus | string
  }

  export interface SupplierListQuery {
    keyword?: string
    page?: number
    pageSize?: number
    status?: SupplierStatus
    tenantPartyId?: string
  }

  export interface SupplierOfferingListQuery {
    page?: number
    pageSize?: number
    status?: SupplierOfferingStatus
  }

  export interface SupplierListResult {
    suppliers: SupplierProfile[]
    page: number
    pageSize: number
    total: number
  }

  export interface SupplierOfferingListResult {
    offerings: SupplierOffering[]
    page: number
    pageSize: number
    total: number
  }

  export interface SupplierDetailResult {
    supplier: SupplierProfile
    contacts: SupplierContact[]
    addresses: SupplierAddress[]
    offerings: SupplierOffering[]
  }

  export interface CreateSupplierPayload {
    displayName: string
    supplierNo?: string
    supplierCategory?: string
    tags?: string[]
  }

  export interface UpdateSupplierBasicsPayload {
    displayName?: string
    supplierNo?: string
    supplierCategory?: string
    tags?: string[]
  }

  export interface BindSupplierToTenantPartyPayload {
    tenantPartyId: string
  }

  export interface UpsertSupplierContactPayload {
    supplierContactId?: string
    displayName: string
    roleTitle?: string
    email?: string
    phone?: string
    isPrimaryContact?: boolean
    isActive?: boolean
  }

  export interface UpsertSupplierAddressPayload {
    supplierAddressId?: string
    label: string
    countryCode: string
    region?: string
    locality?: string
    addressLine1: string
    addressLine2?: string
    postalCode?: string
    isPrimaryAddress?: boolean
    isActive?: boolean
  }

  export interface ChangeSupplierStatusPayload {
    status: SupplierStatus
  }

  export interface UpsertSupplierOfferingPayload {
    supplierOfferingId?: string
    itemId: string
    status: SupplierOfferingStatus
  }
}

// Lists tenant-scoped SRM supplier profiles for the dedicated supplier-management entry.
export async function listManagedSuppliersApi(
  tenantId: string,
  params: SupplierManagementApi.SupplierListQuery
) {
  return requestClient.get<SupplierManagementApi.SupplierListResult>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers`,
    {
      params
    }
  )
}

// Loads one SRM supplier detail aggregate with contacts, addresses, and offerings.
export async function getManagedSupplierByIdApi(tenantId: string, supplierId: string) {
  return requestClient.get<SupplierManagementApi.SupplierDetailResult>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}`
  )
}

// Creates one SRM supplier profile shell.
export async function createManagedSupplierApi(
  tenantId: string,
  data: SupplierManagementApi.CreateSupplierPayload
) {
  return requestClient.post<SupplierManagementApi.SupplierProfile>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers`,
    data
  )
}

// Updates one SRM supplier profile basics payload only.
export async function updateManagedSupplierBasicsApi(
  tenantId: string,
  supplierId: string,
  data: SupplierManagementApi.UpdateSupplierBasicsPayload
) {
  return requestClient.request<SupplierManagementApi.SupplierProfile>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}/basics`,
    {
      data,
      method: 'PATCH'
    }
  )
}

// Binds one SRM supplier profile to its phase 1 tenant party.
export async function bindManagedSupplierToTenantPartyApi(
  tenantId: string,
  supplierId: string,
  data: SupplierManagementApi.BindSupplierToTenantPartyPayload
) {
  return requestClient.post<SupplierManagementApi.SupplierProfile>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}/tenant-party-binding`,
    data
  )
}

// Upserts one SRM supplier contact.
export async function upsertManagedSupplierContactApi(
  tenantId: string,
  supplierId: string,
  data: SupplierManagementApi.UpsertSupplierContactPayload
) {
  return requestClient.post<SupplierManagementApi.SupplierContact>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}/contacts`,
    data
  )
}

// Upserts one SRM supplier address.
export async function upsertManagedSupplierAddressApi(
  tenantId: string,
  supplierId: string,
  data: SupplierManagementApi.UpsertSupplierAddressPayload
) {
  return requestClient.post<SupplierManagementApi.SupplierAddress>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}/addresses`,
    data
  )
}

// Changes one SRM supplier lifecycle status.
export async function changeManagedSupplierStatusApi(
  tenantId: string,
  supplierId: string,
  data: SupplierManagementApi.ChangeSupplierStatusPayload
) {
  return requestClient.request<SupplierManagementApi.SupplierProfile>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}/status`,
    {
      data,
      method: 'PATCH'
    }
  )
}

// Lists one supplier's offerings without widening the SRM surface into pricing or procurement terms.
export async function listManagedSupplierOfferingsBySupplierApi(
  tenantId: string,
  supplierId: string,
  params: SupplierManagementApi.SupplierOfferingListQuery
) {
  return requestClient.get<SupplierManagementApi.SupplierOfferingListResult>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}/offerings`,
    {
      params
    }
  )
}

// Lists supplier offerings for one item using the SRM query contract rather than direct item-master storage access.
export async function listManagedSupplierOfferingsByItemApi(
  tenantId: string,
  itemId: string,
  params: SupplierManagementApi.SupplierOfferingListQuery
) {
  return requestClient.get<SupplierManagementApi.SupplierOfferingListResult>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/items/${encodeURIComponent(itemId)}/offerings`,
    {
      params
    }
  )
}

// Upserts one supplier offering fact without adding pricing, MOQ, payment, or lead-time terms.
export async function upsertManagedSupplierOfferingApi(
  tenantId: string,
  supplierId: string,
  data: SupplierManagementApi.UpsertSupplierOfferingPayload
) {
  return requestClient.post<SupplierManagementApi.SupplierOffering>(
    `/supplier-management/tenants/${encodeURIComponent(tenantId)}/suppliers/${encodeURIComponent(supplierId)}/offerings`,
    data
  )
}
