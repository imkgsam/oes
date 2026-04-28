import { BindCustomerAccountToTenantPartyResponse, ChangeCustomerStatusResponse, CreateCustomerAccountResponse, CustomerAccount, CustomerAddress, CustomerStatus as ProtoCustomerStatus, GetCustomerAccountResponse, ListCustomerAddressesResponse, ListCustomerContactsResponse, SearchCustomerAccountsResponse, SearchSelectableCustomersResponse, UpsertCustomerAddressResponse, UpsertCustomerContactResponse } from '@oes/common/generated/crm_service';
import { CustomerAccountRecord, CustomerAddressRecord, CustomerContactRecord, SelectableCustomerRecord } from '../../domain/models/crm-records';
import { ListCustomerAddressesResult } from '../../application/queries/list-customer-addresses.handler';
import { ListCustomerContactsResult } from '../../application/queries/list-customer-contacts.handler';
import { SearchCustomerAccountsResult } from '../../application/queries/search-customer-accounts.handler';
import { SearchSelectableCustomersResult } from '../../application/queries/search-selectable-customers.handler';
/** CustomerGrpcPresenter maps CRM domain records into the frozen phase 1 gRPC response shapes. */
export declare class CustomerGrpcPresenter {
    /** toCustomerAccount renders one CRM customer-account shell with its optional active primary binding summary. */
    static toCustomerAccount(account: CustomerAccountRecord): CustomerAccount;
    /** toSelectableCustomer renders one selector-eligible CRM customer summary. */
    static toSelectableCustomer(customer: SelectableCustomerRecord): {
        customerAccountId: string;
        customerAccountNo: string;
        displayName: string;
        status: ProtoCustomerStatus;
        primaryTenantPartyId: string;
        primaryPartyDisplayName: string;
    };
    /** toCustomerContact renders one CRM business-contact relationship record. */
    static toCustomerContact(contact: CustomerContactRecord): {
        customerContactId: string;
        customerAccountId: string;
        displayName: string;
        roleTitle: string;
        email: string;
        phone: string;
        isPrimaryContact: boolean;
        isActive: boolean;
    };
    /** toCustomerAddress renders one CRM business-address relationship record. */
    static toCustomerAddress(address: CustomerAddressRecord): CustomerAddress;
    /** toCreateCustomerAccountResponse renders one CreateCustomerAccount success payload. */
    static toCreateCustomerAccountResponse(account: CustomerAccountRecord): CreateCustomerAccountResponse;
    /** toGetCustomerAccountResponse renders one GetCustomerAccount success payload. */
    static toGetCustomerAccountResponse(account: CustomerAccountRecord): GetCustomerAccountResponse;
    /** toSearchSelectableCustomersResponse renders one selector search success payload. */
    static toSearchSelectableCustomersResponse(result: SearchSelectableCustomersResult): SearchSelectableCustomersResponse;
    /** toSearchCustomerAccountsResponse renders one CRM account-directory search success payload. */
    static toSearchCustomerAccountsResponse(result: SearchCustomerAccountsResult): SearchCustomerAccountsResponse;
    /** toListCustomerContactsResponse renders one CRM contact-list success payload. */
    static toListCustomerContactsResponse(result: ListCustomerContactsResult): ListCustomerContactsResponse;
    /** toListCustomerAddressesResponse renders one CRM address-list success payload. */
    static toListCustomerAddressesResponse(result: ListCustomerAddressesResult): ListCustomerAddressesResponse;
    /** toUpdateCustomerAccountBasicsResponse renders one account-basics update success payload. */
    static toUpdateCustomerAccountBasicsResponse(account: CustomerAccountRecord): {
        customerAccount: CustomerAccount;
    };
    /** toBindCustomerAccountToTenantPartyResponse renders one primary-binding success payload. */
    static toBindCustomerAccountToTenantPartyResponse(account: CustomerAccountRecord): BindCustomerAccountToTenantPartyResponse;
    /** toUpsertCustomerContactResponse renders one contact write success payload. */
    static toUpsertCustomerContactResponse(contact: CustomerContactRecord): UpsertCustomerContactResponse;
    /** toUpsertCustomerAddressResponse renders one address write success payload. */
    static toUpsertCustomerAddressResponse(address: CustomerAddressRecord): UpsertCustomerAddressResponse;
    /** toChangeCustomerStatusResponse renders one customer-status change success payload. */
    static toChangeCustomerStatusResponse(account: CustomerAccountRecord): ChangeCustomerStatusResponse;
}
