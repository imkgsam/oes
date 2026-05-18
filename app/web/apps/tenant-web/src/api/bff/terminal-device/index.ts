import { requestClient } from '#/api/request';

export namespace TerminalDeviceApi {
  export type TerminalDeviceType = 'PDA' | 'TOUCH_PANEL';
  export type TerminalDeviceStatus =
    | 'ACTIVE'
    | 'DECOMMISSIONED'
    | 'DISABLED'
    | 'LOST'
    | 'MAINTENANCE'
    | 'PENDING_APPROVAL';
  export type EnrollmentStatus = 'EXPIRED' | 'ISSUED' | 'REVOKED' | 'USED';
  export type PresenceStatus = 'OFFLINE' | 'ONLINE' | 'UNKNOWN';
  export type IdentityConfidence = 'HIGH' | 'LOW' | 'MEDIUM' | 'UNKNOWN';

  export interface CreateEnrollmentPayload {
    displayName: string;
    expectedManufacturerSerial?: null | string;
    expiresAt: string;
    notes?: null | string;
    terminalDeviceType: TerminalDeviceType;
  }

  export interface Enrollment {
    createdAt: string;
    createdBy?: null | string;
    displayName: string;
    enrollmentCode?: string;
    enrollmentId: string;
    expiresAt: string;
    qrPayload?: string;
    revokedAt?: null | string;
    revokedBy?: null | string;
    status: EnrollmentStatus;
    terminalDeviceType: TerminalDeviceType;
    usedAt?: null | string;
    usedByTerminalDeviceId?: null | string;
  }

  export interface EnrollmentListQuery {
    page?: number;
    pageSize?: number;
    status?: EnrollmentStatus;
    terminalDeviceType?: TerminalDeviceType;
  }

  export interface EnrollmentListResult {
    items: Enrollment[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface RevokeEnrollmentPayload {
    reason: string;
  }

  export interface RevokeEnrollmentResult {
    enrollmentId: string;
    revokedAt: string;
    revokedBy: string;
    status: 'REVOKED';
  }

  export interface DeviceListQuery {
    appVersion?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
    presenceStatus?: PresenceStatus;
    status?: TerminalDeviceStatus;
    terminalDeviceType?: TerminalDeviceType;
  }

  export interface LastReportedAccount {
    accountId: string;
    displayName: string;
  }

  export interface DeviceListItem {
    androidVersion?: null | string;
    appVersion?: null | string;
    displayName: string;
    lastHeartbeatAt?: null | string;
    lastReportedAccount?: LastReportedAccount | null;
    manufacturer?: null | string;
    model?: null | string;
    presenceStatus: PresenceStatus;
    registeredAt: string;
    status: TerminalDeviceStatus;
    terminalDeviceId: string;
    terminalDeviceType: TerminalDeviceType;
  }

  export interface DeviceListResult {
    items: DeviceListItem[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface DeviceDetail {
    auditSummary: {
      lastStatusChangedAt?: null | string;
      lastStatusChangedBy?: null | string;
    };
    currentSessions: Array<{
      accountId: string;
      createdAt: string;
      displayName: string;
      lastSeenAt?: null | string;
      sessionId: string;
    }>;
    device: {
      displayName: string;
      enrollmentId?: null | string;
      registeredAt: string;
      status: TerminalDeviceStatus;
      statusReason?: null | string;
      tenantId: string;
      terminalDeviceId: string;
      terminalDeviceType: TerminalDeviceType;
    };
    identity: {
      androidIdMasked?: null | string;
      identityConfidence: IdentityConfidence;
      identitySource?: null | string;
      manufacturer?: null | string;
      manufacturerSerial?: null | string;
      model?: null | string;
    };
    runtime: {
      androidVersion?: null | string;
      appState?: null | string;
      appVersion?: null | string;
      batteryLevel?: null | number;
      lastHeartbeatAt?: null | string;
      lastReportedAccount?: LastReportedAccount | null;
      networkStatus?: null | string;
      networkType?: null | string;
      presenceStatus: PresenceStatus;
    };
  }

  export interface UpdateDevicePayload {
    displayName?: string;
    notes?: null | string;
  }

  export interface UpdateDeviceResult {
    displayName: string;
    notes?: null | string;
    terminalDeviceId: string;
    updatedAt: string;
  }

  export interface ChangeStatusPayload {
    reason: string;
    targetStatus: TerminalDeviceStatus;
  }

  export interface ChangeStatusResult {
    changedAt: string;
    previousStatus: TerminalDeviceStatus;
    sessionRevoke?: {
      affectedSessionCount: number;
      requested: boolean;
      status: 'ACCEPTED' | 'FAILED' | 'NOT_REQUESTED';
    };
    status: TerminalDeviceStatus;
    statusReason: string;
    terminalDeviceId: string;
  }

  export interface VersionPolicyQuery {
    terminalDeviceType: TerminalDeviceType;
  }

  export interface VersionPolicy {
    apkDownloadUrl?: null | string;
    latestAppVersion: string;
    minSupportedAppVersion: string;
    releaseNotesUrl?: null | string;
    tenantId: string;
    terminalDeviceType: TerminalDeviceType;
    updatedAt?: null | string;
    updatedBy?: null | string;
    upgradeRecommended: boolean;
    upgradeRequired: boolean;
  }

  export interface UpdateVersionPolicyPayload {
    apkDownloadUrl?: null | string;
    latestAppVersion: string;
    minSupportedAppVersion: string;
    reason: string;
    releaseNotesUrl?: null | string;
    terminalDeviceType: TerminalDeviceType;
    upgradeRecommended: boolean;
    upgradeRequired: boolean;
  }

  export interface AuditEvent {
    action: string;
    after?: Record<string, unknown>;
    auditEventId: string;
    before?: Record<string, unknown>;
    occurredAt: string;
    operatorAccountId: string;
    reason?: null | string;
    targetTerminalDeviceId: string;
    traceId?: null | string;
  }

  export interface AuditEventListQuery {
    page?: number;
    pageSize?: number;
  }

  export interface AuditEventListResult {
    items: AuditEvent[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface HeartbeatRecord {
    androidVersion?: null | string;
    appState?: null | string;
    appVersion?: null | string;
    batteryLevel?: null | number;
    clientTime?: null | string;
    heartbeatId: string;
    networkStatus?: null | string;
    networkType?: null | string;
    presenceStatus: PresenceStatus;
    receivedAt: string;
    reportedAccountId?: null | string;
    reportedSessionId?: null | string;
    terminalDeviceId: string;
    traceId?: null | string;
    webViewVersion?: null | string;
  }

  export interface HeartbeatRecordListQuery {
    page?: number;
    pageSize?: number;
  }

  export interface HeartbeatRecordListResult {
    items: HeartbeatRecord[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface DiagnosticLog {
    accountId?: null | string;
    clientTime: string;
    details: Record<string, unknown>;
    diagnosticMode: boolean;
    errorCode?: null | string;
    eventType: string;
    level: 'ERROR' | 'INFO' | 'WARN';
    message: string;
    receivedAt: string;
    requestId?: null | string;
    sessionId?: null | string;
    tenantId?: null | string;
    traceId?: null | string;
  }

  export interface DiagnosticLogListQuery {
    page?: number;
    pageSize?: number;
  }

  export interface DiagnosticLogListResult {
    items: DiagnosticLog[];
    page: number;
    pageSize: number;
    total: number;
  }
}

// Creates a short-lived, single-use enrollment through the Admin Terminal Device BFF.
export async function createTerminalDeviceEnrollmentApi(
  data: TerminalDeviceApi.CreateEnrollmentPayload,
) {
  return requestClient.post<TerminalDeviceApi.Enrollment>(
    '/admin/terminal-devices/enrollments',
    data,
  );
}

// Lists enrollment records in the current tenant scope.
export async function listTerminalDeviceEnrollmentsApi(
  params: TerminalDeviceApi.EnrollmentListQuery,
) {
  return requestClient.get<TerminalDeviceApi.EnrollmentListResult>(
    '/admin/terminal-devices/enrollments',
    { params },
  );
}

// Revokes an unused enrollment with the administrator-provided reason.
export async function revokeTerminalDeviceEnrollmentApi(
  enrollmentId: string,
  data: TerminalDeviceApi.RevokeEnrollmentPayload,
) {
  return requestClient.post<TerminalDeviceApi.RevokeEnrollmentResult>(
    `/admin/terminal-devices/enrollments/${encodeURIComponent(enrollmentId)}/revoke`,
    data,
  );
}

// Lists managed terminal devices without exposing sensitive identity fields by default.
export async function listTerminalDevicesApi(
  params: TerminalDeviceApi.DeviceListQuery,
) {
  return requestClient.get<TerminalDeviceApi.DeviceListResult>(
    '/admin/terminal-devices',
    { params },
  );
}

// Loads one managed terminal device detail including runtime snapshot and current sessions.
export async function getTerminalDeviceApi(terminalDeviceId: string) {
  return requestClient.get<TerminalDeviceApi.DeviceDetail>(
    `/admin/terminal-devices/${encodeURIComponent(terminalDeviceId)}`,
  );
}

// Updates non-lifecycle display fields on a managed terminal device.
export async function updateTerminalDeviceApi(
  terminalDeviceId: string,
  data: TerminalDeviceApi.UpdateDevicePayload,
) {
  return requestClient.request<TerminalDeviceApi.UpdateDeviceResult>(
    `/admin/terminal-devices/${encodeURIComponent(terminalDeviceId)}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Changes lifecycle status while leaving transition rules to terminal-device-service.
export async function changeTerminalDeviceStatusApi(
  terminalDeviceId: string,
  data: TerminalDeviceApi.ChangeStatusPayload,
) {
  return requestClient.request<TerminalDeviceApi.ChangeStatusResult>(
    `/admin/terminal-devices/${encodeURIComponent(terminalDeviceId)}/status`,
    {
      data,
      method: 'PATCH',
    },
  );
}

// Reads the current tenant version policy for a terminal device type.
export async function getTerminalDeviceVersionPolicyApi(
  params: TerminalDeviceApi.VersionPolicyQuery,
) {
  return requestClient.get<TerminalDeviceApi.VersionPolicy>(
    '/admin/terminal-devices/version-policy',
    { params },
  );
}

// Updates tenant-level PDA app version policy without implying automatic upgrade.
export async function updateTerminalDeviceVersionPolicyApi(
  data: TerminalDeviceApi.UpdateVersionPolicyPayload,
) {
  return requestClient.put<TerminalDeviceApi.VersionPolicy>(
    '/admin/terminal-devices/version-policy',
    data,
  );
}

// Lists governance audit events for one managed terminal device.
export async function listTerminalDeviceAuditEventsApi(
  terminalDeviceId: string,
  params: TerminalDeviceApi.AuditEventListQuery,
) {
  return requestClient.get<TerminalDeviceApi.AuditEventListResult>(
    `/admin/terminal-devices/${encodeURIComponent(terminalDeviceId)}/audit-events`,
    { params },
  );
}

// Lists immutable heartbeat diagnostic records for one managed terminal device.
export async function listTerminalDeviceHeartbeatRecordsApi(
  terminalDeviceId: string,
  params: TerminalDeviceApi.HeartbeatRecordListQuery,
) {
  return requestClient.get<TerminalDeviceApi.HeartbeatRecordListResult>(
    `/admin/terminal-devices/${encodeURIComponent(terminalDeviceId)}/heartbeat-records`,
    { params },
  );
}

// Lists recently uploaded PDA diagnostic logs for one managed terminal device.
export async function listTerminalDeviceDiagnosticLogsApi(
  terminalDeviceId: string,
  params: TerminalDeviceApi.DiagnosticLogListQuery,
) {
  return requestClient.get<TerminalDeviceApi.DiagnosticLogListResult>(
    `/admin/terminal-devices/${encodeURIComponent(terminalDeviceId)}/diagnostic-logs`,
    { params },
  );
}
