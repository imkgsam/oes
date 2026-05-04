import { Observable } from "rxjs";
export declare enum CustomerStatus {
    CUSTOMER_STATUS_UNSPECIFIED = 0,
    CUSTOMER_STATUS_ACTIVE_CUSTOMER = 1,
    CUSTOMER_STATUS_BLOCKED = 2,
    CUSTOMER_STATUS_ARCHIVED = 3
}
export declare enum CustomerPartyBindingStatus {
    CUSTOMER_PARTY_BINDING_STATUS_UNSPECIFIED = 0,
    CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY = 1
}
export interface OperatorContext {
    operatorId?: string | undefined;
    operatorType?: string | undefined;
    orgId?: string | undefined;
}
export interface TraceContext {
    traceId?: string | undefined;
    requestId?: string | undefined;
}
export interface AuditContext {
    auditId?: string | undefined;
    reason?: string | undefined;
    source?: string | undefined;
}
export interface CustomerPartyBindingSummary {
    customerPartyBindingId?: string | undefined;
    tenantPartyId?: string | undefined;
    bindingStatus?: CustomerPartyBindingStatus | undefined;
    partyDisplayName?: string | undefined;
}
export interface CustomerAccount {
    customerAccountId?: string | undefined;
    customerAccountNo?: string | undefined;
    tenantId?: string | undefined;
    displayName?: string | undefined;
    status?: CustomerStatus | undefined;
    customerCategory?: string | undefined;
    tags?: string[] | undefined;
    primaryBinding?: CustomerPartyBindingSummary | undefined;
}
export interface SelectableCustomer {
    customerAccountId?: string | undefined;
    customerAccountNo?: string | undefined;
    displayName?: string | undefined;
    status?: CustomerStatus | undefined;
    primaryTenantPartyId?: string | undefined;
    primaryPartyDisplayName?: string | undefined;
}
export interface CustomerContact {
    customerContactId?: string | undefined;
    customerAccountId?: string | undefined;
    displayName?: string | undefined;
    roleTitle?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    isPrimaryContact?: boolean | undefined;
    isActive?: boolean | undefined;
}
export interface CustomerAddress {
    customerAddressId?: string | undefined;
    customerAccountId?: string | undefined;
    label?: string | undefined;
    countryCode?: string | undefined;
    region?: string | undefined;
    locality?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | undefined;
    postalCode?: string | undefined;
    isPrimaryAddress?: boolean | undefined;
    isActive?: boolean | undefined;
}
export interface SearchSelectableCustomersRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    keyword?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchSelectableCustomersResponse {
    customers?: SelectableCustomer[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetCustomerAccountRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    customerAccountId?: string | undefined;
}
export interface GetCustomerAccountResponse {
    customerAccount?: CustomerAccount | undefined;
}
export interface SearchCustomerAccountsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    keyword?: string | undefined;
    status?: CustomerStatus | undefined;
    primaryTenantPartyId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchCustomerAccountsResponse {
    customerAccounts?: CustomerAccount[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListCustomerContactsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    customerAccountId?: string | undefined;
}
export interface ListCustomerContactsResponse {
    contacts?: CustomerContact[] | undefined;
}
export interface ListCustomerAddressesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    customerAccountId?: string | undefined;
}
export interface ListCustomerAddressesResponse {
    addresses?: CustomerAddress[] | undefined;
}
export interface CreateCustomerAccountRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    displayName?: string | undefined;
    customerCategory?: string | undefined;
    tags?: string[] | undefined;
}
export interface CreateCustomerAccountResponse {
    customerAccount?: CustomerAccount | undefined;
}
export interface UpdateCustomerAccountBasicsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerAccountId?: string | undefined;
    displayName?: string | undefined;
    customerCategory?: string | undefined;
    tags?: string[] | undefined;
}
export interface UpdateCustomerAccountBasicsResponse {
    customerAccount?: CustomerAccount | undefined;
}
export interface BindCustomerAccountToTenantPartyRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerAccountId?: string | undefined;
    tenantPartyId?: string | undefined;
}
export interface BindCustomerAccountToTenantPartyResponse {
    customerAccount?: CustomerAccount | undefined;
}
export interface UpsertCustomerContactRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerAccountId?: string | undefined;
    customerContactId?: string | undefined;
    displayName?: string | undefined;
    roleTitle?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    isPrimaryContact?: boolean | undefined;
    isActive?: boolean | undefined;
}
export interface UpsertCustomerContactResponse {
    contact?: CustomerContact | undefined;
}
export interface UpsertCustomerAddressRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerAccountId?: string | undefined;
    customerAddressId?: string | undefined;
    label?: string | undefined;
    countryCode?: string | undefined;
    region?: string | undefined;
    locality?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | undefined;
    postalCode?: string | undefined;
    isPrimaryAddress?: boolean | undefined;
    isActive?: boolean | undefined;
}
export interface UpsertCustomerAddressResponse {
    address?: CustomerAddress | undefined;
}
export interface ChangeCustomerStatusRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerAccountId?: string | undefined;
    targetStatus?: CustomerStatus | undefined;
}
export interface ChangeCustomerStatusResponse {
    customerAccount?: CustomerAccount | undefined;
}
export interface CustomerQueryServiceClient {
    searchSelectableCustomers(request: SearchSelectableCustomersRequest, ...rest: any): Observable<SearchSelectableCustomersResponse>;
    getCustomerAccount(request: GetCustomerAccountRequest, ...rest: any): Observable<GetCustomerAccountResponse>;
    searchCustomerAccounts(request: SearchCustomerAccountsRequest, ...rest: any): Observable<SearchCustomerAccountsResponse>;
    listCustomerContacts(request: ListCustomerContactsRequest, ...rest: any): Observable<ListCustomerContactsResponse>;
    listCustomerAddresses(request: ListCustomerAddressesRequest, ...rest: any): Observable<ListCustomerAddressesResponse>;
}
export interface CustomerQueryServiceController {
    searchSelectableCustomers(request: SearchSelectableCustomersRequest, ...rest: any): Promise<SearchSelectableCustomersResponse> | Observable<SearchSelectableCustomersResponse> | SearchSelectableCustomersResponse;
    getCustomerAccount(request: GetCustomerAccountRequest, ...rest: any): Promise<GetCustomerAccountResponse> | Observable<GetCustomerAccountResponse> | GetCustomerAccountResponse;
    searchCustomerAccounts(request: SearchCustomerAccountsRequest, ...rest: any): Promise<SearchCustomerAccountsResponse> | Observable<SearchCustomerAccountsResponse> | SearchCustomerAccountsResponse;
    listCustomerContacts(request: ListCustomerContactsRequest, ...rest: any): Promise<ListCustomerContactsResponse> | Observable<ListCustomerContactsResponse> | ListCustomerContactsResponse;
    listCustomerAddresses(request: ListCustomerAddressesRequest, ...rest: any): Promise<ListCustomerAddressesResponse> | Observable<ListCustomerAddressesResponse> | ListCustomerAddressesResponse;
}
export declare function CustomerQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const CUSTOMER_QUERY_SERVICE_NAME = "CustomerQueryService";
export interface CustomerManagementServiceClient {
    createCustomerAccount(request: CreateCustomerAccountRequest, ...rest: any): Observable<CreateCustomerAccountResponse>;
    updateCustomerAccountBasics(request: UpdateCustomerAccountBasicsRequest, ...rest: any): Observable<UpdateCustomerAccountBasicsResponse>;
    bindCustomerAccountToTenantParty(request: BindCustomerAccountToTenantPartyRequest, ...rest: any): Observable<BindCustomerAccountToTenantPartyResponse>;
    upsertCustomerContact(request: UpsertCustomerContactRequest, ...rest: any): Observable<UpsertCustomerContactResponse>;
    upsertCustomerAddress(request: UpsertCustomerAddressRequest, ...rest: any): Observable<UpsertCustomerAddressResponse>;
    changeCustomerStatus(request: ChangeCustomerStatusRequest, ...rest: any): Observable<ChangeCustomerStatusResponse>;
}
export interface CustomerManagementServiceController {
    createCustomerAccount(request: CreateCustomerAccountRequest, ...rest: any): Promise<CreateCustomerAccountResponse> | Observable<CreateCustomerAccountResponse> | CreateCustomerAccountResponse;
    updateCustomerAccountBasics(request: UpdateCustomerAccountBasicsRequest, ...rest: any): Promise<UpdateCustomerAccountBasicsResponse> | Observable<UpdateCustomerAccountBasicsResponse> | UpdateCustomerAccountBasicsResponse;
    bindCustomerAccountToTenantParty(request: BindCustomerAccountToTenantPartyRequest, ...rest: any): Promise<BindCustomerAccountToTenantPartyResponse> | Observable<BindCustomerAccountToTenantPartyResponse> | BindCustomerAccountToTenantPartyResponse;
    upsertCustomerContact(request: UpsertCustomerContactRequest, ...rest: any): Promise<UpsertCustomerContactResponse> | Observable<UpsertCustomerContactResponse> | UpsertCustomerContactResponse;
    upsertCustomerAddress(request: UpsertCustomerAddressRequest, ...rest: any): Promise<UpsertCustomerAddressResponse> | Observable<UpsertCustomerAddressResponse> | UpsertCustomerAddressResponse;
    changeCustomerStatus(request: ChangeCustomerStatusRequest, ...rest: any): Promise<ChangeCustomerStatusResponse> | Observable<ChangeCustomerStatusResponse> | ChangeCustomerStatusResponse;
}
export declare function CustomerManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const CUSTOMER_MANAGEMENT_SERVICE_NAME = "CustomerManagementService";
