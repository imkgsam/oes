import { ValidatingQueryBus } from '@oes/common/cqrs';
import { CustomerQueryServiceController, GetCustomerAccountRequest, GetCustomerAccountResponse, ListCustomerAddressesRequest, ListCustomerAddressesResponse, ListCustomerContactsRequest, ListCustomerContactsResponse, SearchCustomerAccountsRequest, SearchCustomerAccountsResponse, SearchSelectableCustomersRequest, SearchSelectableCustomersResponse } from '@oes/common/generated/crm_service';
/** CustomerQueryGrpcController exposes the phase 1 CRM read-only query contract. */
export declare class CustomerQueryGrpcController implements CustomerQueryServiceController {
    private readonly queryBus;
    constructor(queryBus: ValidatingQueryBus);
    searchSelectableCustomers(request: SearchSelectableCustomersRequest): Promise<SearchSelectableCustomersResponse>;
    getCustomerAccount(request: GetCustomerAccountRequest): Promise<GetCustomerAccountResponse>;
    searchCustomerAccounts(request: SearchCustomerAccountsRequest): Promise<SearchCustomerAccountsResponse>;
    listCustomerContacts(request: ListCustomerContactsRequest): Promise<ListCustomerContactsResponse>;
    listCustomerAddresses(request: ListCustomerAddressesRequest): Promise<ListCustomerAddressesResponse>;
}
