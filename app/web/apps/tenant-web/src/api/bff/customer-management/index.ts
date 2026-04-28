import { requestClient } from '#/api/request'

export namespace CustomerManagementApi {
  export type CustomerPartyBindingStatus = 'ACTIVE_PRIMARY'
  export type CustomerStatus = 'ACTIVE_CUSTOMER' | 'ARCHIVED' | 'BLOCKED'

  export interface CustomerPartyBindingSummary {
    customerPartyBindingId: string
    tenantPartyId: string
    bindingStatus?: CustomerPartyBindingStatus
    partyDisplayName: string
  }

  export interface CustomerAccount {
    customerAccountId: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: CustomerStatus | string
    customerCategory: string
    tags: string[]
    primaryBinding?: CustomerPartyBindingSummary
  }

  export interface SelectableCustomer {
    customerAccountId: string
    customerAccountNo: string
    displayName: string
    status: CustomerStatus | string
    primaryTenantPartyId: string
    primaryPartyDisplayName: string
  }

  export interface CustomerContact {
    customerContactId: string
    customerAccountId: string
    displayName: string
    roleTitle: string
    email: string
    phone: string
    isPrimaryContact: boolean
    isActive: boolean
  }

  export interface CustomerAddress {
    customerAddressId: string
    customerAccountId: string
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

  export interface CustomerAccountListQuery {
    keyword?: string
    page?: number
    pageSize?: number
    primaryTenantPartyId?: string
    status?: CustomerStatus
  }

  export interface SelectableCustomerListQuery {
    keyword?: string
    page?: number
    pageSize?: number
  }

  export interface CustomerAccountListResult {
    customerAccounts: CustomerAccount[]
    page: number
    pageSize: number
    total: number
  }

  export interface SelectableCustomerListResult {
    customers: SelectableCustomer[]
    page: number
    pageSize: number
    total: number
  }

  export interface CustomerAccountDetailResult {
    customerAccount: CustomerAccount
    contacts: CustomerContact[]
    addresses: CustomerAddress[]
  }

  export interface CreateCustomerAccountPayload {
    displayName: string
    customerCategory?: string
    tags?: string[]
  }

  export interface UpdateCustomerAccountBasicsPayload {
    displayName?: string
    customerCategory?: string
    tags?: string[]
  }

  export interface BindCustomerAccountToTenantPartyPayload {
    tenantPartyId: string
  }

  export interface UpsertCustomerContactPayload {
    customerContactId?: string
    displayName: string
    roleTitle?: string
    email?: string
    phone?: string
    isPrimaryContact?: boolean
    isActive?: boolean
  }

  export interface UpsertCustomerAddressPayload {
    customerAddressId?: string
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

  export interface ChangeCustomerStatusPayload {
    status: CustomerStatus
  }
}

// Lists tenant-scoped CRM customer accounts for the dedicated customer-management entry.
export async function listManagedCustomerAccountsApi(
  tenantId: string,
  params: CustomerManagementApi.CustomerAccountListQuery
) {
  return requestClient.get<CustomerManagementApi.CustomerAccountListResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers`,
    {
      params
    }
  )
}

// Lists selector-eligible CRM customers without changing downstream Sales adoption rules.
export async function listSelectableCustomersApi(
  tenantId: string,
  params: CustomerManagementApi.SelectableCustomerListQuery
) {
  return requestClient.get<CustomerManagementApi.SelectableCustomerListResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/selectable-customers`,
    {
      params
    }
  )
}

// Loads one CRM customer detail aggregate with contacts and addresses.
export async function getManagedCustomerAccountByIdApi(
  tenantId: string,
  customerAccountId: string
) {
  return requestClient.get<CustomerManagementApi.CustomerAccountDetailResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers/${encodeURIComponent(customerAccountId)}`
  )
}

// Creates one CRM customer account shell.
export async function createManagedCustomerAccountApi(
  tenantId: string,
  data: CustomerManagementApi.CreateCustomerAccountPayload
) {
  return requestClient.post<CustomerManagementApi.CustomerAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers`,
    data
  )
}

// Updates one CRM customer account basics payload only.
export async function updateManagedCustomerAccountBasicsApi(
  tenantId: string,
  customerAccountId: string,
  data: CustomerManagementApi.UpdateCustomerAccountBasicsPayload
) {
  return requestClient.request<CustomerManagementApi.CustomerAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers/${encodeURIComponent(customerAccountId)}/basics`,
    {
      data,
      method: 'PATCH'
    }
  )
}

// Binds one CRM customer account to its phase 1 primary tenant party.
export async function bindManagedCustomerAccountToTenantPartyApi(
  tenantId: string,
  customerAccountId: string,
  data: CustomerManagementApi.BindCustomerAccountToTenantPartyPayload
) {
  return requestClient.post<CustomerManagementApi.CustomerAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers/${encodeURIComponent(customerAccountId)}/tenant-party-binding`,
    data
  )
}

// Upserts one CRM customer contact.
export async function upsertManagedCustomerContactApi(
  tenantId: string,
  customerAccountId: string,
  data: CustomerManagementApi.UpsertCustomerContactPayload
) {
  return requestClient.post<CustomerManagementApi.CustomerContact>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers/${encodeURIComponent(customerAccountId)}/contacts`,
    data
  )
}

// Upserts one CRM customer address.
export async function upsertManagedCustomerAddressApi(
  tenantId: string,
  customerAccountId: string,
  data: CustomerManagementApi.UpsertCustomerAddressPayload
) {
  return requestClient.post<CustomerManagementApi.CustomerAddress>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers/${encodeURIComponent(customerAccountId)}/addresses`,
    data
  )
}

// Changes one CRM customer lifecycle status.
export async function changeManagedCustomerStatusApi(
  tenantId: string,
  customerAccountId: string,
  data: CustomerManagementApi.ChangeCustomerStatusPayload
) {
  return requestClient.request<CustomerManagementApi.CustomerAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/customers/${encodeURIComponent(customerAccountId)}/status`,
    {
      data,
      method: 'PATCH'
    }
  )
}
