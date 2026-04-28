"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerGrpcPresenter = void 0;
const crm_service_1 = require("@oes/common/generated/crm_service");
const crm_records_1 = require("../../domain/models/crm-records");
/** CustomerGrpcPresenter maps CRM domain records into the frozen phase 1 gRPC response shapes. */
class CustomerGrpcPresenter {
    /** toCustomerAccount renders one CRM customer-account shell with its optional active primary binding summary. */
    static toCustomerAccount(account) {
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
                    bindingStatus: account.primaryBinding.bindingStatus === crm_records_1.CustomerPartyBindingStatus.ACTIVE_PRIMARY
                        ? crm_service_1.CustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY
                        : crm_service_1.CustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_UNSPECIFIED,
                    partyDisplayName: account.primaryBinding.partyDisplayName ?? ''
                }
                : undefined
        };
    }
    /** toSelectableCustomer renders one selector-eligible CRM customer summary. */
    static toSelectableCustomer(customer) {
        return {
            customerAccountId: customer.customerAccountId,
            customerAccountNo: customer.customerAccountNo,
            displayName: customer.displayName,
            status: toProtoCustomerStatus(customer.status),
            primaryTenantPartyId: customer.primaryTenantPartyId,
            primaryPartyDisplayName: customer.primaryPartyDisplayName ?? ''
        };
    }
    /** toCustomerContact renders one CRM business-contact relationship record. */
    static toCustomerContact(contact) {
        return {
            customerContactId: contact.customerContactId,
            customerAccountId: contact.customerAccountId,
            displayName: contact.displayName,
            roleTitle: contact.roleTitle ?? '',
            email: contact.email ?? '',
            phone: contact.phone ?? '',
            isPrimaryContact: contact.isPrimaryContact,
            isActive: contact.isActive
        };
    }
    /** toCustomerAddress renders one CRM business-address relationship record. */
    static toCustomerAddress(address) {
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
        };
    }
    /** toCreateCustomerAccountResponse renders one CreateCustomerAccount success payload. */
    static toCreateCustomerAccountResponse(account) {
        return { customerAccount: this.toCustomerAccount(account) };
    }
    /** toGetCustomerAccountResponse renders one GetCustomerAccount success payload. */
    static toGetCustomerAccountResponse(account) {
        return { customerAccount: this.toCustomerAccount(account) };
    }
    /** toSearchSelectableCustomersResponse renders one selector search success payload. */
    static toSearchSelectableCustomersResponse(result) {
        return {
            customers: result.customers.map((customer) => this.toSelectableCustomer(customer)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    /** toSearchCustomerAccountsResponse renders one CRM account-directory search success payload. */
    static toSearchCustomerAccountsResponse(result) {
        return {
            customerAccounts: result.customerAccounts.map((account) => this.toCustomerAccount(account)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    /** toListCustomerContactsResponse renders one CRM contact-list success payload. */
    static toListCustomerContactsResponse(result) {
        return {
            contacts: result.contacts.map((contact) => this.toCustomerContact(contact))
        };
    }
    /** toListCustomerAddressesResponse renders one CRM address-list success payload. */
    static toListCustomerAddressesResponse(result) {
        return {
            addresses: result.addresses.map((address) => this.toCustomerAddress(address))
        };
    }
    /** toUpdateCustomerAccountBasicsResponse renders one account-basics update success payload. */
    static toUpdateCustomerAccountBasicsResponse(account) {
        return {
            customerAccount: this.toCustomerAccount(account)
        };
    }
    /** toBindCustomerAccountToTenantPartyResponse renders one primary-binding success payload. */
    static toBindCustomerAccountToTenantPartyResponse(account) {
        return {
            customerAccount: this.toCustomerAccount(account)
        };
    }
    /** toUpsertCustomerContactResponse renders one contact write success payload. */
    static toUpsertCustomerContactResponse(contact) {
        return {
            contact: this.toCustomerContact(contact)
        };
    }
    /** toUpsertCustomerAddressResponse renders one address write success payload. */
    static toUpsertCustomerAddressResponse(address) {
        return {
            address: this.toCustomerAddress(address)
        };
    }
    /** toChangeCustomerStatusResponse renders one customer-status change success payload. */
    static toChangeCustomerStatusResponse(account) {
        return {
            customerAccount: this.toCustomerAccount(account)
        };
    }
}
exports.CustomerGrpcPresenter = CustomerGrpcPresenter;
/** toProtoCustomerStatus maps the CRM domain enum into the generated contract enum. */
function toProtoCustomerStatus(status) {
    if (status === crm_records_1.CustomerStatus.BLOCKED) {
        return crm_service_1.CustomerStatus.CUSTOMER_STATUS_BLOCKED;
    }
    if (status === crm_records_1.CustomerStatus.ARCHIVED) {
        return crm_service_1.CustomerStatus.CUSTOMER_STATUS_ARCHIVED;
    }
    return crm_service_1.CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER;
}
//# sourceMappingURL=customer-grpc.presenter.js.map