import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  CustomerPartyBindingStatus as GrpcCustomerPartyBindingStatus,
  CustomerStatus as GrpcCustomerStatus,
  SearchCustomerAccountsResponse,
  SearchSelectableCustomersResponse
} from '@oes/common/generated/crm_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { CustomerManagementGrpcAdapter } from './adapters/customer-management-grpc.adapter'
import { CustomerQueryGrpcAdapter } from './adapters/customer-query-grpc.adapter'

type CustomerStatusValue = 'ACTIVE_CUSTOMER' | 'ARCHIVED' | 'BLOCKED'

@Injectable()
// Builds the tenant-scoped CRM customer-management BFF model without widening CRM contract ownership boundaries.
export class CustomerManagementService {
  constructor(
    private readonly customerQueryAdapter: CustomerQueryGrpcAdapter,
    private readonly customerManagementAdapter: CustomerManagementGrpcAdapter
  ) {}

  /** searchCustomerAccounts returns the paged CRM customer directory needed by the tenant master-data entry. */
  async searchCustomerAccounts(
    tenantId: string,
    query: {
      keyword?: string
      page?: number
      pageSize?: number
      primaryTenantPartyId?: string
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerQueryAdapter.searchCustomerAccounts(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        status: toGrpcCustomerStatus(query.status),
        primaryTenantPartyId: normalize(query.primaryTenantPartyId),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return mapCustomerAccountPage(result)
  }

  /** searchSelectableCustomers returns the selector-only CRM customer page without turning account ids into Sales truth. */
  async searchSelectableCustomers(
    tenantId: string,
    query: {
      keyword?: string
      page?: number
      pageSize?: number
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerQueryAdapter.searchSelectableCustomers(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return mapSelectableCustomerPage(result)
  }

  /** getCustomerAccountDetail aggregates one account shell with its contacts and addresses for the phase 1 detail page. */
  async getCustomerAccountDetail(
    tenantId: string,
    customerAccountId: string,
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const resolvedCustomerAccountId = requireNonBlank(customerAccountId, 'customerAccountId')
    const [accountResult, contactsResult, addressesResult] = await Promise.all([
      this.customerQueryAdapter.getCustomerAccount(
        {
          tenantId: resolvedTenantId,
          customerAccountId: resolvedCustomerAccountId
        },
        source
      ),
      this.customerQueryAdapter.listCustomerContacts(
        {
          tenantId: resolvedTenantId,
          customerAccountId: resolvedCustomerAccountId
        },
        source
      ),
      this.customerQueryAdapter.listCustomerAddresses(
        {
          tenantId: resolvedTenantId,
          customerAccountId: resolvedCustomerAccountId
        },
        source
      )
    ])

    return {
      customerAccount: mapCustomerAccount(accountResult.customerAccount),
      contacts: (contactsResult.contacts ?? []).map((contact) => mapCustomerContact(contact)),
      addresses: (addressesResult.addresses ?? []).map((address) => mapCustomerAddress(address))
    }
  }

  /** createCustomerAccount creates one CRM customer-account shell without creating Party truth. */
  async createCustomerAccount(
    tenantId: string,
    input: {
      customerCategory?: string
      displayName: string
      tags?: string[]
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.createCustomerAccount(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        displayName: requireNonBlank(input.displayName, 'displayName'),
        customerCategory: normalize(input.customerCategory),
        tags: normalizeStringArray(input.tags)
      },
      source
    )

    return mapCustomerAccount(result.customerAccount)
  }

  /** updateCustomerAccountBasics mutates only the frozen basics fields. */
  async updateCustomerAccountBasics(
    tenantId: string,
    customerAccountId: string,
    input: {
      customerCategory?: string
      displayName?: string
      tags?: string[]
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.updateCustomerAccountBasics(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        customerAccountId: requireNonBlank(customerAccountId, 'customerAccountId'),
        displayName: normalize(input.displayName),
        customerCategory: normalize(input.customerCategory),
        tags: normalizeStringArray(input.tags)
      },
      source
    )

    return mapCustomerAccount(result.customerAccount)
  }

  /** bindCustomerAccountToTenantParty establishes the phase 1 active primary tenantPartyId binding. */
  async bindCustomerAccountToTenantParty(
    tenantId: string,
    customerAccountId: string,
    input: {
      tenantPartyId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.bindCustomerAccountToTenantParty(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        customerAccountId: requireNonBlank(customerAccountId, 'customerAccountId'),
        tenantPartyId: requireNonBlank(input.tenantPartyId, 'tenantPartyId')
      },
      source
    )

    return mapCustomerAccount(result.customerAccount)
  }

  /** upsertCustomerContact proxies one CRM business-contact create-or-update command. */
  async upsertCustomerContact(
    tenantId: string,
    customerAccountId: string,
    input: {
      customerContactId?: string
      displayName: string
      email?: string
      isActive?: boolean
      isPrimaryContact?: boolean
      phone?: string
      roleTitle?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.upsertCustomerContact(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        customerAccountId: requireNonBlank(customerAccountId, 'customerAccountId'),
        customerContactId: normalize(input.customerContactId),
        displayName: requireNonBlank(input.displayName, 'displayName'),
        roleTitle: normalize(input.roleTitle),
        email: normalize(input.email),
        phone: normalize(input.phone),
        isPrimaryContact: input.isPrimaryContact,
        isActive: input.isActive
      },
      source
    )

    return mapCustomerContact(result.contact)
  }

  /** upsertCustomerAddress proxies one CRM business-address create-or-update command. */
  async upsertCustomerAddress(
    tenantId: string,
    customerAccountId: string,
    input: {
      addressLine1: string
      addressLine2?: string
      countryCode: string
      customerAddressId?: string
      isActive?: boolean
      isPrimaryAddress?: boolean
      label: string
      locality?: string
      postalCode?: string
      region?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.upsertCustomerAddress(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        customerAccountId: requireNonBlank(customerAccountId, 'customerAccountId'),
        customerAddressId: normalize(input.customerAddressId),
        label: requireNonBlank(input.label, 'label'),
        countryCode: requireNonBlank(input.countryCode, 'countryCode'),
        region: normalize(input.region),
        locality: normalize(input.locality),
        addressLine1: requireNonBlank(input.addressLine1, 'addressLine1'),
        addressLine2: normalize(input.addressLine2),
        postalCode: normalize(input.postalCode),
        isPrimaryAddress: input.isPrimaryAddress,
        isActive: input.isActive
      },
      source
    )

    return mapCustomerAddress(result.address)
  }

  /** changeCustomerStatus proxies one explicit customer lifecycle status change. */
  async changeCustomerStatus(
    tenantId: string,
    customerAccountId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.customerManagementAdapter.changeCustomerStatus(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        customerAccountId: requireNonBlank(customerAccountId, 'customerAccountId'),
        targetStatus: requireGrpcCustomerStatus(input.status)
      },
      source
    )

    return mapCustomerAccount(result.customerAccount)
  }

  /** resolveTenantId keeps tenant-scoped CRM requests pinned to the operator tenant unless the operator is at system scope. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage CRM customer accounts in their current tenant'
      )
    }

    return operatorTenantId
  }
}

/** mapCustomerAccountPage converts one generated customer directory page into the stable tenant-web BFF shape. */
function mapCustomerAccountPage(result: SearchCustomerAccountsResponse) {
  return {
    customerAccounts: (result.customerAccounts ?? []).map((account) => mapCustomerAccount(account)),
    total: Number(result.total ?? 0),
    page: Number(result.page ?? 1),
    pageSize: Number(result.pageSize ?? 20)
  }
}

/** mapSelectableCustomerPage converts one generated selector page into the stable tenant-web BFF shape. */
function mapSelectableCustomerPage(result: SearchSelectableCustomersResponse) {
  return {
    customers: (result.customers ?? []).map((customer) => ({
      customerAccountId: customer.customerAccountId ?? '',
      customerAccountNo: customer.customerAccountNo ?? '',
      displayName: customer.displayName ?? '',
      status: fromGrpcCustomerStatus(customer.status),
      primaryTenantPartyId: customer.primaryTenantPartyId ?? '',
      primaryPartyDisplayName: customer.primaryPartyDisplayName ?? ''
    })),
    total: Number(result.total ?? 0),
    page: Number(result.page ?? 1),
    pageSize: Number(result.pageSize ?? 20)
  }
}

/** mapCustomerAccount flattens one generated CRM customer account read model into the tenant-web detail shape. */
function mapCustomerAccount(account?: any) {
  return {
    customerAccountId: account?.customerAccountId ?? '',
    customerAccountNo: account?.customerAccountNo ?? '',
    tenantId: account?.tenantId ?? '',
    displayName: account?.displayName ?? '',
    status: fromGrpcCustomerStatus(account?.status),
    customerCategory: normalize(account?.customerCategory) ?? '',
    tags: normalizeStringArray(account?.tags),
    primaryBinding: account?.primaryBinding
      ? {
          customerPartyBindingId: account.primaryBinding.customerPartyBindingId ?? '',
          tenantPartyId: account.primaryBinding.tenantPartyId ?? '',
          bindingStatus: fromGrpcBindingStatus(account.primaryBinding.bindingStatus),
          partyDisplayName: account.primaryBinding.partyDisplayName ?? ''
        }
      : undefined
  }
}

/** mapCustomerContact flattens one generated CRM contact read model into the tenant-web detail shape. */
function mapCustomerContact(contact?: any) {
  return {
    customerContactId: contact?.customerContactId ?? '',
    customerAccountId: contact?.customerAccountId ?? '',
    displayName: contact?.displayName ?? '',
    roleTitle: contact?.roleTitle ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    isPrimaryContact: Boolean(contact?.isPrimaryContact),
    isActive: contact?.isActive ?? true
  }
}

/** mapCustomerAddress flattens one generated CRM address read model into the tenant-web detail shape. */
function mapCustomerAddress(address?: any) {
  return {
    customerAddressId: address?.customerAddressId ?? '',
    customerAccountId: address?.customerAccountId ?? '',
    label: address?.label ?? '',
    countryCode: address?.countryCode ?? '',
    region: address?.region ?? '',
    locality: address?.locality ?? '',
    addressLine1: address?.addressLine1 ?? '',
    addressLine2: address?.addressLine2 ?? '',
    postalCode: address?.postalCode ?? '',
    isPrimaryAddress: Boolean(address?.isPrimaryAddress),
    isActive: address?.isActive ?? true
  }
}

/** fromGrpcCustomerStatus maps the generated CRM enum into the stable tenant-web/customer-management string union. */
function fromGrpcCustomerStatus(value?: GrpcCustomerStatus): CustomerStatusValue {
  if (value === GrpcCustomerStatus.CUSTOMER_STATUS_BLOCKED) {
    return 'BLOCKED'
  }
  if (value === GrpcCustomerStatus.CUSTOMER_STATUS_ARCHIVED) {
    return 'ARCHIVED'
  }
  return 'ACTIVE_CUSTOMER'
}

/** toGrpcCustomerStatus maps optional list filters into the generated CRM enum. */
function toGrpcCustomerStatus(value?: string): GrpcCustomerStatus | undefined {
  if (!value) {
    return undefined
  }
  return requireGrpcCustomerStatus(value)
}

/** requireGrpcCustomerStatus maps a required status input into the generated CRM enum. */
function requireGrpcCustomerStatus(value?: string): GrpcCustomerStatus {
  if (value === 'BLOCKED') {
    return GrpcCustomerStatus.CUSTOMER_STATUS_BLOCKED
  }
  if (value === 'ARCHIVED') {
    return GrpcCustomerStatus.CUSTOMER_STATUS_ARCHIVED
  }
  return GrpcCustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER
}

/** fromGrpcBindingStatus maps the generated CRM binding enum into the stable tenant-web binding string union. */
function fromGrpcBindingStatus(
  value?: GrpcCustomerPartyBindingStatus
): 'ACTIVE_PRIMARY' | undefined {
  if (
    value ===
    GrpcCustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY
  ) {
    return 'ACTIVE_PRIMARY'
  }

  return undefined
}

/** requireNonBlank trims one required string input and rejects blank values before they reach the downstream contract. */
function requireNonBlank(value: string | undefined, field: string): string {
  const normalized = normalize(value)
  if (!normalized) {
    throw new Error(`${field} is required`)
  }

  return normalized
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/** normalizeStringArray trims optional string arrays and drops blank values. */
function normalizeStringArray(values?: string[]): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values.map((value) => value.trim()).filter(Boolean)
}
