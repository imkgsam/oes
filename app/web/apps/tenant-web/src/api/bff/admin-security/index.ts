import { requestClient } from '#/api/request';

export namespace AdminSecurityApi {
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

// Lists the session inventory for one explicitly selected target user.
export async function listAdminUserSessionsApi(userId: string) {
  return requestClient.get<AdminSecurityApi.SessionListResult>(
    `/auth/admin/users/${encodeURIComponent(userId)}/sessions`,
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
