import { Observable } from "rxjs";
export declare enum EmployeeLifecycleStatus {
    EMPLOYEE_LIFECYCLE_STATUS_UNSPECIFIED = 0,
    EMPLOYEE_LIFECYCLE_STATUS_PREBOARDING = 1,
    EMPLOYEE_LIFECYCLE_STATUS_ACTIVE = 2,
    EMPLOYEE_LIFECYCLE_STATUS_OFFBOARDED = 3
}
export declare enum EmploymentStatus {
    EMPLOYMENT_STATUS_UNSPECIFIED = 0,
    EMPLOYMENT_STATUS_ACTIVE = 1,
    EMPLOYMENT_STATUS_ENDED = 2
}
export declare enum OnboardingAccessStatus {
    ONBOARDING_ACCESS_STATUS_UNSPECIFIED = 0,
    ONBOARDING_ACCESS_STATUS_ACCOUNT_BINDING_PENDING = 1,
    ONBOARDING_ACCESS_STATUS_ACCESS_GRANT_PENDING = 2,
    ONBOARDING_ACCESS_STATUS_COMPLETED = 3
}
export interface EmployeeSummary {
    id?: string | undefined;
    tenantId?: string | undefined;
    tenantPartyId?: string | undefined;
    partyId?: string | undefined;
    employeeCode?: string | undefined;
    lifecycleStatus?: EmployeeLifecycleStatus | undefined;
}
export interface EmploymentSummary {
    id?: string | undefined;
    tenantId?: string | undefined;
    employeeId?: string | undefined;
    orgUnitId?: string | undefined;
    status?: EmploymentStatus | undefined;
    effectiveFrom?: string | undefined;
    effectiveTo?: string | undefined;
    endedReason?: string | undefined;
}
export interface GetEmployeeByIdRequest {
    employeeId?: string | undefined;
}
export interface GetEmployeeByIdResponse {
    employee?: EmployeeSummary | undefined;
}
export interface GetEmployeeByTenantPartyIdRequest {
    tenantId?: string | undefined;
    tenantPartyId?: string | undefined;
}
export interface GetEmployeeByTenantPartyIdResponse {
    employee?: EmployeeSummary | undefined;
}
export interface ListEmployeesRequest {
    tenantId?: string | undefined;
    keyword?: string | undefined;
    lifecycleStatus?: EmployeeLifecycleStatus | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListEmployeesResponse {
    items?: EmployeeSummary[] | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    total?: number | undefined;
}
export interface GetActiveEmploymentRequest {
    employeeId?: string | undefined;
}
export interface GetActiveEmploymentResponse {
    employment?: EmploymentSummary | undefined;
}
export interface ListEmploymentsRequest {
    employeeId?: string | undefined;
    status?: EmploymentStatus | undefined;
}
export interface ListEmploymentsResponse {
    employments?: EmploymentSummary[] | undefined;
}
export interface OnboardingAccessProcessSummary {
    id?: string | undefined;
    tenantId?: string | undefined;
    employeeId?: string | undefined;
    employmentId?: string | undefined;
    accountId?: string | undefined;
    status?: OnboardingAccessStatus | undefined;
    grantIdempotencyKey?: string | undefined;
    failureReason?: string | undefined;
}
export interface GetLatestOnboardingAccessRequest {
    tenantId?: string | undefined;
    employeeId?: string | undefined;
}
export interface GetLatestOnboardingAccessResponse {
    process?: OnboardingAccessProcessSummary | undefined;
}
export interface CreateEmployeeRequest {
    tenantId?: string | undefined;
    tenantPartyId?: string | undefined;
    partyId?: string | undefined;
    employeeCode?: string | undefined;
}
export interface CreateEmployeeResponse {
    employee?: EmployeeSummary | undefined;
}
export interface CreateEmploymentRequest {
    tenantId?: string | undefined;
    employeeId?: string | undefined;
    orgUnitId?: string | undefined;
    effectiveFrom?: string | undefined;
}
export interface CreateEmploymentResponse {
    employee?: EmployeeSummary | undefined;
    employment?: EmploymentSummary | undefined;
}
export interface EndEmploymentRequest {
    employmentId?: string | undefined;
    effectiveTo?: string | undefined;
    endedReason?: string | undefined;
}
export interface EndEmploymentResponse {
    employee?: EmployeeSummary | undefined;
    employment?: EmploymentSummary | undefined;
}
export interface ChangePrimaryEmploymentRequest {
    tenantId?: string | undefined;
    employeeId?: string | undefined;
    fromEmploymentId?: string | undefined;
    toOrgUnitId?: string | undefined;
    effectiveFrom?: string | undefined;
    endedReason?: string | undefined;
}
export interface ChangePrimaryEmploymentResponse {
    employee?: EmployeeSummary | undefined;
    endedEmployment?: EmploymentSummary | undefined;
    newEmployment?: EmploymentSummary | undefined;
}
export interface ProvisionEmployeeAccessAccountInput {
    displayName?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}
export interface CompleteEmployeeAccessRequest {
    tenantId?: string | undefined;
    employeeId?: string | undefined;
    employmentId?: string | undefined;
    roleIds?: string[] | undefined;
    reason?: string | undefined;
    existingAccountId?: string | undefined;
    createAccount?: ProvisionEmployeeAccessAccountInput | undefined;
}
export interface CompleteEmployeeAccessResponse {
    process?: OnboardingAccessProcessSummary | undefined;
}
export interface HrQueryServiceClient {
    getEmployeeById(request: GetEmployeeByIdRequest, ...rest: any): Observable<GetEmployeeByIdResponse>;
    getEmployeeByTenantPartyId(request: GetEmployeeByTenantPartyIdRequest, ...rest: any): Observable<GetEmployeeByTenantPartyIdResponse>;
    listEmployees(request: ListEmployeesRequest, ...rest: any): Observable<ListEmployeesResponse>;
    getActiveEmployment(request: GetActiveEmploymentRequest, ...rest: any): Observable<GetActiveEmploymentResponse>;
    listEmployments(request: ListEmploymentsRequest, ...rest: any): Observable<ListEmploymentsResponse>;
    getLatestOnboardingAccess(request: GetLatestOnboardingAccessRequest, ...rest: any): Observable<GetLatestOnboardingAccessResponse>;
}
export interface HrQueryServiceController {
    getEmployeeById(request: GetEmployeeByIdRequest, ...rest: any): Promise<GetEmployeeByIdResponse> | Observable<GetEmployeeByIdResponse> | GetEmployeeByIdResponse;
    getEmployeeByTenantPartyId(request: GetEmployeeByTenantPartyIdRequest, ...rest: any): Promise<GetEmployeeByTenantPartyIdResponse> | Observable<GetEmployeeByTenantPartyIdResponse> | GetEmployeeByTenantPartyIdResponse;
    listEmployees(request: ListEmployeesRequest, ...rest: any): Promise<ListEmployeesResponse> | Observable<ListEmployeesResponse> | ListEmployeesResponse;
    getActiveEmployment(request: GetActiveEmploymentRequest, ...rest: any): Promise<GetActiveEmploymentResponse> | Observable<GetActiveEmploymentResponse> | GetActiveEmploymentResponse;
    listEmployments(request: ListEmploymentsRequest, ...rest: any): Promise<ListEmploymentsResponse> | Observable<ListEmploymentsResponse> | ListEmploymentsResponse;
    getLatestOnboardingAccess(request: GetLatestOnboardingAccessRequest, ...rest: any): Promise<GetLatestOnboardingAccessResponse> | Observable<GetLatestOnboardingAccessResponse> | GetLatestOnboardingAccessResponse;
}
export declare function HrQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const HR_QUERY_SERVICE_NAME = "HrQueryService";
export interface HrManagementServiceClient {
    createEmployee(request: CreateEmployeeRequest, ...rest: any): Observable<CreateEmployeeResponse>;
    createEmployment(request: CreateEmploymentRequest, ...rest: any): Observable<CreateEmploymentResponse>;
    endEmployment(request: EndEmploymentRequest, ...rest: any): Observable<EndEmploymentResponse>;
    changePrimaryEmployment(request: ChangePrimaryEmploymentRequest, ...rest: any): Observable<ChangePrimaryEmploymentResponse>;
    completeEmployeeAccess(request: CompleteEmployeeAccessRequest, ...rest: any): Observable<CompleteEmployeeAccessResponse>;
}
export interface HrManagementServiceController {
    createEmployee(request: CreateEmployeeRequest, ...rest: any): Promise<CreateEmployeeResponse> | Observable<CreateEmployeeResponse> | CreateEmployeeResponse;
    createEmployment(request: CreateEmploymentRequest, ...rest: any): Promise<CreateEmploymentResponse> | Observable<CreateEmploymentResponse> | CreateEmploymentResponse;
    endEmployment(request: EndEmploymentRequest, ...rest: any): Promise<EndEmploymentResponse> | Observable<EndEmploymentResponse> | EndEmploymentResponse;
    changePrimaryEmployment(request: ChangePrimaryEmploymentRequest, ...rest: any): Promise<ChangePrimaryEmploymentResponse> | Observable<ChangePrimaryEmploymentResponse> | ChangePrimaryEmploymentResponse;
    completeEmployeeAccess(request: CompleteEmployeeAccessRequest, ...rest: any): Promise<CompleteEmployeeAccessResponse> | Observable<CompleteEmployeeAccessResponse> | CompleteEmployeeAccessResponse;
}
export declare function HrManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const HR_MANAGEMENT_SERVICE_NAME = "HrManagementService";
