import { Observable } from "rxjs";
export declare enum SupplierStatus {
    SUPPLIER_STATUS_UNSPECIFIED = 0,
    SUPPLIER_STATUS_ACTIVE = 1,
    SUPPLIER_STATUS_INACTIVE = 2
}
export declare enum SupplierPartyBindingStatus {
    SUPPLIER_PARTY_BINDING_STATUS_UNSPECIFIED = 0,
    SUPPLIER_PARTY_BINDING_STATUS_ACTIVE = 1
}
export declare enum SupplierOfferingStatus {
    SUPPLIER_OFFERING_STATUS_UNSPECIFIED = 0,
    SUPPLIER_OFFERING_STATUS_ACTIVE = 1,
    SUPPLIER_OFFERING_STATUS_INACTIVE = 2
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
export interface SupplierPartyBindingSummary {
    tenantPartyId?: string | undefined;
    bindingStatus?: SupplierPartyBindingStatus | undefined;
    partyDisplayName?: string | undefined;
}
export interface SupplierProfile {
    supplierId?: string | undefined;
    supplierNo?: string | undefined;
    tenantId?: string | undefined;
    displayName?: string | undefined;
    status?: SupplierStatus | undefined;
    supplierCategory?: string | undefined;
    tags?: string[] | undefined;
    partyBinding?: SupplierPartyBindingSummary | undefined;
}
export interface SupplierContact {
    supplierContactId?: string | undefined;
    supplierId?: string | undefined;
    displayName?: string | undefined;
    roleTitle?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    isPrimaryContact?: boolean | undefined;
    isActive?: boolean | undefined;
}
export interface SupplierAddress {
    supplierAddressId?: string | undefined;
    supplierId?: string | undefined;
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
export interface SupplierOffering {
    supplierOfferingId?: string | undefined;
    supplierId?: string | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    status?: SupplierOfferingStatus | undefined;
}
export interface GetSupplierRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    supplierId?: string | undefined;
}
export interface GetSupplierResponse {
    supplier?: SupplierProfile | undefined;
}
export interface SearchSuppliersRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    keyword?: string | undefined;
    status?: SupplierStatus | undefined;
    tenantPartyId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchSuppliersResponse {
    suppliers?: SupplierProfile[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListSupplierContactsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    supplierId?: string | undefined;
}
export interface ListSupplierContactsResponse {
    contacts?: SupplierContact[] | undefined;
}
export interface ListSupplierAddressesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    supplierId?: string | undefined;
}
export interface ListSupplierAddressesResponse {
    addresses?: SupplierAddress[] | undefined;
}
export interface ListSupplierOfferingsBySupplierRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    supplierId?: string | undefined;
    status?: SupplierOfferingStatus | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListSupplierOfferingsBySupplierResponse {
    offerings?: SupplierOffering[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListSupplierOfferingsByItemRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    itemId?: string | undefined;
    status?: SupplierOfferingStatus | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListSupplierOfferingsByItemResponse {
    offerings?: SupplierOffering[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreateSupplierProfileRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    displayName?: string | undefined;
    supplierNo?: string | undefined;
    supplierCategory?: string | undefined;
    tags?: string[] | undefined;
}
export interface CreateSupplierProfileResponse {
    supplier?: SupplierProfile | undefined;
}
export interface UpdateSupplierProfileBasicsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    supplierId?: string | undefined;
    displayName?: string | undefined;
    supplierNo?: string | undefined;
    supplierCategory?: string | undefined;
    tags?: string[] | undefined;
}
export interface UpdateSupplierProfileBasicsResponse {
    supplier?: SupplierProfile | undefined;
}
export interface BindSupplierToTenantPartyRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    supplierId?: string | undefined;
    tenantPartyId?: string | undefined;
}
export interface BindSupplierToTenantPartyResponse {
    supplier?: SupplierProfile | undefined;
}
export interface UpsertSupplierContactRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    supplierId?: string | undefined;
    supplierContactId?: string | undefined;
    displayName?: string | undefined;
    roleTitle?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    isPrimaryContact?: boolean | undefined;
    isActive?: boolean | undefined;
}
export interface UpsertSupplierContactResponse {
    contact?: SupplierContact | undefined;
}
export interface UpsertSupplierAddressRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    supplierId?: string | undefined;
    supplierAddressId?: string | undefined;
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
export interface UpsertSupplierAddressResponse {
    address?: SupplierAddress | undefined;
}
export interface UpsertSupplierOfferingRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    supplierOfferingId?: string | undefined;
    supplierId?: string | undefined;
    itemId?: string | undefined;
    targetStatus?: SupplierOfferingStatus | undefined;
}
export interface UpsertSupplierOfferingResponse {
    offering?: SupplierOffering | undefined;
}
export interface ChangeSupplierStatusRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    supplierId?: string | undefined;
    targetStatus?: SupplierStatus | undefined;
}
export interface ChangeSupplierStatusResponse {
    supplier?: SupplierProfile | undefined;
}
export interface SupplierQueryServiceClient {
    getSupplier(request: GetSupplierRequest, ...rest: any): Observable<GetSupplierResponse>;
    searchSuppliers(request: SearchSuppliersRequest, ...rest: any): Observable<SearchSuppliersResponse>;
    listSupplierContacts(request: ListSupplierContactsRequest, ...rest: any): Observable<ListSupplierContactsResponse>;
    listSupplierAddresses(request: ListSupplierAddressesRequest, ...rest: any): Observable<ListSupplierAddressesResponse>;
    listSupplierOfferingsBySupplier(request: ListSupplierOfferingsBySupplierRequest, ...rest: any): Observable<ListSupplierOfferingsBySupplierResponse>;
    listSupplierOfferingsByItem(request: ListSupplierOfferingsByItemRequest, ...rest: any): Observable<ListSupplierOfferingsByItemResponse>;
}
export interface SupplierQueryServiceController {
    getSupplier(request: GetSupplierRequest, ...rest: any): Promise<GetSupplierResponse> | Observable<GetSupplierResponse> | GetSupplierResponse;
    searchSuppliers(request: SearchSuppliersRequest, ...rest: any): Promise<SearchSuppliersResponse> | Observable<SearchSuppliersResponse> | SearchSuppliersResponse;
    listSupplierContacts(request: ListSupplierContactsRequest, ...rest: any): Promise<ListSupplierContactsResponse> | Observable<ListSupplierContactsResponse> | ListSupplierContactsResponse;
    listSupplierAddresses(request: ListSupplierAddressesRequest, ...rest: any): Promise<ListSupplierAddressesResponse> | Observable<ListSupplierAddressesResponse> | ListSupplierAddressesResponse;
    listSupplierOfferingsBySupplier(request: ListSupplierOfferingsBySupplierRequest, ...rest: any): Promise<ListSupplierOfferingsBySupplierResponse> | Observable<ListSupplierOfferingsBySupplierResponse> | ListSupplierOfferingsBySupplierResponse;
    listSupplierOfferingsByItem(request: ListSupplierOfferingsByItemRequest, ...rest: any): Promise<ListSupplierOfferingsByItemResponse> | Observable<ListSupplierOfferingsByItemResponse> | ListSupplierOfferingsByItemResponse;
}
export declare function SupplierQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const SUPPLIER_QUERY_SERVICE_NAME = "SupplierQueryService";
export interface SupplierManagementServiceClient {
    createSupplierProfile(request: CreateSupplierProfileRequest, ...rest: any): Observable<CreateSupplierProfileResponse>;
    updateSupplierProfileBasics(request: UpdateSupplierProfileBasicsRequest, ...rest: any): Observable<UpdateSupplierProfileBasicsResponse>;
    bindSupplierToTenantParty(request: BindSupplierToTenantPartyRequest, ...rest: any): Observable<BindSupplierToTenantPartyResponse>;
    upsertSupplierContact(request: UpsertSupplierContactRequest, ...rest: any): Observable<UpsertSupplierContactResponse>;
    upsertSupplierAddress(request: UpsertSupplierAddressRequest, ...rest: any): Observable<UpsertSupplierAddressResponse>;
    upsertSupplierOffering(request: UpsertSupplierOfferingRequest, ...rest: any): Observable<UpsertSupplierOfferingResponse>;
    changeSupplierStatus(request: ChangeSupplierStatusRequest, ...rest: any): Observable<ChangeSupplierStatusResponse>;
}
export interface SupplierManagementServiceController {
    createSupplierProfile(request: CreateSupplierProfileRequest, ...rest: any): Promise<CreateSupplierProfileResponse> | Observable<CreateSupplierProfileResponse> | CreateSupplierProfileResponse;
    updateSupplierProfileBasics(request: UpdateSupplierProfileBasicsRequest, ...rest: any): Promise<UpdateSupplierProfileBasicsResponse> | Observable<UpdateSupplierProfileBasicsResponse> | UpdateSupplierProfileBasicsResponse;
    bindSupplierToTenantParty(request: BindSupplierToTenantPartyRequest, ...rest: any): Promise<BindSupplierToTenantPartyResponse> | Observable<BindSupplierToTenantPartyResponse> | BindSupplierToTenantPartyResponse;
    upsertSupplierContact(request: UpsertSupplierContactRequest, ...rest: any): Promise<UpsertSupplierContactResponse> | Observable<UpsertSupplierContactResponse> | UpsertSupplierContactResponse;
    upsertSupplierAddress(request: UpsertSupplierAddressRequest, ...rest: any): Promise<UpsertSupplierAddressResponse> | Observable<UpsertSupplierAddressResponse> | UpsertSupplierAddressResponse;
    upsertSupplierOffering(request: UpsertSupplierOfferingRequest, ...rest: any): Promise<UpsertSupplierOfferingResponse> | Observable<UpsertSupplierOfferingResponse> | UpsertSupplierOfferingResponse;
    changeSupplierStatus(request: ChangeSupplierStatusRequest, ...rest: any): Promise<ChangeSupplierStatusResponse> | Observable<ChangeSupplierStatusResponse> | ChangeSupplierStatusResponse;
}
export declare function SupplierManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const SUPPLIER_MANAGEMENT_SERVICE_NAME = "SupplierManagementService";
