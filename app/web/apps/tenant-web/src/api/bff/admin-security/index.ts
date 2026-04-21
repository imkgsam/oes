import { requestClient } from '#/api/request';

export namespace AdminSecurityApi {
  export interface AccountDirectoryItem {
    accountDisplayName?: string;
    accountId: string;
    isEnabled: boolean;
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenantId?: string;
    tenantName?: string;
    userDisplayName?: string;
    userId: string;
  }

  export interface AccountDirectoryListResult {
    items: AccountDirectoryItem[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface AccountBasicInfo {
    accountId: string;
    displayName?: string;
    email?: string;
    isEnabled: boolean;
    phone?: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenantId?: string;
    tenantName?: string;
    userId: string;
  }

  export interface TenantOption {
    code: string;
    id: string;
    isActive: boolean;
    name: string;
  }

  export interface TenantOptionListResult {
    items: TenantOption[];
  }

  export interface AccountDirectoryQuery {
    keyword?: string;
    page?: number;
    pageSize?: number;
    scopeLevel?: 'SYSTEM' | 'TENANT';
    status?: 'DISABLED' | 'ENABLED';
  }

  export interface AccountTenantOptionQuery {
    keyword?: string;
    pageSize?: number;
  }

  export interface CreateAccountPayload {
    displayName: string;
    email?: string;
    initialRoleIds?: string[];
    phone?: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenantId?: string;
    username?: string;
  }

  export interface UpdateAccountBasicInfoPayload {
    displayName: string;
    email?: string;
    isEnabled?: boolean;
    phone?: string;
  }

  export interface UserSearchAccountSummary {
    accountDisplayName?: string;
    accountId: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenantId?: string;
    tenantName?: string;
  }

  export interface UserSearchItem {
    accountSummaries: UserSearchAccountSummary[];
    activeSessionCount: number;
    displayName?: string;
    emailMasked?: string;
    isOnline: boolean;
    phoneMasked?: string;
    userId: string;
  }

  export interface UserSearchListResult {
    items: UserSearchItem[];
  }

  export interface UserSearchQuery {
    keyword: string;
    limit?: number;
  }

  export interface OnlineUser {
    activeAccountCount: number;
    activeSessionCount: number;
    displayName?: string;
    lastActiveAt: string;
    tenantId?: string;
    tenantName?: null | string;
    tenantNames?: string[];
    userId: string;
    visibleTenantCount: number;
  }

  export interface OnlineUserListResult {
    items: OnlineUser[];
    nextCursor?: string;
  }

  export interface OnlineUserQuery {
    cursor?: string;
    pageSize?: number;
    query?: string;
    tenantId?: string;
  }

  export interface AuditEvent {
    detailsJson?: string;
    eventId: string;
    eventType?: string;
    module?: string;
    occurredAt?: string;
    operatorId?: string;
    operatorType?: string;
    orgId?: string;
    resourceId?: string;
    resourceType?: string;
    result?: string;
    service?: string;
    tenantId?: string;
    traceId?: string;
  }

  export interface AuditEventListResult {
    items: AuditEvent[];
    nextCursor?: string;
  }

  export interface AuditEventQuery {
    cursor?: string;
    eventType?: string;
    occurredAtFrom?: string;
    occurredAtTo?: string;
    operatorId?: string;
    orgId?: string;
    pageSize?: number;
    resourceId?: string;
    resourceType?: string;
    result?: string;
    service?: string;
    tenantId?: string;
  }

  export interface Session {
    accessRemainingSeconds: number;
    accountId?: string;
    accountName?: string;
    adminRevokeAt?: string;
    adminRevokeBy?: string;
    adminRevokeReason?: string;
    browser?: string;
    createdAt: string;
    deviceId?: string;
    deviceName?: string;
    expiresAt: string;
    idleSeconds: number;
    ipAddress?: string;
    isAccessExpired: boolean;
    isAdminControlled: boolean;
    isRefreshExpired: boolean;
    isRevoked: boolean;
    lastActiveAt: string;
    loginMethod: string;
    platform?: string;
    refreshExpiresAt: string;
    refreshRemainingSeconds: number;
    sessionAgeSeconds: number;
    sessionId: string;
    status: string;
    tenantId?: string;
    userAgent?: string;
    userId: string;
  }

  export interface SessionListResult {
    sessions: Session[];
  }

  export interface SessionMutationResult {
    sessionId: string;
    success: boolean;
  }

  export interface LoginMethod {
    createdAt?: string;
    enabled: boolean;
    hasPassword: boolean;
    identifier?: string;
    maskedIdentifier?: string;
    methodId: string;
    type: string;
    updatedAt?: string;
    userId: string;
    verified: boolean;
  }

  export interface LoginMethodListResult {
    loginMethods: LoginMethod[];
    passwordSetupRequired: boolean;
  }

  export interface LoginMethodMutationResult {
    loginMethod: LoginMethod;
    success: boolean;
  }

  export interface PasswordMutationResult {
    passwordSetupRequired: boolean;
    success: boolean;
  }

  export type TenantMfaFactor =
    | 'BACKUP_CODE'
    | 'EMAIL_OTP'
    | 'SMS_OTP'
    | 'TOTP';

  export interface TenantMfaFactorPolicy {
    enabled: boolean;
    factor: TenantMfaFactor;
    priority: number;
  }

  export interface TenantMfaPolicy {
    factors: TenantMfaFactorPolicy[];
    loginRequired: boolean;
    tenantId: string;
  }

  export interface TenantMfaPolicyMutationPayload {
    factors: TenantMfaFactorPolicy[];
    loginRequired: boolean;
  }
}

// Lists the administrator-visible account directory for account management.
export async function listAdminAccountsApi(
  params: AdminSecurityApi.AccountDirectoryQuery,
) {
  return requestClient.get<AdminSecurityApi.AccountDirectoryListResult>(
    '/auth/admin/accounts',
    { params },
  );
}

export async function listAdminAccountTenantOptionsApi(
  params: AdminSecurityApi.AccountTenantOptionQuery,
) {
  return requestClient.get<AdminSecurityApi.TenantOptionListResult>(
    '/auth/admin/account-tenant-options',
    { params },
  );
}

export async function createAdminAccountApi(
  data: AdminSecurityApi.CreateAccountPayload,
) {
  return requestClient.post<AdminSecurityApi.AccountDirectoryItem>(
    '/auth/admin/accounts',
    data,
  );
}

export async function getAdminAccountBasicInfoApi(accountId: string) {
  return requestClient.get<AdminSecurityApi.AccountBasicInfo>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/profile`,
  );
}

export async function updateAdminAccountBasicInfoApi(
  accountId: string,
  data: AdminSecurityApi.UpdateAccountBasicInfoPayload,
) {
  return requestClient.request<AdminSecurityApi.AccountBasicInfo>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/profile`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Lists login methods for the user behind one administrator-selected account.
export async function listAdminAccountLoginMethodsApi(accountId: string) {
  return requestClient.get<AdminSecurityApi.LoginMethodListResult>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/login-methods`,
  );
}

// Requires the user behind one administrator-selected account to set a password.
export async function requireAdminAccountPasswordSetupApi(
  accountId: string,
  data: { reason?: string; revokeSessions?: boolean } = {},
) {
  return requestClient.post<AdminSecurityApi.PasswordMutationResult>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/password/setup-required`,
    data,
  );
}

// Enables one login method for the user behind an administrator-selected account.
export async function enableAdminAccountLoginMethodApi(
  accountId: string,
  methodId: string,
  data: { reason?: string } = {},
) {
  return requestClient.post<AdminSecurityApi.LoginMethodMutationResult>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/login-methods/${encodeURIComponent(methodId)}/enable`,
    data,
  );
}

// Disables one login method for the user behind an administrator-selected account.
export async function disableAdminAccountLoginMethodApi(
  accountId: string,
  methodId: string,
  data: { reason?: string } = {},
) {
  return requestClient.post<AdminSecurityApi.LoginMethodMutationResult>(
    `/auth/admin/accounts/${encodeURIComponent(accountId)}/login-methods/${encodeURIComponent(methodId)}/disable`,
    data,
  );
}

// Lists auth-domain audit events visible to the current administrator scope.
export async function listAdminAuditEventsApi(
  params: AdminSecurityApi.AuditEventQuery,
) {
  return requestClient.get<AdminSecurityApi.AuditEventListResult>(
    '/auth/admin/audit-events',
    { params },
  );
}

// Lists the current scope-aware online-user overview for administrator session management.
export async function listAdminOnlineUsersApi(
  params: AdminSecurityApi.OnlineUserQuery,
) {
  return requestClient.get<AdminSecurityApi.OnlineUserListResult>(
    '/auth/admin/online-users',
    { params },
  );
}

// Searches one small set of administrator-visible users by stable identifiers.
export async function searchAdminUsersApi(
  params: AdminSecurityApi.UserSearchQuery,
) {
  return requestClient.get<AdminSecurityApi.UserSearchListResult>(
    '/auth/admin/users/search',
    { params },
  );
}

// Lists the session inventory for one explicitly selected target user.
export async function listAdminUserSessionsApi(
  userId: string,
  params?: { cursor?: string; deviceQuery?: string; pageSize?: number; status?: string },
) {
  return requestClient.get<AdminSecurityApi.SessionListResult>(
    `/auth/admin/users/${encodeURIComponent(userId)}/sessions`,
    { params },
  );
}

// Revokes one selected target session with an operator-supplied reason.
export async function revokeAdminSessionApi(
  sessionId: string,
  reason: string,
) {
  return requestClient.post<AdminSecurityApi.SessionMutationResult>(
    `/auth/admin/sessions/${encodeURIComponent(sessionId)}/revoke`,
    { reason },
  );
}

export async function getAdminTenantMfaPolicyApi() {
  return requestClient.get<AdminSecurityApi.TenantMfaPolicy>(
    '/auth/admin/tenant-mfa-policy',
  );
}

export async function updateAdminTenantMfaPolicyApi(
  data: AdminSecurityApi.TenantMfaPolicyMutationPayload,
) {
  return requestClient.request<AdminSecurityApi.TenantMfaPolicy>(
    '/auth/admin/tenant-mfa-policy',
    {
      data,
      method: 'PUT',
    },
  );
}
