import { Observable } from "rxjs";
export declare enum RoleKindProto {
    ROLE_KIND_PROTO_UNSPECIFIED = 0,
    ROLE_KIND_PROTO_SYSTEM_TEMPLATE = 1,
    ROLE_KIND_PROTO_TENANT_INSTANCE = 2,
    ROLE_KIND_PROTO_SYSTEM_INSTANCE = 3
}
export interface CreatePermissionRequest {
    code?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface BatchCreatePermissionItem {
    code?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface BatchCreatePermissionsRequest {
    permissions?: BatchCreatePermissionItem[] | undefined;
}
export interface DeletePermissionRequest {
    id?: string | undefined;
}
export interface UpdatePermissionRequest {
    id?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface GetPermissionByIdRequest {
    id?: string | undefined;
}
export interface GetPermissionByCodeRequest {
    code?: string | undefined;
}
export interface ListPermissionsPagedRequest {
    page?: number | undefined;
    pageSize?: number | undefined;
    module?: string | undefined;
    keyword?: string | undefined;
}
export interface ListPermissionRolesRequest {
    permissionId?: string | undefined;
}
export interface PermissionResponse {
    id?: string | undefined;
    code?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface CreatePermissionResponse {
    id?: string | undefined;
    code?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface UpdatePermissionResponse {
    id?: string | undefined;
    code?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface DeletePermissionResponse {
}
export interface GetPermissionByIdResponse {
    id?: string | undefined;
    code?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface GetPermissionByCodeResponse {
    id?: string | undefined;
    code?: string | undefined;
    module?: string | undefined;
    description?: string | undefined;
}
export interface ListPermissionsResponse {
    permissions?: PermissionResponse[] | undefined;
}
export interface BatchCreatePermissionsResponse {
    permissions?: PermissionResponse[] | undefined;
}
export interface PagedPermissionsResponse {
    permissions?: PermissionResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListPermissionsPagedResponse {
    permissions?: PermissionResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreateRoleTemplateRequest {
    name?: string | undefined;
    code?: string | undefined;
    description?: string | undefined;
}
export interface CreateRoleInstanceRequest {
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    description?: string | undefined;
    templateRoleId?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface GetRoleTemplateByIdRequest {
    id?: string | undefined;
}
export interface UpdateRoleTemplateRequest {
    id?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
}
export interface DeleteRoleTemplateRequest {
    id?: string | undefined;
}
export interface SetRoleTemplateEnabledRequest {
    id?: string | undefined;
    isEnabled?: boolean | undefined;
}
export interface ListRoleTemplatePermissionsRequest {
    roleTemplateId?: string | undefined;
}
export interface AssignRoleTemplatePermissionRequest {
    roleTemplateId?: string | undefined;
    permissionId?: string | undefined;
}
export interface RevokeRoleTemplatePermissionRequest {
    roleTemplateId?: string | undefined;
    permissionId?: string | undefined;
}
export interface CreateRoleInstanceFromTemplateRequest {
    templateRoleId?: string | undefined;
    tenantId?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    description?: string | undefined;
}
export interface UpdateRoleRequest {
    id?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
}
export interface SetRoleEnabledRequest {
    id?: string | undefined;
    isEnabled?: boolean | undefined;
}
export interface DeleteRoleRequest {
    id?: string | undefined;
}
export interface GetRoleByIdRequest {
    id?: string | undefined;
}
export interface ListRoleInstancesRequest {
    page?: number | undefined;
    pageSize?: number | undefined;
    tenantId?: string | undefined;
    keyword?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface ListRoleTemplatesRequest {
    page?: number | undefined;
    pageSize?: number | undefined;
    keyword?: string | undefined;
}
export interface ListRolePermissionsRequest {
    roleId?: string | undefined;
}
export interface RoleResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface ListRolesResponse {
    roles?: RoleResponse[] | undefined;
}
export interface ListPermissionRolesResponse {
    roles?: RoleResponse[] | undefined;
}
export interface PagedRolesResponse {
    roles?: RoleResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreateRoleTemplateResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface CreateRoleInstanceResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface GetRoleTemplateByIdResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface UpdateRoleTemplateResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface DeleteRoleTemplateResponse {
}
export interface SetRoleTemplateEnabledResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface ListRoleTemplatePermissionsResponse {
    permissions?: PermissionResponse[] | undefined;
}
export interface AssignRoleTemplatePermissionResponse {
}
export interface RevokeRoleTemplatePermissionResponse {
}
export interface CreateRoleInstanceFromTemplateResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface UpdateRoleResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface SetRoleEnabledResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface DeleteRoleResponse {
}
export interface GetRoleByIdResponse {
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    tenantId?: string | undefined;
    isSystem?: boolean | undefined;
    isEnabled?: boolean | undefined;
    description?: string | undefined;
    roleKind?: RoleKindProto | undefined;
    templateRoleId?: string | undefined;
}
export interface ListRoleInstancesResponse {
    roles?: RoleResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListRoleTemplatesResponse {
    roles?: RoleResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListRolePermissionsResponse {
    permissions?: PermissionResponse[] | undefined;
}
export interface AssignRolePermissionRequest {
    roleId?: string | undefined;
    permissionId?: string | undefined;
    createdBy?: string | undefined;
}
export interface AssignRolePermissionResponse {
}
export interface RevokeRolePermissionRequest {
    roleId?: string | undefined;
    permissionId?: string | undefined;
}
export interface RevokeRolePermissionResponse {
}
export interface AssignAccountRoleRequest {
    accountId?: string | undefined;
    accountType?: string | undefined;
    roleId?: string | undefined;
    tenantId?: string | undefined;
    createdBy?: string | undefined;
    effectiveAt?: string | undefined;
    expiresAt?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface AssignAccountRoleResponse {
}
export interface GrantInitialAccessForEmployeeAccountRequest {
    tenantId?: string | undefined;
    accountId?: string | undefined;
    roleIds?: string[] | undefined;
    idempotencyKey?: string | undefined;
    reason?: string | undefined;
}
export interface OnboardingGrantResponse {
    id?: string | undefined;
    tenantId?: string | undefined;
    accountId?: string | undefined;
    roleIds?: string[] | undefined;
    idempotencyKey?: string | undefined;
}
export interface GrantInitialAccessForEmployeeAccountResponse {
    grant?: OnboardingGrantResponse | undefined;
}
export interface RevokeAccountRoleRequest {
    accountId?: string | undefined;
    roleId?: string | undefined;
}
export interface RevokeAccountRoleResponse {
}
export interface ListAccountRolesRequest {
    accountId?: string | undefined;
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface GetAccountRoleSelectionRequest {
    accountId?: string | undefined;
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface SetAccountRolesRequest {
    accountId?: string | undefined;
    accountType?: string | undefined;
    tenantId?: string | undefined;
    roleIds?: string[] | undefined;
    scopeLevel?: string | undefined;
}
export interface ListRoleAccountsRequest {
    roleId?: string | undefined;
}
export interface AccountRoleBindingResponse {
    accountId?: string | undefined;
    accountType?: string | undefined;
    roleId?: string | undefined;
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface ListRoleAccountsResponse {
    accounts?: AccountRoleBindingResponse[] | undefined;
}
export interface AccountRoleSelectionResponse {
    availableRoles?: RoleResponse[] | undefined;
    selectedRoleIds?: string[] | undefined;
}
export interface ListAccountRolesResponse {
    roles?: RoleResponse[] | undefined;
}
export interface GetAccountRoleSelectionResponse {
    availableRoles?: RoleResponse[] | undefined;
    selectedRoleIds?: string[] | undefined;
}
export interface SetAccountRolesResponse {
    roles?: RoleResponse[] | undefined;
}
export interface ListAuditEventsRequest {
    service?: string | undefined;
    module?: string | undefined;
    eventType?: string | undefined;
    result?: string | undefined;
    operatorId?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    occurredAtFrom?: string | undefined;
    occurredAtTo?: string | undefined;
    pageSize?: number | undefined;
    cursor?: string | undefined;
}
export interface PermissionAuditEventRecord {
    eventId?: string | undefined;
    service?: string | undefined;
    module?: string | undefined;
    eventType?: string | undefined;
    occurredAt?: string | undefined;
    result?: string | undefined;
    operatorId?: string | undefined;
    operatorType?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    traceId?: string | undefined;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    detailsJson?: string | undefined;
}
export interface ListAuditEventsResponse {
    items?: PermissionAuditEventRecord[] | undefined;
    nextCursor?: string | undefined;
}
export interface NavigationEntryResponse {
    entryKey?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    featureKey?: string | undefined;
    supportedTerminals?: string[] | undefined;
    registryPriority?: number | undefined;
    enabled?: boolean | undefined;
    entryType?: string | undefined;
}
export interface GetNavigationEntryResponse {
    entryKey?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    featureKey?: string | undefined;
    supportedTerminals?: string[] | undefined;
    registryPriority?: number | undefined;
    enabled?: boolean | undefined;
    entryType?: string | undefined;
}
export interface CreateNavigationEntryResponse {
    entryKey?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    featureKey?: string | undefined;
    supportedTerminals?: string[] | undefined;
    registryPriority?: number | undefined;
    enabled?: boolean | undefined;
    entryType?: string | undefined;
}
export interface UpdateNavigationEntryResponse {
    entryKey?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    featureKey?: string | undefined;
    supportedTerminals?: string[] | undefined;
    registryPriority?: number | undefined;
    enabled?: boolean | undefined;
    entryType?: string | undefined;
}
export interface ListNavigationEntriesRequest {
    page?: number | undefined;
    pageSize?: number | undefined;
    keyword?: string | undefined;
    featureKey?: string | undefined;
    terminal?: string | undefined;
    hasEnabledFilter?: boolean | undefined;
    enabled?: boolean | undefined;
}
export interface ListNavigationEntriesResponse {
    entries?: NavigationEntryResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetNavigationEntryRequest {
    entryKey?: string | undefined;
}
export interface CreateNavigationEntryRequest {
    entryKey?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    featureKey?: string | undefined;
    supportedTerminals?: string[] | undefined;
    registryPriority?: number | undefined;
    enabled?: boolean | undefined;
    entryType?: string | undefined;
}
export interface UpdateNavigationEntryRequest {
    entryKey?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    featureKey?: string | undefined;
    supportedTerminals?: string[] | undefined;
    registryPriority?: number | undefined;
    enabled?: boolean | undefined;
    entryType?: string | undefined;
}
export interface RoleNavigationVisibilityResponse {
    roleId?: string | undefined;
    entryKey?: string | undefined;
    terminal?: string | undefined;
    enabled?: boolean | undefined;
}
export interface RoleLandingPolicyResponse {
    roleId?: string | undefined;
    terminal?: string | undefined;
    defaultEntryKey?: string | undefined;
    priority?: number | undefined;
    enabled?: boolean | undefined;
}
export interface RoleNavigationResponse {
    roleId?: string | undefined;
    visibility?: RoleNavigationVisibilityResponse[] | undefined;
    landingPolicies?: RoleLandingPolicyResponse[] | undefined;
}
export interface GetRoleNavigationResponse {
    roleId?: string | undefined;
    visibility?: RoleNavigationVisibilityResponse[] | undefined;
    landingPolicies?: RoleLandingPolicyResponse[] | undefined;
}
export interface SetRoleNavigationVisibilityResponse {
    roleId?: string | undefined;
    visibility?: RoleNavigationVisibilityResponse[] | undefined;
    landingPolicies?: RoleLandingPolicyResponse[] | undefined;
}
export interface SetRoleLandingPoliciesResponse {
    roleId?: string | undefined;
    visibility?: RoleNavigationVisibilityResponse[] | undefined;
    landingPolicies?: RoleLandingPolicyResponse[] | undefined;
}
export interface SyncRoleNavigationFromTemplateResponse {
    roleId?: string | undefined;
    visibility?: RoleNavigationVisibilityResponse[] | undefined;
    landingPolicies?: RoleLandingPolicyResponse[] | undefined;
}
export interface GetRoleNavigationRequest {
    roleId?: string | undefined;
}
export interface RoleNavigationVisibilityInput {
    entryKey?: string | undefined;
    terminal?: string | undefined;
    enabled?: boolean | undefined;
}
export interface SetRoleNavigationVisibilityRequest {
    roleId?: string | undefined;
    visibility?: RoleNavigationVisibilityInput[] | undefined;
}
export interface RoleLandingPolicyInput {
    terminal?: string | undefined;
    defaultEntryKey?: string | undefined;
    priority?: number | undefined;
    enabled?: boolean | undefined;
}
export interface SetRoleLandingPoliciesRequest {
    roleId?: string | undefined;
    landingPolicies?: RoleLandingPolicyInput[] | undefined;
}
export interface SyncRoleNavigationFromTemplateRequest {
    roleId?: string | undefined;
}
export interface ResolveNavigationPreviewRequest {
    roleIds?: string[] | undefined;
    scopeLevel?: string | undefined;
    terminal?: string | undefined;
}
export interface ResolveNavigationPreviewResponse {
    visibleEntries?: string[] | undefined;
    defaultEntry?: string | undefined;
    resolvedByRoleId?: string | undefined;
    fallbackReason?: string | undefined;
}
export interface PermissionManagementServiceClient {
    createPermission(request: CreatePermissionRequest, ...rest: any): Observable<CreatePermissionResponse>;
    batchCreatePermissions(request: BatchCreatePermissionsRequest, ...rest: any): Observable<BatchCreatePermissionsResponse>;
    updatePermission(request: UpdatePermissionRequest, ...rest: any): Observable<UpdatePermissionResponse>;
    deletePermission(request: DeletePermissionRequest, ...rest: any): Observable<DeletePermissionResponse>;
    getPermissionById(request: GetPermissionByIdRequest, ...rest: any): Observable<GetPermissionByIdResponse>;
    getPermissionByCode(request: GetPermissionByCodeRequest, ...rest: any): Observable<GetPermissionByCodeResponse>;
    listPermissionsPaged(request: ListPermissionsPagedRequest, ...rest: any): Observable<ListPermissionsPagedResponse>;
    listPermissionRoles(request: ListPermissionRolesRequest, ...rest: any): Observable<ListPermissionRolesResponse>;
    createRoleTemplate(request: CreateRoleTemplateRequest, ...rest: any): Observable<CreateRoleTemplateResponse>;
    createRoleInstance(request: CreateRoleInstanceRequest, ...rest: any): Observable<CreateRoleInstanceResponse>;
    getRoleTemplateById(request: GetRoleTemplateByIdRequest, ...rest: any): Observable<GetRoleTemplateByIdResponse>;
    updateRoleTemplate(request: UpdateRoleTemplateRequest, ...rest: any): Observable<UpdateRoleTemplateResponse>;
    deleteRoleTemplate(request: DeleteRoleTemplateRequest, ...rest: any): Observable<DeleteRoleTemplateResponse>;
    setRoleTemplateEnabled(request: SetRoleTemplateEnabledRequest, ...rest: any): Observable<SetRoleTemplateEnabledResponse>;
    listRoleTemplatePermissions(request: ListRoleTemplatePermissionsRequest, ...rest: any): Observable<ListRoleTemplatePermissionsResponse>;
    assignRoleTemplatePermission(request: AssignRoleTemplatePermissionRequest, ...rest: any): Observable<AssignRoleTemplatePermissionResponse>;
    revokeRoleTemplatePermission(request: RevokeRoleTemplatePermissionRequest, ...rest: any): Observable<RevokeRoleTemplatePermissionResponse>;
    createRoleInstanceFromTemplate(request: CreateRoleInstanceFromTemplateRequest, ...rest: any): Observable<CreateRoleInstanceFromTemplateResponse>;
    updateRole(request: UpdateRoleRequest, ...rest: any): Observable<UpdateRoleResponse>;
    setRoleEnabled(request: SetRoleEnabledRequest, ...rest: any): Observable<SetRoleEnabledResponse>;
    deleteRole(request: DeleteRoleRequest, ...rest: any): Observable<DeleteRoleResponse>;
    getRoleById(request: GetRoleByIdRequest, ...rest: any): Observable<GetRoleByIdResponse>;
    listRoleInstances(request: ListRoleInstancesRequest, ...rest: any): Observable<ListRoleInstancesResponse>;
    listRoleTemplates(request: ListRoleTemplatesRequest, ...rest: any): Observable<ListRoleTemplatesResponse>;
    listRolePermissions(request: ListRolePermissionsRequest, ...rest: any): Observable<ListRolePermissionsResponse>;
    assignRolePermission(request: AssignRolePermissionRequest, ...rest: any): Observable<AssignRolePermissionResponse>;
    revokeRolePermission(request: RevokeRolePermissionRequest, ...rest: any): Observable<RevokeRolePermissionResponse>;
    assignAccountRole(request: AssignAccountRoleRequest, ...rest: any): Observable<AssignAccountRoleResponse>;
    grantInitialAccessForEmployeeAccount(request: GrantInitialAccessForEmployeeAccountRequest, ...rest: any): Observable<GrantInitialAccessForEmployeeAccountResponse>;
    revokeAccountRole(request: RevokeAccountRoleRequest, ...rest: any): Observable<RevokeAccountRoleResponse>;
    listAccountRoles(request: ListAccountRolesRequest, ...rest: any): Observable<ListAccountRolesResponse>;
    listRoleAccounts(request: ListRoleAccountsRequest, ...rest: any): Observable<ListRoleAccountsResponse>;
    getAccountRoleSelection(request: GetAccountRoleSelectionRequest, ...rest: any): Observable<GetAccountRoleSelectionResponse>;
    setAccountRoles(request: SetAccountRolesRequest, ...rest: any): Observable<SetAccountRolesResponse>;
    listAuditEvents(request: ListAuditEventsRequest, ...rest: any): Observable<ListAuditEventsResponse>;
    listNavigationEntries(request: ListNavigationEntriesRequest, ...rest: any): Observable<ListNavigationEntriesResponse>;
    getNavigationEntry(request: GetNavigationEntryRequest, ...rest: any): Observable<GetNavigationEntryResponse>;
    createNavigationEntry(request: CreateNavigationEntryRequest, ...rest: any): Observable<CreateNavigationEntryResponse>;
    updateNavigationEntry(request: UpdateNavigationEntryRequest, ...rest: any): Observable<UpdateNavigationEntryResponse>;
    getRoleNavigation(request: GetRoleNavigationRequest, ...rest: any): Observable<GetRoleNavigationResponse>;
    setRoleNavigationVisibility(request: SetRoleNavigationVisibilityRequest, ...rest: any): Observable<SetRoleNavigationVisibilityResponse>;
    setRoleLandingPolicies(request: SetRoleLandingPoliciesRequest, ...rest: any): Observable<SetRoleLandingPoliciesResponse>;
    syncRoleNavigationFromTemplate(request: SyncRoleNavigationFromTemplateRequest, ...rest: any): Observable<SyncRoleNavigationFromTemplateResponse>;
    resolveNavigationPreview(request: ResolveNavigationPreviewRequest, ...rest: any): Observable<ResolveNavigationPreviewResponse>;
}
export interface PermissionManagementServiceController {
    createPermission(request: CreatePermissionRequest, ...rest: any): Promise<CreatePermissionResponse> | Observable<CreatePermissionResponse> | CreatePermissionResponse;
    batchCreatePermissions(request: BatchCreatePermissionsRequest, ...rest: any): Promise<BatchCreatePermissionsResponse> | Observable<BatchCreatePermissionsResponse> | BatchCreatePermissionsResponse;
    updatePermission(request: UpdatePermissionRequest, ...rest: any): Promise<UpdatePermissionResponse> | Observable<UpdatePermissionResponse> | UpdatePermissionResponse;
    deletePermission(request: DeletePermissionRequest, ...rest: any): Promise<DeletePermissionResponse> | Observable<DeletePermissionResponse> | DeletePermissionResponse;
    getPermissionById(request: GetPermissionByIdRequest, ...rest: any): Promise<GetPermissionByIdResponse> | Observable<GetPermissionByIdResponse> | GetPermissionByIdResponse;
    getPermissionByCode(request: GetPermissionByCodeRequest, ...rest: any): Promise<GetPermissionByCodeResponse> | Observable<GetPermissionByCodeResponse> | GetPermissionByCodeResponse;
    listPermissionsPaged(request: ListPermissionsPagedRequest, ...rest: any): Promise<ListPermissionsPagedResponse> | Observable<ListPermissionsPagedResponse> | ListPermissionsPagedResponse;
    listPermissionRoles(request: ListPermissionRolesRequest, ...rest: any): Promise<ListPermissionRolesResponse> | Observable<ListPermissionRolesResponse> | ListPermissionRolesResponse;
    createRoleTemplate(request: CreateRoleTemplateRequest, ...rest: any): Promise<CreateRoleTemplateResponse> | Observable<CreateRoleTemplateResponse> | CreateRoleTemplateResponse;
    createRoleInstance(request: CreateRoleInstanceRequest, ...rest: any): Promise<CreateRoleInstanceResponse> | Observable<CreateRoleInstanceResponse> | CreateRoleInstanceResponse;
    getRoleTemplateById(request: GetRoleTemplateByIdRequest, ...rest: any): Promise<GetRoleTemplateByIdResponse> | Observable<GetRoleTemplateByIdResponse> | GetRoleTemplateByIdResponse;
    updateRoleTemplate(request: UpdateRoleTemplateRequest, ...rest: any): Promise<UpdateRoleTemplateResponse> | Observable<UpdateRoleTemplateResponse> | UpdateRoleTemplateResponse;
    deleteRoleTemplate(request: DeleteRoleTemplateRequest, ...rest: any): Promise<DeleteRoleTemplateResponse> | Observable<DeleteRoleTemplateResponse> | DeleteRoleTemplateResponse;
    setRoleTemplateEnabled(request: SetRoleTemplateEnabledRequest, ...rest: any): Promise<SetRoleTemplateEnabledResponse> | Observable<SetRoleTemplateEnabledResponse> | SetRoleTemplateEnabledResponse;
    listRoleTemplatePermissions(request: ListRoleTemplatePermissionsRequest, ...rest: any): Promise<ListRoleTemplatePermissionsResponse> | Observable<ListRoleTemplatePermissionsResponse> | ListRoleTemplatePermissionsResponse;
    assignRoleTemplatePermission(request: AssignRoleTemplatePermissionRequest, ...rest: any): Promise<AssignRoleTemplatePermissionResponse> | Observable<AssignRoleTemplatePermissionResponse> | AssignRoleTemplatePermissionResponse;
    revokeRoleTemplatePermission(request: RevokeRoleTemplatePermissionRequest, ...rest: any): Promise<RevokeRoleTemplatePermissionResponse> | Observable<RevokeRoleTemplatePermissionResponse> | RevokeRoleTemplatePermissionResponse;
    createRoleInstanceFromTemplate(request: CreateRoleInstanceFromTemplateRequest, ...rest: any): Promise<CreateRoleInstanceFromTemplateResponse> | Observable<CreateRoleInstanceFromTemplateResponse> | CreateRoleInstanceFromTemplateResponse;
    updateRole(request: UpdateRoleRequest, ...rest: any): Promise<UpdateRoleResponse> | Observable<UpdateRoleResponse> | UpdateRoleResponse;
    setRoleEnabled(request: SetRoleEnabledRequest, ...rest: any): Promise<SetRoleEnabledResponse> | Observable<SetRoleEnabledResponse> | SetRoleEnabledResponse;
    deleteRole(request: DeleteRoleRequest, ...rest: any): Promise<DeleteRoleResponse> | Observable<DeleteRoleResponse> | DeleteRoleResponse;
    getRoleById(request: GetRoleByIdRequest, ...rest: any): Promise<GetRoleByIdResponse> | Observable<GetRoleByIdResponse> | GetRoleByIdResponse;
    listRoleInstances(request: ListRoleInstancesRequest, ...rest: any): Promise<ListRoleInstancesResponse> | Observable<ListRoleInstancesResponse> | ListRoleInstancesResponse;
    listRoleTemplates(request: ListRoleTemplatesRequest, ...rest: any): Promise<ListRoleTemplatesResponse> | Observable<ListRoleTemplatesResponse> | ListRoleTemplatesResponse;
    listRolePermissions(request: ListRolePermissionsRequest, ...rest: any): Promise<ListRolePermissionsResponse> | Observable<ListRolePermissionsResponse> | ListRolePermissionsResponse;
    assignRolePermission(request: AssignRolePermissionRequest, ...rest: any): Promise<AssignRolePermissionResponse> | Observable<AssignRolePermissionResponse> | AssignRolePermissionResponse;
    revokeRolePermission(request: RevokeRolePermissionRequest, ...rest: any): Promise<RevokeRolePermissionResponse> | Observable<RevokeRolePermissionResponse> | RevokeRolePermissionResponse;
    assignAccountRole(request: AssignAccountRoleRequest, ...rest: any): Promise<AssignAccountRoleResponse> | Observable<AssignAccountRoleResponse> | AssignAccountRoleResponse;
    grantInitialAccessForEmployeeAccount(request: GrantInitialAccessForEmployeeAccountRequest, ...rest: any): Promise<GrantInitialAccessForEmployeeAccountResponse> | Observable<GrantInitialAccessForEmployeeAccountResponse> | GrantInitialAccessForEmployeeAccountResponse;
    revokeAccountRole(request: RevokeAccountRoleRequest, ...rest: any): Promise<RevokeAccountRoleResponse> | Observable<RevokeAccountRoleResponse> | RevokeAccountRoleResponse;
    listAccountRoles(request: ListAccountRolesRequest, ...rest: any): Promise<ListAccountRolesResponse> | Observable<ListAccountRolesResponse> | ListAccountRolesResponse;
    listRoleAccounts(request: ListRoleAccountsRequest, ...rest: any): Promise<ListRoleAccountsResponse> | Observable<ListRoleAccountsResponse> | ListRoleAccountsResponse;
    getAccountRoleSelection(request: GetAccountRoleSelectionRequest, ...rest: any): Promise<GetAccountRoleSelectionResponse> | Observable<GetAccountRoleSelectionResponse> | GetAccountRoleSelectionResponse;
    setAccountRoles(request: SetAccountRolesRequest, ...rest: any): Promise<SetAccountRolesResponse> | Observable<SetAccountRolesResponse> | SetAccountRolesResponse;
    listAuditEvents(request: ListAuditEventsRequest, ...rest: any): Promise<ListAuditEventsResponse> | Observable<ListAuditEventsResponse> | ListAuditEventsResponse;
    listNavigationEntries(request: ListNavigationEntriesRequest, ...rest: any): Promise<ListNavigationEntriesResponse> | Observable<ListNavigationEntriesResponse> | ListNavigationEntriesResponse;
    getNavigationEntry(request: GetNavigationEntryRequest, ...rest: any): Promise<GetNavigationEntryResponse> | Observable<GetNavigationEntryResponse> | GetNavigationEntryResponse;
    createNavigationEntry(request: CreateNavigationEntryRequest, ...rest: any): Promise<CreateNavigationEntryResponse> | Observable<CreateNavigationEntryResponse> | CreateNavigationEntryResponse;
    updateNavigationEntry(request: UpdateNavigationEntryRequest, ...rest: any): Promise<UpdateNavigationEntryResponse> | Observable<UpdateNavigationEntryResponse> | UpdateNavigationEntryResponse;
    getRoleNavigation(request: GetRoleNavigationRequest, ...rest: any): Promise<GetRoleNavigationResponse> | Observable<GetRoleNavigationResponse> | GetRoleNavigationResponse;
    setRoleNavigationVisibility(request: SetRoleNavigationVisibilityRequest, ...rest: any): Promise<SetRoleNavigationVisibilityResponse> | Observable<SetRoleNavigationVisibilityResponse> | SetRoleNavigationVisibilityResponse;
    setRoleLandingPolicies(request: SetRoleLandingPoliciesRequest, ...rest: any): Promise<SetRoleLandingPoliciesResponse> | Observable<SetRoleLandingPoliciesResponse> | SetRoleLandingPoliciesResponse;
    syncRoleNavigationFromTemplate(request: SyncRoleNavigationFromTemplateRequest, ...rest: any): Promise<SyncRoleNavigationFromTemplateResponse> | Observable<SyncRoleNavigationFromTemplateResponse> | SyncRoleNavigationFromTemplateResponse;
    resolveNavigationPreview(request: ResolveNavigationPreviewRequest, ...rest: any): Promise<ResolveNavigationPreviewResponse> | Observable<ResolveNavigationPreviewResponse> | ResolveNavigationPreviewResponse;
}
export declare function PermissionManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const PERMISSION_MANAGEMENT_SERVICE_NAME = "PermissionManagementService";
