import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  ChangeTerminalDeviceStatusResponse,
  CreateEnrollmentResponse,
  EnrollmentStatus,
  GetTerminalDeviceResponse,
  GetVersionPolicyResponse,
  ListDiagnosticLogsResponse,
  ListEnrollmentsResponse,
  ListHeartbeatRecordsResponse,
  ListTerminalDeviceAuditEventsResponse,
  ListTerminalDevicesResponse,
  AppState,
  NetworkStatus,
  NetworkType,
  PresenceStatus,
  RevokeEnrollmentResponse,
  TERMINAL_DEVICE_ENROLLMENT_SERVICE_NAME,
  TERMINAL_DEVICE_MANAGEMENT_SERVICE_NAME,
  TERMINAL_DEVICE_RUNTIME_SNAPSHOT_SERVICE_NAME,
  TERMINAL_DEVICE_VERSION_POLICY_SERVICE_NAME,
  TerminalDeviceEnrollmentServiceClient,
  TerminalDeviceManagementServiceClient,
  TerminalDeviceRuntimeSnapshotServiceClient,
  TerminalDeviceStatus,
  TerminalDeviceType,
  TerminalDeviceVersionPolicyServiceClient,
  UpdateTerminalDeviceResponse,
  UpsertVersionPolicyResponse
} from '@oes/common/generated/terminal_device_service'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

export type AdminTerminalDeviceType = 'PDA' | 'TOUCH_PANEL'
export type AdminTerminalDeviceStatus =
  | 'ACTIVE'
  | 'DECOMMISSIONED'
  | 'DISABLED'
  | 'LOST'
  | 'MAINTENANCE'
  | 'PENDING_APPROVAL'
export type AdminEnrollmentStatus = 'EXPIRED' | 'ISSUED' | 'REVOKED' | 'USED'
export type AdminPresenceStatus = 'OFFLINE' | 'ONLINE' | 'UNKNOWN'

export interface AdminPagination {
  page: number
  pageSize: number
  total: number
}

export interface AdminEnrollment {
  enrollmentId: string
  terminalDeviceType: AdminTerminalDeviceType
  displayName: string
  status: AdminEnrollmentStatus
  enrollmentCode?: string
  qrPayload?: string
  expiresAt: string
  usedAt?: string | null
  usedByTerminalDeviceId?: string | null
  revokedAt?: string | null
  revokedBy?: string | null
  createdBy?: string | null
  createdAt: string
}

export interface AdminDeviceSummary {
  terminalDeviceId: string
  terminalDeviceType: AdminTerminalDeviceType
  displayName: string
  status: AdminTerminalDeviceStatus
  presenceStatus: AdminPresenceStatus
  appVersion?: string | null
  androidVersion?: string | null
  manufacturer?: string | null
  model?: string | null
  lastHeartbeatAt?: string | null
  lastReportedAccount?: { accountId: string; displayName: string } | null
  registeredAt: string
}

export interface AdminDeviceDetail {
  device: {
    terminalDeviceId: string
    tenantId: string
    terminalDeviceType: AdminTerminalDeviceType
    displayName: string
    status: AdminTerminalDeviceStatus
    statusReason?: string | null
    registeredAt: string
    enrollmentId?: string | null
    notes?: string | null
  }
  identity: {
    manufacturer?: string | null
    model?: string | null
    manufacturerSerial?: string | null
    androidIdMasked?: string | null
    identitySource?: string | null
    identityConfidence: string
  }
  runtime: {
    presenceStatus: AdminPresenceStatus
    lastHeartbeatAt?: string | null
    appVersion?: string | null
    androidVersion?: string | null
    networkStatus?: string | null
    networkType?: string | null
    batteryLevel?: number | null
    appState?: string | null
    lastReportedAccount?: { accountId: string; displayName: string } | null
  }
}

export interface AdminVersionPolicy {
  tenantId: string
  terminalDeviceType: AdminTerminalDeviceType
  minSupportedAppVersion: string
  latestAppVersion: string
  upgradeRequired: boolean
  upgradeRecommended: boolean
  apkDownloadUrl?: string | null
  releaseNotesUrl?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

export interface AdminAuditEvent {
  auditEventId: string
  action: string
  operatorAccountId: string
  targetTerminalDeviceId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  reason?: string | null
  traceId?: string | null
  occurredAt: string
}

export interface AdminHeartbeatRecord {
  heartbeatId: string
  terminalDeviceId: string
  presenceStatus: AdminPresenceStatus
  receivedAt: string
  clientTime?: string | null
  appVersion?: string | null
  androidVersion?: string | null
  webViewVersion?: string | null
  networkStatus?: string | null
  networkType?: string | null
  batteryLevel?: number | null
  appState?: string | null
  reportedAccountId?: string | null
  reportedSessionId?: string | null
  traceId?: string | null
}

export interface AdminDiagnosticLog {
  diagnosticLogId: string
  deviceId: string
  accountId?: string | null
  tenantId?: string | null
  sessionId?: string | null
  clientTime: string
  receivedAt: string
  level: string
  eventType: string
  message: string
  traceId?: string | null
  requestId?: string | null
  errorCode?: string | null
  diagnosticMode: boolean
  details: Record<string, unknown>
}

@Injectable()
// Bridges Admin Terminal Device BFF use cases to terminal-device-service gRPC contracts.
export class TerminalDeviceAdminAdapter implements OnModuleInit {
  private enrollmentSvc!: TerminalDeviceEnrollmentServiceClient
  private managementSvc!: TerminalDeviceManagementServiceClient
  private runtimeSvc!: TerminalDeviceRuntimeSnapshotServiceClient
  private versionPolicySvc!: TerminalDeviceVersionPolicyServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.TERMINAL_DEVICE)
    private readonly client: ClientGrpc
  ) {}

  onModuleInit(): void {
    this.enrollmentSvc = this.client.getService<TerminalDeviceEnrollmentServiceClient>(
      TERMINAL_DEVICE_ENROLLMENT_SERVICE_NAME
    )
    this.managementSvc = this.client.getService<TerminalDeviceManagementServiceClient>(
      TERMINAL_DEVICE_MANAGEMENT_SERVICE_NAME
    )
    this.runtimeSvc = this.client.getService<TerminalDeviceRuntimeSnapshotServiceClient>(
      TERMINAL_DEVICE_RUNTIME_SNAPSHOT_SERVICE_NAME
    )
    this.versionPolicySvc = this.client.getService<TerminalDeviceVersionPolicyServiceClient>(
      TERMINAL_DEVICE_VERSION_POLICY_SERVICE_NAME
    )
  }

  // Creates a one-time enrollment and returns the creation-time plaintext code.
  async createEnrollment(input: {
    tenantId: string
    terminalDeviceType: AdminTerminalDeviceType
    displayName: string
    expectedManufacturerSerial?: string | null
    expiresAt: string
    notes?: string | null
    source: DownstreamRequestSource
  }): Promise<AdminEnrollment> {
    const response = await safeGrpcCall<CreateEnrollmentResponse>(
      this.enrollmentSvc.createEnrollment({
        tenantId: input.tenantId,
        terminalDeviceType: toProtoDeviceType(input.terminalDeviceType),
        displayName: input.displayName,
        expectedManufacturerSerial: input.expectedManufacturerSerial ?? '',
        expiresAt: input.expiresAt,
        notes: input.notes ?? '',
        operatorContext: toOperatorContext(input.source)
      }),
      this.opts('createEnrollment')
    )

    return {
      ...toEnrollment(response.enrollment),
      enrollmentCode: normalize(response.enrollmentCode) ?? '',
      qrPayload: `oes-pda-enrollment://${normalize(response.enrollmentCode) ?? ''}`
    }
  }

  // Lists tenant-scoped enrollment records without returning plaintext enrollment codes.
  async listEnrollments(input: {
    tenantId: string
    terminalDeviceType?: AdminTerminalDeviceType
    status?: AdminEnrollmentStatus
    page?: number
    pageSize?: number
  }): Promise<{ items: AdminEnrollment[] } & AdminPagination> {
    const response = await safeGrpcCall<ListEnrollmentsResponse>(
      this.enrollmentSvc.listEnrollments({
        tenantId: input.tenantId,
        terminalDeviceType: input.terminalDeviceType ? toProtoDeviceType(input.terminalDeviceType) : undefined,
        status: input.status ? toProtoEnrollmentStatus(input.status) : undefined,
        pagination: toPagination(input.page, input.pageSize)
      }),
      this.opts('listEnrollments')
    )

    return {
      items: (response.items ?? []).map(toEnrollment),
      ...toPaginationResult(response.pagination)
    }
  }

  // Revokes one unused enrollment through terminal-device-service lifecycle rules.
  async revokeEnrollment(input: {
    tenantId: string
    enrollmentId: string
    reason: string
    source: DownstreamRequestSource
  }): Promise<{ enrollmentId: string; status: 'REVOKED'; revokedAt: string; revokedBy: string }> {
    const response = await safeGrpcCall<RevokeEnrollmentResponse>(
      this.enrollmentSvc.revokeEnrollment({
        tenantId: input.tenantId,
        enrollmentId: input.enrollmentId,
        reason: input.reason,
        operatorContext: toOperatorContext(input.source)
      }),
      this.opts('revokeEnrollment')
    )

    return {
      enrollmentId: response.enrollment?.enrollmentId ?? input.enrollmentId,
      status: 'REVOKED',
      revokedAt: response.enrollment?.revokedAt ?? '',
      revokedBy: response.enrollment?.revokedBy ?? ''
    }
  }

  // Lists tenant-scoped terminal devices with runtime snapshot summary fields.
  async listDevices(input: {
    tenantId: string
    terminalDeviceType?: AdminTerminalDeviceType
    status?: AdminTerminalDeviceStatus
    presenceStatus?: AdminPresenceStatus
    keyword?: string
    page?: number
    pageSize?: number
  }): Promise<{ items: AdminDeviceSummary[] } & AdminPagination> {
    const response = await safeGrpcCall<ListTerminalDevicesResponse>(
      this.managementSvc.listTerminalDevices({
        tenantId: input.tenantId,
        terminalDeviceType: input.terminalDeviceType ? toProtoDeviceType(input.terminalDeviceType) : undefined,
        status: input.status ? toProtoDeviceStatus(input.status) : undefined,
        presenceStatus: input.presenceStatus ? toProtoPresenceStatus(input.presenceStatus) : undefined,
        keyword: input.keyword ?? '',
        pagination: toPagination(input.page, input.pageSize)
      }),
      this.opts('listTerminalDevices')
    )

    return {
      items: (response.items ?? []).map((item) => ({
        terminalDeviceId: item.terminalDeviceId ?? '',
        terminalDeviceType: toDeviceType(item.terminalDeviceType),
        displayName: item.displayName ?? '',
        status: toDeviceStatus(item.status),
        presenceStatus: toPresenceStatus(item.presenceStatus),
        appVersion: emptyToNull(item.appVersion),
        androidVersion: emptyToNull(item.androidVersion),
        manufacturer: emptyToNull(item.manufacturer),
        model: emptyToNull(item.model),
        lastHeartbeatAt: emptyToNull(item.lastHeartbeatAt),
        lastReportedAccount: item.lastReportedAccountId
          ? { accountId: item.lastReportedAccountId, displayName: item.lastReportedAccountId }
          : null,
        registeredAt: item.registeredAt ?? ''
      })),
      ...toPaginationResult(response.pagination)
    }
  }

  // Loads one terminal device detail while terminal-device-service controls sensitive identity masking.
  async getDevice(input: {
    tenantId: string
    terminalDeviceId: string
    includeSensitiveIdentity: boolean
  }): Promise<AdminDeviceDetail> {
    const response = await safeGrpcCall<GetTerminalDeviceResponse>(
      this.managementSvc.getTerminalDevice({
        tenantId: input.tenantId,
        terminalDeviceId: input.terminalDeviceId,
        includeSensitiveIdentity: input.includeSensitiveIdentity
      }),
      this.opts('getTerminalDevice')
    )

    return toDeviceDetail(response)
  }

  // Updates non-lifecycle display fields for one terminal device.
  async updateDevice(input: {
    tenantId: string
    terminalDeviceId: string
    displayName?: string | null
    notes?: string | null
    source: DownstreamRequestSource
  }): Promise<{ terminalDeviceId: string; displayName: string; notes?: string | null; updatedAt: string }> {
    const response = await safeGrpcCall<UpdateTerminalDeviceResponse>(
      this.managementSvc.updateTerminalDevice({
        tenantId: input.tenantId,
        terminalDeviceId: input.terminalDeviceId,
        displayName: input.displayName ?? '',
        notes: input.notes ?? '',
        operatorContext: toOperatorContext(input.source)
      }),
      this.opts('updateTerminalDevice')
    )

    return {
      terminalDeviceId: response.terminalDeviceId ?? input.terminalDeviceId,
      displayName: response.displayName ?? '',
      notes: emptyToNull(response.notes),
      updatedAt: response.updatedAt ?? ''
    }
  }

  // Changes lifecycle status and returns the downstream session revoke intent.
  async changeStatus(input: {
    tenantId: string
    terminalDeviceId: string
    targetStatus: AdminTerminalDeviceStatus
    reason: string
    source: DownstreamRequestSource
  }): Promise<{
    terminalDeviceId: string
    previousStatus: AdminTerminalDeviceStatus
    status: AdminTerminalDeviceStatus
    statusReason: string
    changedAt: string
    sessionRevokeIntent: { required: boolean; terminalDeviceId: string }
  }> {
    const response = await safeGrpcCall<ChangeTerminalDeviceStatusResponse>(
      this.managementSvc.changeTerminalDeviceStatus({
        tenantId: input.tenantId,
        terminalDeviceId: input.terminalDeviceId,
        targetStatus: toProtoDeviceStatus(input.targetStatus),
        reason: input.reason,
        operatorContext: toOperatorContext(input.source)
      }),
      this.opts('changeTerminalDeviceStatus')
    )

    return {
      terminalDeviceId: response.terminalDeviceId ?? input.terminalDeviceId,
      previousStatus: toDeviceStatus(response.previousStatus),
      status: toDeviceStatus(response.status),
      statusReason: response.statusReason ?? '',
      changedAt: response.changedAt ?? '',
      sessionRevokeIntent: {
        required: Boolean(response.sessionRevokeIntent?.required),
        terminalDeviceId: response.sessionRevokeIntent?.terminalDeviceId ?? input.terminalDeviceId
      }
    }
  }

  // Reads the tenant version policy for one terminal device type.
  async getVersionPolicy(input: {
    tenantId: string
    terminalDeviceType: AdminTerminalDeviceType
  }): Promise<AdminVersionPolicy> {
    const response = await safeGrpcCall<GetVersionPolicyResponse>(
      this.versionPolicySvc.getVersionPolicy({
        tenantId: input.tenantId,
        terminalDeviceType: toProtoDeviceType(input.terminalDeviceType)
      }),
      this.opts('getVersionPolicy')
    )

    return toVersionPolicy(response.policy, input.tenantId, input.terminalDeviceType)
  }

  // Upserts the tenant version policy for one terminal device type.
  async upsertVersionPolicy(input: AdminVersionPolicy & { reason: string; source: DownstreamRequestSource }): Promise<AdminVersionPolicy> {
    const response = await safeGrpcCall<UpsertVersionPolicyResponse>(
      this.versionPolicySvc.upsertVersionPolicy({
        tenantId: input.tenantId,
        terminalDeviceType: toProtoDeviceType(input.terminalDeviceType),
        minSupportedAppVersion: input.minSupportedAppVersion,
        latestAppVersion: input.latestAppVersion,
        upgradeRequired: input.upgradeRequired,
        upgradeRecommended: input.upgradeRecommended,
        apkDownloadUrl: input.apkDownloadUrl ?? '',
        releaseNotesUrl: input.releaseNotesUrl ?? '',
        reason: input.reason,
        operatorContext: toOperatorContext(input.source)
      }),
      this.opts('upsertVersionPolicy')
    )

    return toVersionPolicy(response.policy, input.tenantId, input.terminalDeviceType)
  }

  // Lists governance audit events for one terminal device.
  async listAuditEvents(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }): Promise<{ items: AdminAuditEvent[] } & AdminPagination> {
    const response = await safeGrpcCall<ListTerminalDeviceAuditEventsResponse>(
      this.managementSvc.listTerminalDeviceAuditEvents({
        tenantId: input.tenantId,
        terminalDeviceId: input.terminalDeviceId,
        pagination: toPagination(input.page, input.pageSize)
      }),
      this.opts('listTerminalDeviceAuditEvents')
    )

    return {
      items: (response.items ?? []).map((event) => ({
        auditEventId: event.auditEventId ?? '',
        action: event.action ?? '',
        operatorAccountId: event.operatorAccountId ?? '',
        targetTerminalDeviceId: event.targetTerminalDeviceId ?? '',
        before: parseJsonObject(event.beforeJson),
        after: parseJsonObject(event.afterJson),
        reason: emptyToNull(event.reason),
        traceId: emptyToNull(event.traceId),
        occurredAt: event.occurredAt ?? ''
      })),
      ...toPaginationResult(response.pagination)
    }
  }

  // Lists immutable heartbeat records for one terminal device from terminal-device-service.
  async listHeartbeatRecords(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }): Promise<{ items: AdminHeartbeatRecord[] } & AdminPagination> {
    const response = await safeGrpcCall<ListHeartbeatRecordsResponse>(
      this.runtimeSvc.listHeartbeatRecords({
        tenantId: input.tenantId,
        terminalDeviceId: input.terminalDeviceId,
        pagination: toPagination(input.page, input.pageSize)
      }),
      this.opts('listHeartbeatRecords')
    )

    return {
      items: (response.items ?? []).map((item) => ({
        heartbeatId: item.heartbeatId ?? '',
        terminalDeviceId: item.terminalDeviceId ?? input.terminalDeviceId,
        presenceStatus: toPresenceStatus(item.presenceStatus),
        receivedAt: item.receivedAt ?? '',
        clientTime: emptyToNull(item.clientTime),
        appVersion: emptyToNull(item.appVersion),
        androidVersion: emptyToNull(item.androidVersion),
        webViewVersion: emptyToNull(item.webViewVersion),
        networkStatus: enumName(item.networkStatus, 'NETWORK_STATUS_', 'UNKNOWN'),
        networkType: enumName(item.networkType, 'NETWORK_TYPE_', 'UNKNOWN'),
        batteryLevel: item.batteryLevel ?? null,
        appState: enumName(item.appState, 'APP_STATE_', 'UNKNOWN'),
        reportedAccountId: emptyToNull(item.reportedAccountId),
        reportedSessionId: emptyToNull(item.reportedSessionId),
        traceId: emptyToNull(item.traceId)
      })),
      ...toPaginationResult(response.pagination)
    }
  }

  // Lists persisted manual PDA diagnostic logs from terminal-device-service.
  async listDiagnosticLogs(input: {
    tenantId: string
    terminalDeviceId: string
    page?: number
    pageSize?: number
  }): Promise<{ items: AdminDiagnosticLog[] } & AdminPagination> {
    const response = await safeGrpcCall<ListDiagnosticLogsResponse>(
      this.runtimeSvc.listDiagnosticLogs({
        tenantId: input.tenantId,
        terminalDeviceId: input.terminalDeviceId,
        pagination: toPagination(input.page, input.pageSize)
      }),
      this.opts('listDiagnosticLogs')
    )

    return {
      items: (response.items ?? []).map((item) => ({
        diagnosticLogId: item.diagnosticLogId ?? '',
        deviceId: item.terminalDeviceId ?? input.terminalDeviceId,
        tenantId: emptyToNull(item.tenantId),
        accountId: emptyToNull(item.accountId),
        sessionId: emptyToNull(item.sessionId),
        clientTime: item.clientTime ?? '',
        receivedAt: item.receivedAt ?? '',
        level: item.level ?? '',
        eventType: item.eventType ?? '',
        message: item.message ?? '',
        traceId: emptyToNull(item.traceId),
        requestId: emptyToNull(item.requestId),
        errorCode: emptyToNull(item.errorCode),
        diagnosticMode: item.diagnosticMode ?? false,
        details: parseDetailsJson(item.detailsJson)
      })),
      ...toPaginationResult(response.pagination)
    }
  }

  // Builds safe gRPC call metadata for admin terminal device diagnostics.
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

function toOperatorContext(source: DownstreamRequestSource) {
  return {
    operatorAccountId: source.user?.aid ?? source.user?.holderId ?? source.user?.sub ?? '',
    operatorOrgId: source.user?.orgId ?? '',
    traceId: source.traceId ?? ''
  }
}

function toPagination(page?: number, pageSize?: number) {
  return { page: page ?? 1, pageSize: pageSize ?? 20 }
}

function toPaginationResult(value?: { page?: number; pageSize?: number; total?: number }): AdminPagination {
  return {
    page: value?.page ?? 1,
    pageSize: value?.pageSize ?? 20,
    total: value?.total ?? 0
  }
}

function toEnrollment(value?: {
  enrollmentId?: string
  terminalDeviceType?: TerminalDeviceType
  displayName?: string
  status?: EnrollmentStatus
  expiresAt?: string
  usedAt?: string
  usedByTerminalDeviceId?: string
  revokedAt?: string
  revokedBy?: string
  createdBy?: string
  createdAt?: string
}): AdminEnrollment {
  return {
    enrollmentId: value?.enrollmentId ?? '',
    terminalDeviceType: toDeviceType(value?.terminalDeviceType),
    displayName: value?.displayName ?? '',
    status: toEnrollmentStatus(value?.status),
    expiresAt: value?.expiresAt ?? '',
    usedAt: emptyToNull(value?.usedAt),
    usedByTerminalDeviceId: emptyToNull(value?.usedByTerminalDeviceId),
    revokedAt: emptyToNull(value?.revokedAt),
    revokedBy: emptyToNull(value?.revokedBy),
    createdBy: emptyToNull(value?.createdBy),
    createdAt: value?.createdAt ?? ''
  }
}

function toDeviceDetail(response: GetTerminalDeviceResponse): AdminDeviceDetail {
  const device = response.device
  const identity = response.identity
  const runtime = response.runtime

  return {
    device: {
      terminalDeviceId: device?.terminalDeviceId ?? '',
      tenantId: device?.tenantId ?? '',
      terminalDeviceType: toDeviceType(device?.terminalDeviceType),
      displayName: device?.displayName ?? '',
      status: toDeviceStatus(device?.status),
      statusReason: emptyToNull(device?.statusReason),
      registeredAt: device?.registeredAt ?? '',
      enrollmentId: emptyToNull(device?.enrollmentId),
      notes: emptyToNull(device?.notes)
    },
    identity: {
      manufacturer: emptyToNull(identity?.manufacturer),
      model: emptyToNull(identity?.model),
      manufacturerSerial: emptyToNull(identity?.manufacturerSerial),
      androidIdMasked: emptyToNull(identity?.androidIdMasked),
      identitySource: identity?.manufacturerSerial ? 'MANUFACTURER_SERIAL' : null,
      identityConfidence: identity?.manufacturerSerial ? 'HIGH' : 'UNKNOWN'
    },
    runtime: {
      presenceStatus: toPresenceStatus(runtime?.presenceStatus),
      lastHeartbeatAt: emptyToNull(runtime?.lastHeartbeatAt),
      appVersion: emptyToNull(runtime?.appVersion),
      androidVersion: emptyToNull(runtime?.androidVersion),
      networkStatus: enumName(runtime?.networkStatus, 'NETWORK_STATUS_', 'UNKNOWN'),
      networkType: enumName(runtime?.networkType, 'NETWORK_TYPE_', 'UNKNOWN'),
      batteryLevel: runtime?.batteryLevel ?? null,
      appState: enumName(runtime?.appState, 'APP_STATE_', 'UNKNOWN'),
      lastReportedAccount: runtime?.lastReportedAccountId
        ? { accountId: runtime.lastReportedAccountId, displayName: runtime.lastReportedAccountId }
        : null
    }
  }
}

function toVersionPolicy(
  policy: NonNullable<GetVersionPolicyResponse['policy']> | undefined,
  tenantId: string,
  terminalDeviceType: AdminTerminalDeviceType
): AdminVersionPolicy {
  return {
    tenantId: policy?.tenantId ?? tenantId,
    terminalDeviceType: policy?.terminalDeviceType ? toDeviceType(policy.terminalDeviceType) : terminalDeviceType,
    minSupportedAppVersion: policy?.minSupportedAppVersion ?? '',
    latestAppVersion: policy?.latestAppVersion ?? '',
    upgradeRequired: Boolean(policy?.upgradeRequired),
    upgradeRecommended: Boolean(policy?.upgradeRecommended),
    apkDownloadUrl: emptyToNull(policy?.apkDownloadUrl),
    releaseNotesUrl: emptyToNull(policy?.releaseNotesUrl),
    updatedAt: emptyToNull(policy?.updatedAt),
    updatedBy: emptyToNull(policy?.updatedBy)
  }
}

function toProtoDeviceType(value?: AdminTerminalDeviceType): TerminalDeviceType {
  return value === 'TOUCH_PANEL'
    ? TerminalDeviceType.TERMINAL_DEVICE_TYPE_KIOSK
    : TerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA
}

function toDeviceType(value?: TerminalDeviceType): AdminTerminalDeviceType {
  return value === TerminalDeviceType.TERMINAL_DEVICE_TYPE_KIOSK ? 'TOUCH_PANEL' : 'PDA'
}

function toProtoDeviceStatus(value: AdminTerminalDeviceStatus): TerminalDeviceStatus {
  return TerminalDeviceStatus[`TERMINAL_DEVICE_STATUS_${value}`]
}

function toDeviceStatus(value?: TerminalDeviceStatus): AdminTerminalDeviceStatus {
  return (enumName(value, 'TERMINAL_DEVICE_STATUS_', 'PENDING_APPROVAL') as AdminTerminalDeviceStatus)
}

function toProtoEnrollmentStatus(value: AdminEnrollmentStatus): EnrollmentStatus {
  return EnrollmentStatus[`ENROLLMENT_STATUS_${value}`]
}

function toEnrollmentStatus(value?: EnrollmentStatus): AdminEnrollmentStatus {
  return (enumName(value, 'ENROLLMENT_STATUS_', 'ISSUED') as AdminEnrollmentStatus)
}

function toProtoPresenceStatus(value: AdminPresenceStatus): PresenceStatus {
  return PresenceStatus[`PRESENCE_STATUS_${value}`] ?? PresenceStatus.PRESENCE_STATUS_UNKNOWN
}

function toPresenceStatus(value?: PresenceStatus): AdminPresenceStatus {
  const status = enumName(value, 'PRESENCE_STATUS_', 'UNKNOWN')
  return status === 'ONLINE' || status === 'OFFLINE' ? status : 'UNKNOWN'
}

function enumName(value: number | undefined, prefix: string, fallback: string): string {
  if (value === undefined || value === 0) {
    return fallback
  }
  const enumObjects = [
    TerminalDeviceStatus,
    TerminalDeviceType,
    EnrollmentStatus,
    PresenceStatus,
    NetworkStatus,
    NetworkType,
    AppState
  ] as Array<Record<number, string>>
  for (const enumObject of enumObjects) {
    const name = enumObject[value]
    if (name?.startsWith(prefix)) {
      return name.replace(prefix, '')
    }
  }
  return fallback
}

function normalize(value?: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function emptyToNull(value?: string | null): string | null {
  return normalize(value) ?? null
}

function parseDetailsJson(value?: string | null): Record<string, unknown> {
  return parseJsonObject(value) ?? {}
}

function parseJsonObject(value?: string | null): Record<string, unknown> | undefined {
  if (!value?.trim()) {
    return undefined
  }
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}
