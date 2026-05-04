import { Observable } from "rxjs";
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
    cursor?: string | undefined;
    pageSize?: number | undefined;
}
export interface AuditEventRecord {
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
    items?: AuditEventRecord[] | undefined;
    nextCursor?: string | undefined;
}
export interface GetUserByIdRequest {
    userId?: string | undefined;
}
export interface GetUserByIdResponse {
    user?: UserSummary | undefined;
}
export interface GetUserByEmailRequest {
    email?: string | undefined;
}
export interface UserSummary {
    id?: string | undefined;
    username?: string | undefined;
    personalEmail?: string | undefined;
    personalPhone?: string | undefined;
    isActive?: boolean | undefined;
    partyId?: string | undefined;
}
export interface GetUserByEmailResponse {
    user?: UserSummary | undefined;
}
export interface GetUserByPhoneRequest {
    phone?: string | undefined;
}
export interface GetUserByPhoneResponse {
    user?: UserSummary | undefined;
}
export interface ListAccountsRequest {
    keyword?: string | undefined;
    scopeLevel?: string | undefined;
    status?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface AccountDirectoryItem {
    accountId?: string | undefined;
    userId?: string | undefined;
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
    displayName?: string | undefined;
    isEnabled?: boolean | undefined;
    userDisplayName?: string | undefined;
    userPartyId?: string | undefined;
}
export interface ListAccountsResponse {
    accounts?: AccountDirectoryItem[] | undefined;
    total?: number | undefined;
}
export interface CreateUserAccountRequest {
    scopeLevel?: string | undefined;
    tenantId?: string | undefined;
    displayName?: string | undefined;
    username?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}
export interface BindAccountToEmployeeRequest {
    tenantId?: string | undefined;
    accountId?: string | undefined;
    employeeId?: string | undefined;
}
export interface UnbindAccountFromEmployeeRequest {
    accountId?: string | undefined;
}
export interface GetAccountDeletionImpactRequest {
    accountId?: string | undefined;
}
export interface AccountDeletionCleanupPlan {
    willDeleteSessions?: boolean | undefined;
    willClearRoles?: boolean | undefined;
    willDeleteOrgMemberships?: boolean | undefined;
    willDeleteContactAssets?: boolean | undefined;
}
export interface AccountDeletionBlockingReason {
    resourceType?: string | undefined;
    resourceCount?: number | undefined;
    message?: string | undefined;
}
export interface GetAccountDeletionImpactResponse {
    accountId?: string | undefined;
    canDelete?: boolean | undefined;
    userRetained?: boolean | undefined;
    cleanupPlan?: AccountDeletionCleanupPlan | undefined;
    blockingReasons?: AccountDeletionBlockingReason[] | undefined;
    orgMembershipCount?: number | undefined;
    contactAssetCount?: number | undefined;
}
export interface DeleteAccountRequest {
    accountId?: string | undefined;
    deletedSessionCount?: number | undefined;
    clearedRoleCount?: number | undefined;
    deletedPolicyCount?: number | undefined;
}
export interface DeleteAccountResponse {
    accountId?: string | undefined;
    deletedOrgMembershipCount?: number | undefined;
    deletedContactAssetCount?: number | undefined;
    userRetained?: boolean | undefined;
}
export interface UpdateUserBasicInfoRequest {
    accountId?: string | undefined;
    userId?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}
export interface UpdateOwnUserBasicInfoRequest {
    accountId?: string | undefined;
    userId?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}
export interface GetOrgTreeByTenantIdRequest {
    tenantId?: string | undefined;
}
export interface OrgNode {
    id?: string | undefined;
    tenantId?: string | undefined;
    parentId?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    type?: string | undefined;
    sortOrder?: number | undefined;
    children?: OrgNode[] | undefined;
}
export interface GetOrgTreeByTenantIdResponse {
    roots?: OrgNode[] | undefined;
}
export interface AccountOrgMembership {
    id?: string | undefined;
    accountId?: string | undefined;
    orgId?: string | undefined;
    orgName?: string | undefined;
    orgType?: string | undefined;
    relationType?: string | undefined;
    isPrimary?: boolean | undefined;
}
export interface AccountOrgMembershipResponse {
    membership?: AccountOrgMembership | undefined;
}
export interface AddAccountOrgMembershipResponse {
    membership?: AccountOrgMembership | undefined;
}
export interface RemoveAccountOrgMembershipResponse {
    membership?: AccountOrgMembership | undefined;
}
export interface AccountContactAsset {
    id?: string | undefined;
    tenantId?: string | undefined;
    accountId?: string | undefined;
    type?: string | undefined;
    value?: string | undefined;
    status?: string | undefined;
    isPrimary?: boolean | undefined;
    assignedAt?: string | undefined;
    revokedAt?: string | undefined;
}
export interface AccountContactAssetResponse {
    asset?: AccountContactAsset | undefined;
}
export interface AssignAccountWorkEmailAssetResponse {
    asset?: AccountContactAsset | undefined;
}
export interface AssignAccountWorkPhoneAssetResponse {
    asset?: AccountContactAsset | undefined;
}
export interface RevokeAccountWorkEmailAssetResponse {
    asset?: AccountContactAsset | undefined;
}
export interface RevokeAccountWorkPhoneAssetResponse {
    asset?: AccountContactAsset | undefined;
}
export interface SetAccountWorkEmailAssetStatusResponse {
    asset?: AccountContactAsset | undefined;
}
export interface SetAccountWorkPhoneAssetStatusResponse {
    asset?: AccountContactAsset | undefined;
}
export interface SetAccountPrimaryWorkEmailAssetResponse {
    asset?: AccountContactAsset | undefined;
}
export interface SetAccountPrimaryWorkPhoneAssetResponse {
    asset?: AccountContactAsset | undefined;
}
export interface ListAccountWorkEmailAssetsRequest {
    accountId?: string | undefined;
}
export interface ListAccountWorkEmailAssetsResponse {
    assets?: AccountContactAsset[] | undefined;
}
export interface ListAccountWorkPhoneAssetsRequest {
    accountId?: string | undefined;
}
export interface ListAccountWorkPhoneAssetsResponse {
    assets?: AccountContactAsset[] | undefined;
}
export interface AssignAccountWorkEmailAssetRequest {
    accountId?: string | undefined;
    email?: string | undefined;
    isPrimary?: boolean | undefined;
}
export interface AssignAccountWorkPhoneAssetRequest {
    accountId?: string | undefined;
    phone?: string | undefined;
    isPrimary?: boolean | undefined;
}
export interface RevokeAccountWorkEmailAssetRequest {
    assetId?: string | undefined;
}
export interface RevokeAccountWorkPhoneAssetRequest {
    assetId?: string | undefined;
}
export interface SetAccountWorkEmailAssetStatusRequest {
    assetId?: string | undefined;
    enabled?: boolean | undefined;
}
export interface SetAccountWorkPhoneAssetStatusRequest {
    assetId?: string | undefined;
    enabled?: boolean | undefined;
}
export interface SetAccountPrimaryWorkEmailAssetRequest {
    assetId?: string | undefined;
}
export interface SetAccountPrimaryWorkPhoneAssetRequest {
    assetId?: string | undefined;
}
export interface AddAccountOrgMembershipRequest {
    accountId?: string | undefined;
    orgId?: string | undefined;
}
export interface RemoveAccountOrgMembershipRequest {
    accountId?: string | undefined;
    orgId?: string | undefined;
}
export interface SetAccountPrimaryOrgRequest {
    accountId?: string | undefined;
    orgId?: string | undefined;
}
export interface SetAccountPrimaryOrgResponse {
    membership?: AccountOrgMembership | undefined;
}
export interface UpdateAccountProfileRequest {
    accountId?: string | undefined;
    avatarUrl?: string | undefined;
    displayName?: string | undefined;
    bio?: string | undefined;
    isEnabled?: boolean | undefined;
    avatarAssetId?: string | undefined;
}
export interface UpdateOwnAccountProfileRequest {
    accountId?: string | undefined;
    avatarUrl?: string | undefined;
    displayName?: string | undefined;
    bio?: string | undefined;
    isEnabled?: boolean | undefined;
    avatarAssetId?: string | undefined;
}
export interface ListAccountOrgMembershipsRequest {
    accountId?: string | undefined;
}
export interface ListAccountOrgMembershipsResponse {
    memberships?: AccountOrgMembership[] | undefined;
}
export interface GetAccountsByUserIdRequest {
    userId?: string | undefined;
}
export interface AccountCandidate {
    accountId?: string | undefined;
    tenantId?: string | undefined;
    displayName?: string | undefined;
    scopeLevel?: string | undefined;
}
export interface GetAccountsByUserIdResponse {
    accounts?: AccountCandidate[] | undefined;
}
export interface GetAccountByIdRequest {
    accountId?: string | undefined;
}
export interface AccountSummary {
    id?: string | undefined;
    userId?: string | undefined;
    tenantId?: string | undefined;
    avatarUrl?: string | undefined;
    displayName?: string | undefined;
    bio?: string | undefined;
    isEnabled?: boolean | undefined;
    scopeLevel?: string | undefined;
    avatarAssetId?: string | undefined;
}
export interface GetAccountByIdResponse {
    account?: AccountSummary | undefined;
}
export interface CreateUserAccountResponse {
    account?: AccountSummary | undefined;
}
export interface UpdateOwnAccountProfileResponse {
    account?: AccountSummary | undefined;
}
export interface UpdateAccountProfileResponse {
    account?: AccountSummary | undefined;
}
export interface EmployeeBinding {
    id?: string | undefined;
    tenantId?: string | undefined;
    accountId?: string | undefined;
    employeeId?: string | undefined;
}
export interface GetEmployeeBindingByAccountIdRequest {
    accountId?: string | undefined;
}
export interface GetEmployeeBindingByAccountIdResponse {
    binding?: EmployeeBinding | undefined;
}
export interface BindAccountToEmployeeResponse {
    binding?: EmployeeBinding | undefined;
}
export interface UnbindAccountFromEmployeeResponse {
    binding?: EmployeeBinding | undefined;
}
export interface ApiKey {
    id?: string | undefined;
    serviceAccountId?: string | undefined;
    keyCode?: string | undefined;
    status?: string | undefined;
    expiresAt?: string | undefined;
    lastUsedAt?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    createdBy?: string | undefined;
    revokedAt?: string | undefined;
    revokedBy?: string | undefined;
}
export interface ApiKeyResponse {
    apiKey?: ApiKey | undefined;
}
export interface RevokeApiKeyResponse {
    apiKey?: ApiKey | undefined;
}
export interface ApiKeyWithSecret {
    apiKey?: ApiKey | undefined;
    secret?: string | undefined;
}
export interface CreateApiKeyRequest {
    serviceAccountId?: string | undefined;
    expiresAt?: string | undefined;
}
export interface CreateApiKeyResponse {
    apiKey?: ApiKeyWithSecret | undefined;
}
export interface RevokeApiKeyRequest {
    apiKeyId?: string | undefined;
}
export interface RotateApiKeyRequest {
    apiKeyId?: string | undefined;
    expiresAt?: string | undefined;
}
export interface RotateApiKeyResponse {
    apiKey?: ApiKeyWithSecret | undefined;
}
export interface AuthenticateApiKeyRequest {
    secret?: string | undefined;
}
export interface MachinePrincipalAuthentication {
    apiKey?: ApiKey | undefined;
    account?: ServiceAccount | undefined;
}
export interface AuthenticateApiKeyResponse {
    principal?: MachinePrincipalAuthentication | undefined;
}
export interface GetApiKeyByIdRequest {
    apiKeyId?: string | undefined;
}
export interface GetApiKeyByIdResponse {
    apiKey?: ApiKey | undefined;
}
export interface ListApiKeysByServiceAccountIdRequest {
    serviceAccountId?: string | undefined;
}
export interface ListApiKeysByServiceAccountIdResponse {
    apiKeys?: ApiKey[] | undefined;
}
export interface ServiceAccount {
    id?: string | undefined;
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
    type?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    createdBy?: string | undefined;
    disabledAt?: string | undefined;
    disabledBy?: string | undefined;
}
export interface ServiceAccountResponse {
    account?: ServiceAccount | undefined;
}
export interface CreateServiceAccountResponse {
    account?: ServiceAccount | undefined;
}
export interface SetServiceAccountEnabledResponse {
    account?: ServiceAccount | undefined;
}
export interface GetServiceAccountByIdRequest {
    serviceAccountId?: string | undefined;
}
export interface GetServiceAccountByIdResponse {
    account?: ServiceAccount | undefined;
}
export interface UpdateUserBasicInfoResponse {
    user?: UserSummary | undefined;
}
export interface UpdateOwnUserBasicInfoResponse {
    user?: UserSummary | undefined;
}
export interface ListServiceAccountsRequest {
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
    type?: string | undefined;
    status?: string | undefined;
}
export interface ListServiceAccountsResponse {
    accounts?: ServiceAccount[] | undefined;
}
export interface CreateServiceAccountRequest {
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
    type?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
}
export interface SetServiceAccountEnabledRequest {
    serviceAccountId?: string | undefined;
    enabled?: boolean | undefined;
}
export interface IdentityQueryServiceClient {
    getAccountById(request: GetAccountByIdRequest, ...rest: any): Observable<GetAccountByIdResponse>;
    getEmployeeBindingByAccountId(request: GetEmployeeBindingByAccountIdRequest, ...rest: any): Observable<GetEmployeeBindingByAccountIdResponse>;
    listAuditEvents(request: ListAuditEventsRequest, ...rest: any): Observable<ListAuditEventsResponse>;
    getApiKeyById(request: GetApiKeyByIdRequest, ...rest: any): Observable<GetApiKeyByIdResponse>;
    getServiceAccountById(request: GetServiceAccountByIdRequest, ...rest: any): Observable<GetServiceAccountByIdResponse>;
    listApiKeysByServiceAccountId(request: ListApiKeysByServiceAccountIdRequest, ...rest: any): Observable<ListApiKeysByServiceAccountIdResponse>;
    listServiceAccounts(request: ListServiceAccountsRequest, ...rest: any): Observable<ListServiceAccountsResponse>;
    listAccountWorkEmailAssets(request: ListAccountWorkEmailAssetsRequest, ...rest: any): Observable<ListAccountWorkEmailAssetsResponse>;
    listAccountWorkPhoneAssets(request: ListAccountWorkPhoneAssetsRequest, ...rest: any): Observable<ListAccountWorkPhoneAssetsResponse>;
    listAccountOrgMemberships(request: ListAccountOrgMembershipsRequest, ...rest: any): Observable<ListAccountOrgMembershipsResponse>;
    /** Deprecated: org tree truth has moved to tenant-org-service. No new callers should be added here. */
    getOrgTreeByTenantId(request: GetOrgTreeByTenantIdRequest, ...rest: any): Observable<GetOrgTreeByTenantIdResponse>;
    listAccounts(request: ListAccountsRequest, ...rest: any): Observable<ListAccountsResponse>;
    getUserById(request: GetUserByIdRequest, ...rest: any): Observable<GetUserByIdResponse>;
    getUserByEmail(request: GetUserByEmailRequest, ...rest: any): Observable<GetUserByEmailResponse>;
    getUserByPhone(request: GetUserByPhoneRequest, ...rest: any): Observable<GetUserByPhoneResponse>;
    getAccountsByUserId(request: GetAccountsByUserIdRequest, ...rest: any): Observable<GetAccountsByUserIdResponse>;
}
export interface IdentityQueryServiceController {
    getAccountById(request: GetAccountByIdRequest, ...rest: any): Promise<GetAccountByIdResponse> | Observable<GetAccountByIdResponse> | GetAccountByIdResponse;
    getEmployeeBindingByAccountId(request: GetEmployeeBindingByAccountIdRequest, ...rest: any): Promise<GetEmployeeBindingByAccountIdResponse> | Observable<GetEmployeeBindingByAccountIdResponse> | GetEmployeeBindingByAccountIdResponse;
    listAuditEvents(request: ListAuditEventsRequest, ...rest: any): Promise<ListAuditEventsResponse> | Observable<ListAuditEventsResponse> | ListAuditEventsResponse;
    getApiKeyById(request: GetApiKeyByIdRequest, ...rest: any): Promise<GetApiKeyByIdResponse> | Observable<GetApiKeyByIdResponse> | GetApiKeyByIdResponse;
    getServiceAccountById(request: GetServiceAccountByIdRequest, ...rest: any): Promise<GetServiceAccountByIdResponse> | Observable<GetServiceAccountByIdResponse> | GetServiceAccountByIdResponse;
    listApiKeysByServiceAccountId(request: ListApiKeysByServiceAccountIdRequest, ...rest: any): Promise<ListApiKeysByServiceAccountIdResponse> | Observable<ListApiKeysByServiceAccountIdResponse> | ListApiKeysByServiceAccountIdResponse;
    listServiceAccounts(request: ListServiceAccountsRequest, ...rest: any): Promise<ListServiceAccountsResponse> | Observable<ListServiceAccountsResponse> | ListServiceAccountsResponse;
    listAccountWorkEmailAssets(request: ListAccountWorkEmailAssetsRequest, ...rest: any): Promise<ListAccountWorkEmailAssetsResponse> | Observable<ListAccountWorkEmailAssetsResponse> | ListAccountWorkEmailAssetsResponse;
    listAccountWorkPhoneAssets(request: ListAccountWorkPhoneAssetsRequest, ...rest: any): Promise<ListAccountWorkPhoneAssetsResponse> | Observable<ListAccountWorkPhoneAssetsResponse> | ListAccountWorkPhoneAssetsResponse;
    listAccountOrgMemberships(request: ListAccountOrgMembershipsRequest, ...rest: any): Promise<ListAccountOrgMembershipsResponse> | Observable<ListAccountOrgMembershipsResponse> | ListAccountOrgMembershipsResponse;
    /** Deprecated: org tree truth has moved to tenant-org-service. No new callers should be added here. */
    getOrgTreeByTenantId(request: GetOrgTreeByTenantIdRequest, ...rest: any): Promise<GetOrgTreeByTenantIdResponse> | Observable<GetOrgTreeByTenantIdResponse> | GetOrgTreeByTenantIdResponse;
    listAccounts(request: ListAccountsRequest, ...rest: any): Promise<ListAccountsResponse> | Observable<ListAccountsResponse> | ListAccountsResponse;
    getUserById(request: GetUserByIdRequest, ...rest: any): Promise<GetUserByIdResponse> | Observable<GetUserByIdResponse> | GetUserByIdResponse;
    getUserByEmail(request: GetUserByEmailRequest, ...rest: any): Promise<GetUserByEmailResponse> | Observable<GetUserByEmailResponse> | GetUserByEmailResponse;
    getUserByPhone(request: GetUserByPhoneRequest, ...rest: any): Promise<GetUserByPhoneResponse> | Observable<GetUserByPhoneResponse> | GetUserByPhoneResponse;
    getAccountsByUserId(request: GetAccountsByUserIdRequest, ...rest: any): Promise<GetAccountsByUserIdResponse> | Observable<GetAccountsByUserIdResponse> | GetAccountsByUserIdResponse;
}
export declare function IdentityQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const IDENTITY_QUERY_SERVICE_NAME = "IdentityQueryService";
export interface IdentityManagementServiceClient {
    rotateApiKey(request: RotateApiKeyRequest, ...rest: any): Observable<RotateApiKeyResponse>;
    createApiKey(request: CreateApiKeyRequest, ...rest: any): Observable<CreateApiKeyResponse>;
    createServiceAccount(request: CreateServiceAccountRequest, ...rest: any): Observable<CreateServiceAccountResponse>;
    createUserAccount(request: CreateUserAccountRequest, ...rest: any): Observable<CreateUserAccountResponse>;
    getAccountDeletionImpact(request: GetAccountDeletionImpactRequest, ...rest: any): Observable<GetAccountDeletionImpactResponse>;
    deleteAccount(request: DeleteAccountRequest, ...rest: any): Observable<DeleteAccountResponse>;
    revokeApiKey(request: RevokeApiKeyRequest, ...rest: any): Observable<RevokeApiKeyResponse>;
    setServiceAccountEnabled(request: SetServiceAccountEnabledRequest, ...rest: any): Observable<SetServiceAccountEnabledResponse>;
    updateOwnAccountProfile(request: UpdateOwnAccountProfileRequest, ...rest: any): Observable<UpdateOwnAccountProfileResponse>;
    updateOwnUserBasicInfo(request: UpdateOwnUserBasicInfoRequest, ...rest: any): Observable<UpdateOwnUserBasicInfoResponse>;
    updateAccountProfile(request: UpdateAccountProfileRequest, ...rest: any): Observable<UpdateAccountProfileResponse>;
    updateUserBasicInfo(request: UpdateUserBasicInfoRequest, ...rest: any): Observable<UpdateUserBasicInfoResponse>;
    assignAccountWorkEmailAsset(request: AssignAccountWorkEmailAssetRequest, ...rest: any): Observable<AssignAccountWorkEmailAssetResponse>;
    assignAccountWorkPhoneAsset(request: AssignAccountWorkPhoneAssetRequest, ...rest: any): Observable<AssignAccountWorkPhoneAssetResponse>;
    revokeAccountWorkEmailAsset(request: RevokeAccountWorkEmailAssetRequest, ...rest: any): Observable<RevokeAccountWorkEmailAssetResponse>;
    revokeAccountWorkPhoneAsset(request: RevokeAccountWorkPhoneAssetRequest, ...rest: any): Observable<RevokeAccountWorkPhoneAssetResponse>;
    setAccountWorkEmailAssetStatus(request: SetAccountWorkEmailAssetStatusRequest, ...rest: any): Observable<SetAccountWorkEmailAssetStatusResponse>;
    setAccountWorkPhoneAssetStatus(request: SetAccountWorkPhoneAssetStatusRequest, ...rest: any): Observable<SetAccountWorkPhoneAssetStatusResponse>;
    setAccountPrimaryWorkEmailAsset(request: SetAccountPrimaryWorkEmailAssetRequest, ...rest: any): Observable<SetAccountPrimaryWorkEmailAssetResponse>;
    setAccountPrimaryWorkPhoneAsset(request: SetAccountPrimaryWorkPhoneAssetRequest, ...rest: any): Observable<SetAccountPrimaryWorkPhoneAssetResponse>;
    bindAccountToEmployee(request: BindAccountToEmployeeRequest, ...rest: any): Observable<BindAccountToEmployeeResponse>;
    unbindAccountFromEmployee(request: UnbindAccountFromEmployeeRequest, ...rest: any): Observable<UnbindAccountFromEmployeeResponse>;
    addAccountOrgMembership(request: AddAccountOrgMembershipRequest, ...rest: any): Observable<AddAccountOrgMembershipResponse>;
    removeAccountOrgMembership(request: RemoveAccountOrgMembershipRequest, ...rest: any): Observable<RemoveAccountOrgMembershipResponse>;
    setAccountPrimaryOrg(request: SetAccountPrimaryOrgRequest, ...rest: any): Observable<SetAccountPrimaryOrgResponse>;
}
export interface IdentityManagementServiceController {
    rotateApiKey(request: RotateApiKeyRequest, ...rest: any): Promise<RotateApiKeyResponse> | Observable<RotateApiKeyResponse> | RotateApiKeyResponse;
    createApiKey(request: CreateApiKeyRequest, ...rest: any): Promise<CreateApiKeyResponse> | Observable<CreateApiKeyResponse> | CreateApiKeyResponse;
    createServiceAccount(request: CreateServiceAccountRequest, ...rest: any): Promise<CreateServiceAccountResponse> | Observable<CreateServiceAccountResponse> | CreateServiceAccountResponse;
    createUserAccount(request: CreateUserAccountRequest, ...rest: any): Promise<CreateUserAccountResponse> | Observable<CreateUserAccountResponse> | CreateUserAccountResponse;
    getAccountDeletionImpact(request: GetAccountDeletionImpactRequest, ...rest: any): Promise<GetAccountDeletionImpactResponse> | Observable<GetAccountDeletionImpactResponse> | GetAccountDeletionImpactResponse;
    deleteAccount(request: DeleteAccountRequest, ...rest: any): Promise<DeleteAccountResponse> | Observable<DeleteAccountResponse> | DeleteAccountResponse;
    revokeApiKey(request: RevokeApiKeyRequest, ...rest: any): Promise<RevokeApiKeyResponse> | Observable<RevokeApiKeyResponse> | RevokeApiKeyResponse;
    setServiceAccountEnabled(request: SetServiceAccountEnabledRequest, ...rest: any): Promise<SetServiceAccountEnabledResponse> | Observable<SetServiceAccountEnabledResponse> | SetServiceAccountEnabledResponse;
    updateOwnAccountProfile(request: UpdateOwnAccountProfileRequest, ...rest: any): Promise<UpdateOwnAccountProfileResponse> | Observable<UpdateOwnAccountProfileResponse> | UpdateOwnAccountProfileResponse;
    updateOwnUserBasicInfo(request: UpdateOwnUserBasicInfoRequest, ...rest: any): Promise<UpdateOwnUserBasicInfoResponse> | Observable<UpdateOwnUserBasicInfoResponse> | UpdateOwnUserBasicInfoResponse;
    updateAccountProfile(request: UpdateAccountProfileRequest, ...rest: any): Promise<UpdateAccountProfileResponse> | Observable<UpdateAccountProfileResponse> | UpdateAccountProfileResponse;
    updateUserBasicInfo(request: UpdateUserBasicInfoRequest, ...rest: any): Promise<UpdateUserBasicInfoResponse> | Observable<UpdateUserBasicInfoResponse> | UpdateUserBasicInfoResponse;
    assignAccountWorkEmailAsset(request: AssignAccountWorkEmailAssetRequest, ...rest: any): Promise<AssignAccountWorkEmailAssetResponse> | Observable<AssignAccountWorkEmailAssetResponse> | AssignAccountWorkEmailAssetResponse;
    assignAccountWorkPhoneAsset(request: AssignAccountWorkPhoneAssetRequest, ...rest: any): Promise<AssignAccountWorkPhoneAssetResponse> | Observable<AssignAccountWorkPhoneAssetResponse> | AssignAccountWorkPhoneAssetResponse;
    revokeAccountWorkEmailAsset(request: RevokeAccountWorkEmailAssetRequest, ...rest: any): Promise<RevokeAccountWorkEmailAssetResponse> | Observable<RevokeAccountWorkEmailAssetResponse> | RevokeAccountWorkEmailAssetResponse;
    revokeAccountWorkPhoneAsset(request: RevokeAccountWorkPhoneAssetRequest, ...rest: any): Promise<RevokeAccountWorkPhoneAssetResponse> | Observable<RevokeAccountWorkPhoneAssetResponse> | RevokeAccountWorkPhoneAssetResponse;
    setAccountWorkEmailAssetStatus(request: SetAccountWorkEmailAssetStatusRequest, ...rest: any): Promise<SetAccountWorkEmailAssetStatusResponse> | Observable<SetAccountWorkEmailAssetStatusResponse> | SetAccountWorkEmailAssetStatusResponse;
    setAccountWorkPhoneAssetStatus(request: SetAccountWorkPhoneAssetStatusRequest, ...rest: any): Promise<SetAccountWorkPhoneAssetStatusResponse> | Observable<SetAccountWorkPhoneAssetStatusResponse> | SetAccountWorkPhoneAssetStatusResponse;
    setAccountPrimaryWorkEmailAsset(request: SetAccountPrimaryWorkEmailAssetRequest, ...rest: any): Promise<SetAccountPrimaryWorkEmailAssetResponse> | Observable<SetAccountPrimaryWorkEmailAssetResponse> | SetAccountPrimaryWorkEmailAssetResponse;
    setAccountPrimaryWorkPhoneAsset(request: SetAccountPrimaryWorkPhoneAssetRequest, ...rest: any): Promise<SetAccountPrimaryWorkPhoneAssetResponse> | Observable<SetAccountPrimaryWorkPhoneAssetResponse> | SetAccountPrimaryWorkPhoneAssetResponse;
    bindAccountToEmployee(request: BindAccountToEmployeeRequest, ...rest: any): Promise<BindAccountToEmployeeResponse> | Observable<BindAccountToEmployeeResponse> | BindAccountToEmployeeResponse;
    unbindAccountFromEmployee(request: UnbindAccountFromEmployeeRequest, ...rest: any): Promise<UnbindAccountFromEmployeeResponse> | Observable<UnbindAccountFromEmployeeResponse> | UnbindAccountFromEmployeeResponse;
    addAccountOrgMembership(request: AddAccountOrgMembershipRequest, ...rest: any): Promise<AddAccountOrgMembershipResponse> | Observable<AddAccountOrgMembershipResponse> | AddAccountOrgMembershipResponse;
    removeAccountOrgMembership(request: RemoveAccountOrgMembershipRequest, ...rest: any): Promise<RemoveAccountOrgMembershipResponse> | Observable<RemoveAccountOrgMembershipResponse> | RemoveAccountOrgMembershipResponse;
    setAccountPrimaryOrg(request: SetAccountPrimaryOrgRequest, ...rest: any): Promise<SetAccountPrimaryOrgResponse> | Observable<SetAccountPrimaryOrgResponse> | SetAccountPrimaryOrgResponse;
}
export declare function IdentityManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const IDENTITY_MANAGEMENT_SERVICE_NAME = "IdentityManagementService";
export interface IdentityMachineAuthServiceClient {
    authenticateApiKey(request: AuthenticateApiKeyRequest, ...rest: any): Observable<AuthenticateApiKeyResponse>;
}
export interface IdentityMachineAuthServiceController {
    authenticateApiKey(request: AuthenticateApiKeyRequest, ...rest: any): Promise<AuthenticateApiKeyResponse> | Observable<AuthenticateApiKeyResponse> | AuthenticateApiKeyResponse;
}
export declare function IdentityMachineAuthServiceControllerMethods(): (constructor: Function) => void;
export declare const IDENTITY_MACHINE_AUTH_SERVICE_NAME = "IdentityMachineAuthService";
