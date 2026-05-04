import { Observable } from "rxjs";
/** File: src/common/src/contracts/permission_service/permission_access_summary.proto */
/** GetAccountAccessSummaryRequest identifies the selected account and tenant context whose effective access should be summarized. */
export interface GetAccountAccessSummaryRequest {
    accountId?: string | undefined;
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
}
/** AccountAccessSummaryResponse returns display roles plus action codes for front-end action gating. */
export interface AccountAccessSummaryResponse {
    roles?: AccessRoleSummary[] | undefined;
    actionCodes?: string[] | undefined;
}
/** GetAccountAccessSummaryResponse preserves the existing wire shape while satisfying RPC-specific response naming hygiene. */
export interface GetAccountAccessSummaryResponse {
    roles?: AccessRoleSummary[] | undefined;
    actionCodes?: string[] | undefined;
}
/** ResolveAccountNavigationRequest identifies the selected account context and terminal for runtime navigation resolution. */
export interface ResolveAccountNavigationRequest {
    accountId?: string | undefined;
    tenantId?: string | undefined;
    scopeLevel?: string | undefined;
    terminal?: string | undefined;
}
/** AccountNavigationSummaryResponse returns terminal-aware visible entries and the selected default landing entry. */
export interface AccountNavigationSummaryResponse {
    visibleEntries?: string[] | undefined;
    defaultEntry?: string | undefined;
    resolvedByRoleId?: string | undefined;
    fallbackReason?: string | undefined;
}
/** ResolveAccountNavigationResponse preserves the existing wire shape while satisfying RPC-specific response naming hygiene. */
export interface ResolveAccountNavigationResponse {
    visibleEntries?: string[] | undefined;
    defaultEntry?: string | undefined;
    resolvedByRoleId?: string | undefined;
    fallbackReason?: string | undefined;
}
/** AccessRoleSummary carries role metadata for display and diagnostics, not for front-end permission derivation. */
export interface AccessRoleSummary {
    roleId?: string | undefined;
    code?: string | undefined;
    name?: string | undefined;
    tenantId?: string | undefined;
    scope?: string | undefined;
}
/** PermissionAccessSummaryService exposes self-context authorization summaries for internal BFF consumers. */
export interface PermissionAccessSummaryServiceClient {
    getAccountAccessSummary(request: GetAccountAccessSummaryRequest, ...rest: any): Observable<GetAccountAccessSummaryResponse>;
    resolveAccountNavigation(request: ResolveAccountNavigationRequest, ...rest: any): Observable<ResolveAccountNavigationResponse>;
}
/** PermissionAccessSummaryService exposes self-context authorization summaries for internal BFF consumers. */
export interface PermissionAccessSummaryServiceController {
    getAccountAccessSummary(request: GetAccountAccessSummaryRequest, ...rest: any): Promise<GetAccountAccessSummaryResponse> | Observable<GetAccountAccessSummaryResponse> | GetAccountAccessSummaryResponse;
    resolveAccountNavigation(request: ResolveAccountNavigationRequest, ...rest: any): Promise<ResolveAccountNavigationResponse> | Observable<ResolveAccountNavigationResponse> | ResolveAccountNavigationResponse;
}
export declare function PermissionAccessSummaryServiceControllerMethods(): (constructor: Function) => void;
export declare const PERMISSION_ACCESS_SUMMARY_SERVICE_NAME = "PermissionAccessSummaryService";
