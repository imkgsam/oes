import { Injectable, OnModuleInit } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  ActivateEnrollmentResponse,
  DeviceAccessDecisionCode,
  DeviceAccessRequestPurpose,
  DeviceRequiredAction,
  PresenceStatus,
  RecordHeartbeatResponse,
  RecordDiagnosticLogsResponse,
  ResolveDeviceAccessDecisionResponse,
  TERMINAL_DEVICE_ACCESS_DECISION_SERVICE_NAME,
  TERMINAL_DEVICE_ENROLLMENT_SERVICE_NAME,
  TERMINAL_DEVICE_RUNTIME_SNAPSHOT_SERVICE_NAME,
  TerminalDeviceAccessDecisionServiceClient,
  TerminalDeviceEnrollmentServiceClient,
  TerminalDeviceIdentity,
  TerminalDeviceRuntime,
  TerminalDeviceRuntimeSnapshotServiceClient,
  TerminalDeviceSoftware,
  TerminalDeviceStatus,
  TerminalDeviceType,
  TerminalDeviceVersionPolicy
} from '@oes/common/generated/terminal_device_service'
import {
  PdaDeviceAccessDecision,
  PdaManagedDeviceDescriptor,
  PdaVersionPolicy
} from '../../../interfaces/http/view-models/pda-device.view-model'

const CALLER = 'api-gateway'

export type PdaDeviceAccessPurpose =
  | 'BOOTSTRAP'
  | 'DIAGNOSTIC_LOG'
  | 'ENROLLMENT'
  | 'HEARTBEAT'
  | 'LOGIN'

export interface PdaActivateEnrollmentInput {
  enrollmentCode: string
  device: PdaManagedDeviceDescriptor
  traceId?: string
}

export interface PdaActivateEnrollmentResult {
  activated: boolean
  terminalDeviceId: string | null
  tenantId: string | null
  terminalDeviceType: 'PDA' | null
  deviceStatus: string | null
  decisionCode: string
}

export interface PdaResolveDecisionInput {
  tenantId?: string | null
  terminalDeviceId?: string | null
  requestPurpose: PdaDeviceAccessPurpose
  device?: PdaManagedDeviceDescriptor
  session?: { accountId?: string | null; sessionId?: string | null } | null
  traceId?: string
}

export interface PdaRecordHeartbeatInput {
  tenantId?: string | null
  terminalDeviceId: string
  device: PdaManagedDeviceDescriptor
  runtime: {
    networkStatus: 'OFFLINE' | 'ONLINE'
    networkType?: string
    batteryLevel?: number
    appState: string
  }
  session?: { accountId?: string | null; sessionId?: string | null } | null
  clientTime: string
  traceId?: string
}

export interface PdaRecordHeartbeatResult {
  accepted: boolean
  terminalDeviceId: string | null
  lastHeartbeatAt: string | null
  presenceStatus: string | null
  heartbeatIntervalSeconds: number
}

export interface PdaDiagnosticLogRecordInput {
  deviceId: string
  accountId: string | null
  tenantId: string | null
  sessionId: string | null
  clientTime: string
  receivedAt: string
  level: 'ERROR' | 'INFO' | 'WARN'
  eventType: string
  message: string
  traceId: string | null
  requestId: string | null
  errorCode: string | null
  diagnosticMode: boolean
  details: Record<string, unknown>
}

export interface PdaRecordDiagnosticLogsInput {
  tenantId: string
  terminalDeviceId: string
  records: PdaDiagnosticLogRecordInput[]
}

export interface PdaRecordDiagnosticLogsResult {
  accepted: boolean
  receivedCount: number
}

@Injectable()
// Bridges PDA BFF use cases to terminal-device-service without owning device registry or lifecycle rules.
export class PdaTerminalDeviceAdapter implements OnModuleInit {
  private enrollmentSvc!: TerminalDeviceEnrollmentServiceClient
  private decisionSvc!: TerminalDeviceAccessDecisionServiceClient
  private runtimeSvc!: TerminalDeviceRuntimeSnapshotServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.TERMINAL_DEVICE)
    private readonly client: ClientGrpc
  ) {}

  onModuleInit(): void {
    this.enrollmentSvc = this.client.getService<TerminalDeviceEnrollmentServiceClient>(
      TERMINAL_DEVICE_ENROLLMENT_SERVICE_NAME
    )
    this.decisionSvc = this.client.getService<TerminalDeviceAccessDecisionServiceClient>(
      TERMINAL_DEVICE_ACCESS_DECISION_SERVICE_NAME
    )
    this.runtimeSvc = this.client.getService<TerminalDeviceRuntimeSnapshotServiceClient>(
      TERMINAL_DEVICE_RUNTIME_SNAPSHOT_SERVICE_NAME
    )
  }

  // Activates an administrator-issued enrollment code through terminal-device-service.
  async activateEnrollment(input: PdaActivateEnrollmentInput): Promise<PdaActivateEnrollmentResult> {
    const response = await safeGrpcCall<ActivateEnrollmentResponse>(
      this.enrollmentSvc.activateEnrollment({
        enrollmentCode: input.enrollmentCode,
        terminalDeviceType: TerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA,
        identity: toIdentity(input.device),
        software: toSoftware(input.device),
        traceId: input.traceId
      }, new Metadata()),
      this.opts('activateEnrollment')
    )

    return {
      activated: Boolean(response.activated),
      terminalDeviceId: normalize(response.terminalDeviceId) ?? null,
      tenantId: normalize(response.tenantId) ?? null,
      terminalDeviceType: response.terminalDeviceType === TerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA ? 'PDA' : null,
      deviceStatus: toStatus(response.deviceStatus),
      decisionCode: toDecisionCode(response.decisionCode)
    }
  }

  // Resolves the central device governance decision for one PDA request purpose.
  async resolveDeviceAccessDecision(input: PdaResolveDecisionInput): Promise<PdaDeviceAccessDecision> {
    const response = await safeGrpcCall<ResolveDeviceAccessDecisionResponse>(
      this.decisionSvc.resolveDeviceAccessDecision({
        tenantId: normalize(input.tenantId),
        terminalDeviceId: normalize(input.terminalDeviceId ?? input.device?.terminalDeviceId),
        terminalDeviceType: TerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA,
        requestPurpose: toPurpose(input.requestPurpose),
        appVersion: normalize(input.device?.software.appVersion),
        identity: input.device ? toIdentity(input.device) : undefined,
        session: input.session
          ? {
              accountId: normalize(input.session.accountId),
              sessionId: normalize(input.session.sessionId)
            }
          : undefined,
        traceId: normalize(input.traceId)
      }, new Metadata()),
      this.opts('resolveDeviceAccessDecision')
    )

    return toDeviceAccessDecision(response.decision)
  }

  // Records the latest PDA runtime heartbeat snapshot through terminal-device-service.
  async recordHeartbeat(input: PdaRecordHeartbeatInput): Promise<PdaRecordHeartbeatResult> {
    const response = await safeGrpcCall<RecordHeartbeatResponse>(
      this.runtimeSvc.recordHeartbeat({
        tenantId: normalize(input.tenantId),
        terminalDeviceId: input.terminalDeviceId,
        terminalDeviceType: TerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA,
        identity: toIdentity(input.device),
        software: toSoftware(input.device),
        runtime: toRuntime(input.runtime),
        reportedSession: input.session
          ? {
              accountId: normalize(input.session.accountId),
              sessionId: normalize(input.session.sessionId)
            }
          : undefined,
        clientTime: input.clientTime,
        receivedAt: new Date().toISOString(),
        traceId: normalize(input.traceId)
      }, new Metadata()),
      this.opts('recordHeartbeat')
    )

    return {
      accepted: Boolean(response.accepted),
      terminalDeviceId: normalize(response.terminalDeviceId) ?? null,
      lastHeartbeatAt: normalize(response.lastHeartbeatAt) ?? null,
      presenceStatus: toPresenceStatus(response.presenceStatus),
      heartbeatIntervalSeconds: 300
    }
  }

  // Persists sanitized manual PDA diagnostic logs through terminal-device-service.
  async recordDiagnosticLogs(input: PdaRecordDiagnosticLogsInput): Promise<PdaRecordDiagnosticLogsResult> {
    const response = await safeGrpcCall<RecordDiagnosticLogsResponse>(
      this.runtimeSvc.recordDiagnosticLogs({
        tenantId: input.tenantId,
        terminalDeviceId: input.terminalDeviceId,
        logs: input.records.map((record) => ({
          terminalDeviceId: input.terminalDeviceId,
          tenantId: input.tenantId,
          accountId: normalize(record.accountId),
          sessionId: normalize(record.sessionId),
          clientTime: record.clientTime,
          receivedAt: record.receivedAt,
          level: record.level,
          eventType: record.eventType,
          message: record.message,
          traceId: normalize(record.traceId),
          requestId: normalize(record.requestId),
          errorCode: normalize(record.errorCode),
          diagnosticMode: record.diagnosticMode,
          detailsJson: JSON.stringify(record.details)
        }))
      }, new Metadata()),
      this.opts('recordDiagnosticLogs')
    )

    return {
      accepted: Boolean(response.accepted),
      receivedCount: Number(response.receivedCount ?? 0)
    }
  }

  // Builds safe gRPC call metadata for PDA terminal-device diagnostics.
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

// Maps the PDA HTTP device descriptor into terminal-device-service identity signals.
function toIdentity(device: PdaManagedDeviceDescriptor): TerminalDeviceIdentity {
  return {
    manufacturerSerial: normalize(device.identity.manufacturerSerial),
    androidId: normalize(device.identity.androidId),
    appInstallationId: normalize(device.identity.appInstallationId),
    manufacturer: normalize(device.identity.manufacturer),
    model: normalize(device.identity.model)
  }
}

// Maps the PDA HTTP device descriptor into terminal-device-service software facts.
function toSoftware(device: PdaManagedDeviceDescriptor): TerminalDeviceSoftware {
  return {
    androidVersion: normalize(device.software.androidVersion),
    webViewVersion: normalize(device.software.webViewVersion),
    appVersion: normalize(device.software.appVersion)
  }
}

// Maps PDA runtime strings into terminal-device-service runtime enums.
function toRuntime(runtime: PdaRecordHeartbeatInput['runtime']): TerminalDeviceRuntime {
  return {
    networkStatus:
      runtime.networkStatus === 'ONLINE'
        ? 1
        : 2,
    networkType: toNetworkType(runtime.networkType),
    batteryLevel: runtime.batteryLevel,
    appState: toAppState(runtime.appState)
  }
}

function toPurpose(purpose: PdaDeviceAccessPurpose): DeviceAccessRequestPurpose {
  return DeviceAccessRequestPurpose[`DEVICE_ACCESS_REQUEST_PURPOSE_${purpose}`]
}

function toNetworkType(value?: string): number {
  switch (value) {
    case 'CELLULAR':
      return 2
    case 'ETHERNET':
      return 3
    case 'NONE':
      return 4
    case 'WIFI':
      return 1
    default:
      return 5
  }
}

function toAppState(value: string): number {
  switch (value) {
    case 'BACKGROUND':
      return 2
    case 'CLOSED':
    case 'LOGOUT':
      return 3
    case 'FOREGROUND':
    case 'LOGIN':
    case 'SESSION_RESTORED':
      return 1
    default:
      return 4
  }
}

function toDeviceAccessDecision(decision?: {
  allowed?: boolean
  decisionCode?: DeviceAccessDecisionCode
  resolvedTenantId?: string
  terminalDeviceId?: string
  terminalDeviceType?: TerminalDeviceType
  deviceStatus?: TerminalDeviceStatus
  presenceStatus?: PresenceStatus
  versionPolicy?: TerminalDeviceVersionPolicy
  requiredAction?: DeviceRequiredAction
  messageKey?: string
  shouldClearLocalSession?: boolean
  shouldClearLocalTerminalDeviceId?: boolean
}): PdaDeviceAccessDecision {
  return {
    allowed: Boolean(decision?.allowed),
    decisionCode: toDecisionCode(decision?.decisionCode),
    resolvedTenantId: normalize(decision?.resolvedTenantId) ?? null,
    terminalDeviceId: normalize(decision?.terminalDeviceId) ?? null,
    terminalDeviceType: decision?.terminalDeviceType === TerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA ? 'PDA' : null,
    deviceStatus: toStatus(decision?.deviceStatus),
    presenceStatus: toPresenceStatus(decision?.presenceStatus),
    versionPolicy: decision?.versionPolicy ? toVersionPolicy(decision.versionPolicy) : null,
    requiredAction: toRequiredAction(decision?.requiredAction),
    messageKey: normalize(decision?.messageKey) ?? null,
    shouldClearLocalSession: Boolean(decision?.shouldClearLocalSession),
    shouldClearLocalTerminalDeviceId: Boolean(decision?.shouldClearLocalTerminalDeviceId)
  }
}

function toVersionPolicy(policy: TerminalDeviceVersionPolicy): PdaVersionPolicy {
  return {
    minSupportedAppVersion: normalize(policy.minSupportedAppVersion) ?? '',
    latestAppVersion: normalize(policy.latestAppVersion) ?? '',
    upgradeRequired: Boolean(policy.upgradeRequired),
    upgradeRecommended: Boolean(policy.upgradeRecommended),
    apkDownloadUrl: normalize(policy.apkDownloadUrl) ?? null,
    releaseNotesUrl: normalize(policy.releaseNotesUrl) ?? null
  }
}

function toDecisionCode(value?: DeviceAccessDecisionCode): string {
  return enumName(DeviceAccessDecisionCode, value, 'DEVICE_ACCESS_DECISION_CODE_', 'ENROLLMENT_INVALID')
}

function toRequiredAction(value?: DeviceRequiredAction): string {
  return enumName(DeviceRequiredAction, value, 'DEVICE_REQUIRED_ACTION_', 'CONTACT_ADMIN')
}

function toStatus(value?: TerminalDeviceStatus): string | null {
  const status = enumName(TerminalDeviceStatus, value, 'TERMINAL_DEVICE_STATUS_', '')
  return status || null
}

function toPresenceStatus(value?: PresenceStatus): 'OFFLINE' | 'ONLINE' | 'UNKNOWN' {
  const status = enumName(PresenceStatus, value, 'PRESENCE_STATUS_', 'UNKNOWN')
  return status === 'ONLINE' ? 'ONLINE' : status === 'OFFLINE' ? 'OFFLINE' : 'UNKNOWN'
}

function enumName(
  enumObject: Record<number, string>,
  value: number | undefined,
  prefix: string,
  fallback: string
): string {
  if (value === undefined || value === 0) {
    return fallback
  }
  return enumObject[value]?.replace(prefix, '') ?? fallback
}

function normalize(value?: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
