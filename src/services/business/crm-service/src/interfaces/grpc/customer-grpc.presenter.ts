import {
  BindCustomerAccountToTenantPartyResponse,
  ChangeCustomerStatusResponse,
  CreateCustomerAccountResponse,
  CustomerAccount,
  CustomerAddress,
  CustomerPartyBindingStatus as ProtoCustomerPartyBindingStatus,
  CustomerStatus as ProtoCustomerStatus,
  GetCustomerAccountResponse,
  ListCustomerAddressesResponse,
  ListCustomerContactsResponse,
  SearchCustomerAccountsResponse,
  SearchSelectableCustomersResponse,
  UpsertCustomerAddressResponse,
  UpsertCustomerContactResponse
} from '@oes/common/generated/crm_service'
import {
  CustomerAccountRecord,
  CustomerAddressRecord,
  CustomerContactRecord,
  CustomerPartyBindingStatus,
  CustomerStatus,
  SelectableCustomerRecord
} from '../../domain/models/crm-records'
import { ListCustomerAddressesResult } from '../../application/queries/list-customer-addresses.handler'
import { ListCustomerContactsResult } from '../../application/queries/list-customer-contacts.handler'
import { SearchCustomerAccountsResult } from '../../application/queries/search-customer-accounts.handler'
import { SearchSelectableCustomersResult } from '../../application/queries/search-selectable-customers.handler'

/** CustomerGrpcPresenter maps CRM domain records into the frozen phase 1 gRPC response shapes. */
export class CustomerGrpcPresenter {
  /** toCustomerAccount renders one CRM customer-account shell with its optional active primary binding summary. */
  static toCustomerAccount(account: CustomerAccountRecord): CustomerAccount {
    return {
      customerAccountId: account.id,
      customerAccountNo: account.customerAccountNo,
      tenantId: account.tenantId,
      displayName: account.displayName,
      status: toProtoCustomerStatus(account.status),
      customerCategory: account.customerCategory ?? '',
      tags: account.tags,
      primaryBinding: account.primaryBinding
        ? {
            customerPartyBindingId: account.primaryBinding.customerPartyBindingId,
            tenantPartyId: account.primaryBinding.tenantPartyId,
            bindingStatus:
              account.primaryBinding.bindingStatus === CustomerPartyBindingStatus.ACTIVE_PRIMARY
                ? ProtoCustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY
                : ProtoCustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_UNSPECIFIED,
            partyDisplayName: account.primaryBinding.partyDisplayName ?? ''
          }
        : undefined
    }
  }

  /** toSelectableCustomer renders one selector-eligible CRM customer summary. */
  static toSelectableCustomer(customer: SelectableCustomerRecord) {
    return {
      customerAccountId: customer.customerAccountId,
      customerAccountNo: customer.customerAccountNo,
      displayName: customer.displayName,
      status: toProtoCustomerStatus(customer.status),
      primaryTenantPartyId: customer.primaryTenantPartyId,
      primaryPartyDisplayName: customer.primaryPartyDisplayName ?? ''
    }
  }

  /** toCustomerContact renders one CRM business-contact relationship record. */
  static toCustomerContact(contact: CustomerContactRecord) {
    return {
      customerContactId: contact.customerContactId,
      customerAccountId: contact.customerAccountId,
      displayName: contact.displayName,
      roleTitle: contact.roleTitle ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      isPrimaryContact: contact.isPrimaryContact,
      isActive: contact.isActive
    }
  }

  /** toCustomerAddress renders one CRM business-address relationship record. */
  static toCustomerAddress(address: CustomerAddressRecord): CustomerAddress {
    return {
      customerAddressId: address.customerAddressId,
      customerAccountId: address.customerAccountId,
      label: address.label,
      countryCode: address.countryCode,
      region: address.region ?? '',
      locality: address.locality ?? '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      postalCode: address.postalCode ?? '',
      isPrimaryAddress: address.isPrimaryAddress,
      isActive: address.isActive
    }
  }

  /** toCreateCustomerAccountResponse renders one CreateCustomerAccount success payload. */
  static toCreateCustomerAccountResponse(account: CustomerAccountRecord): CreateCustomerAccountResponse {
    return { customerAccount: this.toCustomerAccount(account) }
  }

  /** toGetCustomerAccountResponse renders one GetCustomerAccount success payload. */
  static toGetCustomerAccountResponse(account: CustomerAccountRecord): GetCustomerAccountResponse {
    return { customerAccount: this.toCustomerAccount(account) }
  }

  /** toSearchSelectableCustomersResponse renders one selector search success payload. */
  static toSearchSelectableCustomersResponse(
    result: SearchSelectableCustomersResult
  ): SearchSelectableCustomersResponse {
    return {
      customers: result.customers.map((customer) => this.toSelectableCustomer(customer)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toSearchCustomerAccountsResponse renders one CRM account-directory search success payload. */
  static toSearchCustomerAccountsResponse(result: SearchCustomerAccountsResult): SearchCustomerAccountsResponse {
    return {
      customerAccounts: result.customerAccounts.map((account) => this.toCustomerAccount(account)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toListCustomerContactsResponse renders one CRM contact-list success payload. */
  static toListCustomerContactsResponse(result: ListCustomerContactsResult): ListCustomerContactsResponse {
    return {
      contacts: result.contacts.map((contact) => this.toCustomerContact(contact))
    }
  }

  /** toListCustomerAddressesResponse renders one CRM address-list success payload. */
  static toListCustomerAddressesResponse(result: ListCustomerAddressesResult): ListCustomerAddressesResponse {
    return {
      addresses: result.addresses.map((address) => this.toCustomerAddress(address))
    }
  }

  /** toUpdateCustomerAccountBasicsResponse renders one account-basics update success payload. */
  static toUpdateCustomerAccountBasicsResponse(account: CustomerAccountRecord) {
    return {
      customerAccount: this.toCustomerAccount(account)
    }
  }

  /** toBindCustomerAccountToTenantPartyResponse renders one primary-binding success payload. */
  static toBindCustomerAccountToTenantPartyResponse(
    account: CustomerAccountRecord
  ): BindCustomerAccountToTenantPartyResponse {
    return {
      customerAccount: this.toCustomerAccount(account)
    }
  }

  /** toUpsertCustomerContactResponse renders one contact write success payload. */
  static toUpsertCustomerContactResponse(contact: CustomerContactRecord): UpsertCustomerContactResponse {
    return {
      contact: this.toCustomerContact(contact)
    }
  }

  /** toUpsertCustomerAddressResponse renders one address write success payload. */
  static toUpsertCustomerAddressResponse(address: CustomerAddressRecord): UpsertCustomerAddressResponse {
    return {
      address: this.toCustomerAddress(address)
    }
  }

  /** toChangeCustomerStatusResponse renders one customer-status change success payload. */
  static toChangeCustomerStatusResponse(account: CustomerAccountRecord): ChangeCustomerStatusResponse {
    return {
      customerAccount: this.toCustomerAccount(account)
    }
  }
}

/** toProtoCustomerStatus maps the CRM domain enum into the generated contract enum. */
function toProtoCustomerStatus(status: CustomerStatus): ProtoCustomerStatus {
  if (status === CustomerStatus.BLOCKED) {
    return ProtoCustomerStatus.CUSTOMER_STATUS_BLOCKED
  }
  if (status === CustomerStatus.ARCHIVED) {
    return ProtoCustomerStatus.CUSTOMER_STATUS_ARCHIVED
  }
  return ProtoCustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER
}
