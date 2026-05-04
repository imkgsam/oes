import { Observable } from "rxjs";
export declare enum PolicyEffectProto {
    POLICY_EFFECT_PROTO_UNSPECIFIED = 0,
    POLICY_EFFECT_PROTO_ALLOW = 1,
    POLICY_EFFECT_PROTO_DENY = 2
}
export declare enum PolicySubjectTypeProto {
    POLICY_SUBJECT_TYPE_PROTO_UNSPECIFIED = 0,
    POLICY_SUBJECT_TYPE_PROTO_ROLE = 1,
    POLICY_SUBJECT_TYPE_PROTO_ACCOUNT = 2,
    POLICY_SUBJECT_TYPE_PROTO_ANY = 3
}
export interface CreatePolicyRequest {
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    createdBy?: string | undefined;
    conditionAstJson?: string | undefined;
}
export interface UpdatePolicyRequest {
    id?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    conditionAstJson?: string | undefined;
}
export interface DeletePolicyRequest {
    id?: string | undefined;
}
export interface TogglePolicyRequest {
    id?: string | undefined;
    isEnabled?: boolean | undefined;
}
export interface GetPolicyByIdRequest {
    id?: string | undefined;
}
export interface ListPoliciesPagedRequest {
    page?: number | undefined;
    pageSize?: number | undefined;
    tenantId?: string | undefined;
    permissionCode?: string | undefined;
    isEnabled?: boolean | undefined;
    keyword?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
}
export interface ListPoliciesByPermissionRequest {
    permissionCode?: string | undefined;
    tenantId?: string | undefined;
}
export interface AddPermissionPolicyRequest {
    permissionCode?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    conditionAstJson?: string | undefined;
}
export interface RemovePermissionPolicyRequest {
    permissionCode?: string | undefined;
    policyId?: string | undefined;
}
export interface CreatePolicyResponse {
    id?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    isEnabled?: boolean | undefined;
    conditionAstJson?: string | undefined;
}
export interface UpdatePolicyResponse {
    id?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    isEnabled?: boolean | undefined;
    conditionAstJson?: string | undefined;
}
export interface DeletePolicyResponse {
}
export interface TogglePolicyResponse {
    id?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    isEnabled?: boolean | undefined;
    conditionAstJson?: string | undefined;
}
export interface GetPolicyByIdResponse {
    id?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    isEnabled?: boolean | undefined;
    conditionAstJson?: string | undefined;
}
export interface PolicyResponse {
    id?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    isEnabled?: boolean | undefined;
    conditionAstJson?: string | undefined;
}
export interface ListPoliciesResponse {
    policies?: PolicyResponse[] | undefined;
}
export interface ListPoliciesByPermissionResponse {
    policies?: PolicyResponse[] | undefined;
}
export interface PagedPoliciesResponse {
    policies?: PolicyResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListPoliciesPagedResponse {
    policies?: PolicyResponse[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface AddPermissionPolicyResponse {
    id?: string | undefined;
    name?: string | undefined;
    effect?: PolicyEffectProto | undefined;
    description?: string | undefined;
    tenantId?: string | undefined;
    subjectType?: PolicySubjectTypeProto | undefined;
    subjectId?: string | undefined;
    permissionCode?: string | undefined;
    resourceType?: string | undefined;
    priority?: number | undefined;
    isEnabled?: boolean | undefined;
    conditionAstJson?: string | undefined;
}
export interface RemovePermissionPolicyResponse {
}
export interface PolicyManagementServiceClient {
    createPolicy(request: CreatePolicyRequest, ...rest: any): Observable<CreatePolicyResponse>;
    updatePolicy(request: UpdatePolicyRequest, ...rest: any): Observable<UpdatePolicyResponse>;
    deletePolicy(request: DeletePolicyRequest, ...rest: any): Observable<DeletePolicyResponse>;
    togglePolicy(request: TogglePolicyRequest, ...rest: any): Observable<TogglePolicyResponse>;
    getPolicyById(request: GetPolicyByIdRequest, ...rest: any): Observable<GetPolicyByIdResponse>;
    listPoliciesPaged(request: ListPoliciesPagedRequest, ...rest: any): Observable<ListPoliciesPagedResponse>;
    listPoliciesByPermission(request: ListPoliciesByPermissionRequest, ...rest: any): Observable<ListPoliciesByPermissionResponse>;
    addPermissionPolicy(request: AddPermissionPolicyRequest, ...rest: any): Observable<AddPermissionPolicyResponse>;
    removePermissionPolicy(request: RemovePermissionPolicyRequest, ...rest: any): Observable<RemovePermissionPolicyResponse>;
}
export interface PolicyManagementServiceController {
    createPolicy(request: CreatePolicyRequest, ...rest: any): Promise<CreatePolicyResponse> | Observable<CreatePolicyResponse> | CreatePolicyResponse;
    updatePolicy(request: UpdatePolicyRequest, ...rest: any): Promise<UpdatePolicyResponse> | Observable<UpdatePolicyResponse> | UpdatePolicyResponse;
    deletePolicy(request: DeletePolicyRequest, ...rest: any): Promise<DeletePolicyResponse> | Observable<DeletePolicyResponse> | DeletePolicyResponse;
    togglePolicy(request: TogglePolicyRequest, ...rest: any): Promise<TogglePolicyResponse> | Observable<TogglePolicyResponse> | TogglePolicyResponse;
    getPolicyById(request: GetPolicyByIdRequest, ...rest: any): Promise<GetPolicyByIdResponse> | Observable<GetPolicyByIdResponse> | GetPolicyByIdResponse;
    listPoliciesPaged(request: ListPoliciesPagedRequest, ...rest: any): Promise<ListPoliciesPagedResponse> | Observable<ListPoliciesPagedResponse> | ListPoliciesPagedResponse;
    listPoliciesByPermission(request: ListPoliciesByPermissionRequest, ...rest: any): Promise<ListPoliciesByPermissionResponse> | Observable<ListPoliciesByPermissionResponse> | ListPoliciesByPermissionResponse;
    addPermissionPolicy(request: AddPermissionPolicyRequest, ...rest: any): Promise<AddPermissionPolicyResponse> | Observable<AddPermissionPolicyResponse> | AddPermissionPolicyResponse;
    removePermissionPolicy(request: RemovePermissionPolicyRequest, ...rest: any): Promise<RemovePermissionPolicyResponse> | Observable<RemovePermissionPolicyResponse> | RemovePermissionPolicyResponse;
}
export declare function PolicyManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const POLICY_MANAGEMENT_SERVICE_NAME = "PolicyManagementService";
