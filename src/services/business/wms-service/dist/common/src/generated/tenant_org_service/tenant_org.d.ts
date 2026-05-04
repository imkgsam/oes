import { Observable } from "rxjs";
export interface TenantSummary {
    id?: string | undefined;
    code?: string | undefined;
    name?: string | undefined;
    status?: string | undefined;
    rootOrgId?: string | undefined;
}
export interface OrgUnitSummary {
    id?: string | undefined;
    tenantId?: string | undefined;
    parentOrgId?: string | undefined;
    name?: string | undefined;
    type?: string | undefined;
    status?: string | undefined;
    path?: string | undefined;
    depth?: number | undefined;
    sortOrder?: number | undefined;
    organizationPartyId?: string | undefined;
}
export interface OrgNode {
    orgUnit?: OrgUnitSummary | undefined;
    children?: OrgNode[] | undefined;
}
export interface ValidationResult {
    valid?: boolean | undefined;
    rejectionReason?: string | undefined;
    orgUnitSummary?: OrgUnitSummary | undefined;
}
export interface GetTenantByIdRequest {
    tenantId?: string | undefined;
}
export interface GetTenantByIdResponse {
    tenant?: TenantSummary | undefined;
}
export interface ListTenantsRequest {
    keyword?: string | undefined;
    status?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListTenantsResponse {
    tenants?: TenantSummary[] | undefined;
    total?: number | undefined;
}
export interface GetOrgTreeByTenantIdRequest {
    tenantId?: string | undefined;
}
export interface GetOrgTreeByTenantIdResponse {
    roots?: OrgNode[] | undefined;
}
export interface GetOrgUnitByIdRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
}
export interface GetOrgUnitByIdResponse {
    orgUnit?: OrgUnitSummary | undefined;
}
export interface ValidateOrgReferenceRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
    expectedOrgType?: string | undefined;
}
export interface ValidateOrgReferenceResponse {
    result?: ValidationResult | undefined;
}
export interface GetOrgReferenceSummaryRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
}
export interface GetOrgReferenceSummaryResponse {
    orgUnit?: OrgUnitSummary | undefined;
}
export interface ListAncestorOrgUnitsRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
}
export interface ListAncestorOrgUnitsResponse {
    ancestors?: OrgUnitSummary[] | undefined;
}
export interface ListDescendantOrgUnitsRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
    maxDepth?: number | undefined;
}
export interface ListDescendantOrgUnitsResponse {
    descendants?: OrgUnitSummary[] | undefined;
}
export interface CreateTenantRequest {
    code?: string | undefined;
    name?: string | undefined;
    rootOrgName?: string | undefined;
}
export interface CreateTenantResponse {
    tenant?: TenantSummary | undefined;
    rootOrgUnit?: OrgUnitSummary | undefined;
}
export interface UpdateTenantProfileRequest {
    tenantId?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
}
export interface UpdateTenantProfileResponse {
    tenant?: TenantSummary | undefined;
}
export interface SuspendTenantRequest {
    tenantId?: string | undefined;
    reason?: string | undefined;
}
export interface SuspendTenantResponse {
    tenant?: TenantSummary | undefined;
}
export interface ReactivateTenantRequest {
    tenantId?: string | undefined;
}
export interface ReactivateTenantResponse {
    tenant?: TenantSummary | undefined;
}
export interface ArchiveTenantRequest {
    tenantId?: string | undefined;
    reason?: string | undefined;
}
export interface ArchiveTenantResponse {
    tenant?: TenantSummary | undefined;
}
export interface CreateOrgUnitRequest {
    tenantId?: string | undefined;
    parentOrgId?: string | undefined;
    name?: string | undefined;
    type?: string | undefined;
    sortOrder?: number | undefined;
    organizationPartyId?: string | undefined;
}
export interface CreateOrgUnitResponse {
    orgUnit?: OrgUnitSummary | undefined;
}
export interface UpdateOrgUnitRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
    name?: string | undefined;
    type?: string | undefined;
    sortOrder?: number | undefined;
    organizationPartyId?: string | undefined;
}
export interface UpdateOrgUnitResponse {
    orgUnit?: OrgUnitSummary | undefined;
}
export interface MoveOrgUnitRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
    newParentOrgId?: string | undefined;
}
export interface MoveOrgUnitResponse {
    orgUnit?: OrgUnitSummary | undefined;
}
export interface ArchiveOrgUnitRequest {
    tenantId?: string | undefined;
    orgUnitId?: string | undefined;
    reason?: string | undefined;
}
export interface ArchiveOrgUnitResponse {
    orgUnit?: OrgUnitSummary | undefined;
}
export interface TenantOrgQueryServiceClient {
    getTenantById(request: GetTenantByIdRequest, ...rest: any): Observable<GetTenantByIdResponse>;
    listTenants(request: ListTenantsRequest, ...rest: any): Observable<ListTenantsResponse>;
    getOrgTreeByTenantId(request: GetOrgTreeByTenantIdRequest, ...rest: any): Observable<GetOrgTreeByTenantIdResponse>;
    getOrgUnitById(request: GetOrgUnitByIdRequest, ...rest: any): Observable<GetOrgUnitByIdResponse>;
    validateOrgReference(request: ValidateOrgReferenceRequest, ...rest: any): Observable<ValidateOrgReferenceResponse>;
    getOrgReferenceSummary(request: GetOrgReferenceSummaryRequest, ...rest: any): Observable<GetOrgReferenceSummaryResponse>;
    listAncestorOrgUnits(request: ListAncestorOrgUnitsRequest, ...rest: any): Observable<ListAncestorOrgUnitsResponse>;
    listDescendantOrgUnits(request: ListDescendantOrgUnitsRequest, ...rest: any): Observable<ListDescendantOrgUnitsResponse>;
}
export interface TenantOrgQueryServiceController {
    getTenantById(request: GetTenantByIdRequest, ...rest: any): Promise<GetTenantByIdResponse> | Observable<GetTenantByIdResponse> | GetTenantByIdResponse;
    listTenants(request: ListTenantsRequest, ...rest: any): Promise<ListTenantsResponse> | Observable<ListTenantsResponse> | ListTenantsResponse;
    getOrgTreeByTenantId(request: GetOrgTreeByTenantIdRequest, ...rest: any): Promise<GetOrgTreeByTenantIdResponse> | Observable<GetOrgTreeByTenantIdResponse> | GetOrgTreeByTenantIdResponse;
    getOrgUnitById(request: GetOrgUnitByIdRequest, ...rest: any): Promise<GetOrgUnitByIdResponse> | Observable<GetOrgUnitByIdResponse> | GetOrgUnitByIdResponse;
    validateOrgReference(request: ValidateOrgReferenceRequest, ...rest: any): Promise<ValidateOrgReferenceResponse> | Observable<ValidateOrgReferenceResponse> | ValidateOrgReferenceResponse;
    getOrgReferenceSummary(request: GetOrgReferenceSummaryRequest, ...rest: any): Promise<GetOrgReferenceSummaryResponse> | Observable<GetOrgReferenceSummaryResponse> | GetOrgReferenceSummaryResponse;
    listAncestorOrgUnits(request: ListAncestorOrgUnitsRequest, ...rest: any): Promise<ListAncestorOrgUnitsResponse> | Observable<ListAncestorOrgUnitsResponse> | ListAncestorOrgUnitsResponse;
    listDescendantOrgUnits(request: ListDescendantOrgUnitsRequest, ...rest: any): Promise<ListDescendantOrgUnitsResponse> | Observable<ListDescendantOrgUnitsResponse> | ListDescendantOrgUnitsResponse;
}
export declare function TenantOrgQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const TENANT_ORG_QUERY_SERVICE_NAME = "TenantOrgQueryService";
export interface TenantOrgManagementServiceClient {
    createTenant(request: CreateTenantRequest, ...rest: any): Observable<CreateTenantResponse>;
    updateTenantProfile(request: UpdateTenantProfileRequest, ...rest: any): Observable<UpdateTenantProfileResponse>;
    suspendTenant(request: SuspendTenantRequest, ...rest: any): Observable<SuspendTenantResponse>;
    reactivateTenant(request: ReactivateTenantRequest, ...rest: any): Observable<ReactivateTenantResponse>;
    archiveTenant(request: ArchiveTenantRequest, ...rest: any): Observable<ArchiveTenantResponse>;
    createOrgUnit(request: CreateOrgUnitRequest, ...rest: any): Observable<CreateOrgUnitResponse>;
    updateOrgUnit(request: UpdateOrgUnitRequest, ...rest: any): Observable<UpdateOrgUnitResponse>;
    moveOrgUnit(request: MoveOrgUnitRequest, ...rest: any): Observable<MoveOrgUnitResponse>;
    archiveOrgUnit(request: ArchiveOrgUnitRequest, ...rest: any): Observable<ArchiveOrgUnitResponse>;
}
export interface TenantOrgManagementServiceController {
    createTenant(request: CreateTenantRequest, ...rest: any): Promise<CreateTenantResponse> | Observable<CreateTenantResponse> | CreateTenantResponse;
    updateTenantProfile(request: UpdateTenantProfileRequest, ...rest: any): Promise<UpdateTenantProfileResponse> | Observable<UpdateTenantProfileResponse> | UpdateTenantProfileResponse;
    suspendTenant(request: SuspendTenantRequest, ...rest: any): Promise<SuspendTenantResponse> | Observable<SuspendTenantResponse> | SuspendTenantResponse;
    reactivateTenant(request: ReactivateTenantRequest, ...rest: any): Promise<ReactivateTenantResponse> | Observable<ReactivateTenantResponse> | ReactivateTenantResponse;
    archiveTenant(request: ArchiveTenantRequest, ...rest: any): Promise<ArchiveTenantResponse> | Observable<ArchiveTenantResponse> | ArchiveTenantResponse;
    createOrgUnit(request: CreateOrgUnitRequest, ...rest: any): Promise<CreateOrgUnitResponse> | Observable<CreateOrgUnitResponse> | CreateOrgUnitResponse;
    updateOrgUnit(request: UpdateOrgUnitRequest, ...rest: any): Promise<UpdateOrgUnitResponse> | Observable<UpdateOrgUnitResponse> | UpdateOrgUnitResponse;
    moveOrgUnit(request: MoveOrgUnitRequest, ...rest: any): Promise<MoveOrgUnitResponse> | Observable<MoveOrgUnitResponse> | MoveOrgUnitResponse;
    archiveOrgUnit(request: ArchiveOrgUnitRequest, ...rest: any): Promise<ArchiveOrgUnitResponse> | Observable<ArchiveOrgUnitResponse> | ArchiveOrgUnitResponse;
}
export declare function TenantOrgManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const TENANT_ORG_MANAGEMENT_SERVICE_NAME = "TenantOrgManagementService";
