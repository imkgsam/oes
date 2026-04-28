export enum CustomerStatus {
  ACTIVE_CUSTOMER = 'ACTIVE_CUSTOMER',
  BLOCKED = 'BLOCKED',
  ARCHIVED = 'ARCHIVED'
}

export enum CustomerPartyBindingStatus {
  ACTIVE_PRIMARY = 'ACTIVE_PRIMARY'
}

export interface CrmOperatorContext {
  operatorId: string
  operatorType: string
  orgId?: string | null
}

export interface CrmTraceContext {
  traceId: string
  requestId: string
}

export interface CrmAuditContext {
  auditId: string
  reason: string
  source: string
}

export interface CustomerPartyBindingRecord {
  customerPartyBindingId: string
  customerAccountId: string
  tenantId: string
  tenantPartyId: string
  bindingStatus: CustomerPartyBindingStatus
  partyDisplayName?: string | null
}

export interface CustomerAccountRecord {
  id: string
  customerAccountNo: string
  tenantId: string
  displayName: string
  status: CustomerStatus
  customerCategory?: string | null
  tags: string[]
  primaryBinding?: CustomerPartyBindingRecord | null
}

export interface SelectableCustomerRecord {
  customerAccountId: string
  customerAccountNo: string
  displayName: string
  status: CustomerStatus
  primaryTenantPartyId: string
  primaryPartyDisplayName?: string | null
}

export interface CustomerContactRecord {
  customerContactId: string
  tenantId: string
  customerAccountId: string
  displayName: string
  roleTitle?: string | null
  email?: string | null
  phone?: string | null
  isPrimaryContact: boolean
  isActive: boolean
}

export interface CustomerAddressRecord {
  customerAddressId: string
  tenantId: string
  customerAccountId: string
  label: string
  countryCode: string
  region?: string | null
  locality?: string | null
  addressLine1: string
  addressLine2?: string | null
  postalCode?: string | null
  isPrimaryAddress: boolean
  isActive: boolean
}

export interface PageResult<TItem> {
  items: TItem[]
  total: number
  page: number
  pageSize: number
}

export interface SearchSelectableCustomersInput {
  tenantId: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface SearchCustomerAccountsInput {
  tenantId: string
  keyword?: string
  status?: CustomerStatus
  primaryTenantPartyId?: string
  page?: number
  pageSize?: number
}

/** cloneRecord deep-clones plain CRM records so repositories do not leak mutable state across calls. */
export function cloneRecord<T>(value: T): T {
  return structuredClone(value)
}
