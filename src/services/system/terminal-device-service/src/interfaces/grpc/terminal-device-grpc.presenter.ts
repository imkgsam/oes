import {
  AppState as ProtoAppState,
  DeviceAccessDecision as ProtoDeviceAccessDecision,
  DeviceAccessDecisionCode as ProtoDeviceAccessDecisionCode,
  DeviceAccessRequestPurpose as ProtoDeviceAccessRequestPurpose,
  DeviceRequiredAction as ProtoDeviceRequiredAction,
  EnrollmentStatus as ProtoEnrollmentStatus,
  NetworkStatus as ProtoNetworkStatus,
  NetworkType as ProtoNetworkType,
  PresenceStatus as ProtoPresenceStatus,
  TerminalDeviceDetail,
  TerminalDeviceEnrollment,
  TerminalDeviceIdentity,
  TerminalDeviceRuntimeSnapshot,
  TerminalDeviceStatus as ProtoTerminalDeviceStatus,
  TerminalDeviceSummary,
  TerminalDeviceType as ProtoTerminalDeviceType,
  TerminalDeviceVersionPolicy
} from '@oes/common/generated/terminal_device_service'
import { ActivateEnrollmentResult } from '../../application/commands/enrollment'
import { RecordHeartbeatResult } from '../../application/commands/runtime'
import { ChangeTerminalDeviceStatusResult, UpdateTerminalDeviceResult } from '../../application/commands/device'
import {
  ListTerminalDeviceAuditEventsResult,
  ListTerminalDevicesResult,
  TerminalDeviceSummaryProjection
} from '../../application/queries/device'
import { ListEnrollmentsResult } from '../../application/queries/enrollment'
import {
  DeviceAccessDecision,
  DeviceAccessRequestPurpose,
  DeviceAccessVersionPolicyDecision
} from '../../application/services'
import { TerminalDeviceEnrollmentEntity } from '../../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../domain/entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceVersionPolicyEntity } from '../../domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceEntity } from '../../domain/entities/terminal-device.entity'
import { TerminalDeviceAuditEventEntity } from '../../domain/entities/terminal-device-audit-event.entity'
import {
  AppState,
  EnrollmentStatus,
  NetworkStatus,
  NetworkType,
  PresenceStatus,
  TerminalDeviceStatus,
  TerminalDeviceType
} from '../../domain/enums/terminal-device.enums'
import { TerminalDeviceError } from '../../domain/errors/terminal-device.error'

type VersionPolicyLike = TerminalDeviceVersionPolicyEntity | DeviceAccessVersionPolicyDecision

// TerminalDeviceGrpcPresenter centralizes enum, date and nullable field mapping for terminal device gRPC contracts.
export class TerminalDeviceGrpcPresenter {
  // Converts proto terminal device type values into domain string enum values.
  static fromProtoTerminalDeviceType(value?: ProtoTerminalDeviceType): TerminalDeviceType {
    switch (value) {
      case ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_PDA:
        return 'PDA'
      case ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_KIOSK:
        return 'KIOSK'
      case ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_INDUSTRIAL_TABLET:
        return 'INDUSTRIAL_TABLET'
      case ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_SHARED_MOBILE_TERMINAL:
        return 'SHARED_MOBILE_TERMINAL'
      default:
        throwInvalidProtoEnum('terminalDeviceType')
    }
  }

  // Converts optional proto terminal device type filters into nullable domain values.
  static fromOptionalProtoTerminalDeviceType(value?: ProtoTerminalDeviceType): TerminalDeviceType | null {
    switch (value) {
      case undefined:
      case ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_UNSPECIFIED:
        return null
      default:
        return this.fromProtoTerminalDeviceType(value)
    }
  }

  // Converts proto lifecycle status values into domain string enum values.
  static fromProtoTerminalDeviceStatus(value?: ProtoTerminalDeviceStatus): TerminalDeviceStatus {
    switch (value) {
      case ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_PENDING_APPROVAL:
        return 'PENDING_APPROVAL'
      case ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE:
        return 'ACTIVE'
      case ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_DISABLED:
        return 'DISABLED'
      case ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_LOST:
        return 'LOST'
      case ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_MAINTENANCE:
        return 'MAINTENANCE'
      case ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_DECOMMISSIONED:
        return 'DECOMMISSIONED'
      default:
        throwInvalidProtoEnum('targetStatus')
    }
  }

  // Converts optional proto lifecycle status filters into nullable domain values.
  static fromOptionalProtoTerminalDeviceStatus(value?: ProtoTerminalDeviceStatus): TerminalDeviceStatus | null {
    switch (value) {
      case undefined:
      case ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_UNSPECIFIED:
        return null
      default:
        return this.fromProtoTerminalDeviceStatus(value)
    }
  }

  // Converts optional proto presence status filters into nullable domain values.
  static fromOptionalProtoPresenceStatus(value?: ProtoPresenceStatus): PresenceStatus | null {
    switch (value) {
      case undefined:
      case ProtoPresenceStatus.PRESENCE_STATUS_UNSPECIFIED:
        return null
      case ProtoPresenceStatus.PRESENCE_STATUS_ONLINE:
        return 'ONLINE'
      case ProtoPresenceStatus.PRESENCE_STATUS_STALE:
        return 'STALE'
      case ProtoPresenceStatus.PRESENCE_STATUS_OFFLINE:
        return 'OFFLINE'
      case ProtoPresenceStatus.PRESENCE_STATUS_UNKNOWN:
        return 'UNKNOWN'
      default:
        throwInvalidProtoEnum('presenceStatus')
    }
  }

  // Converts optional proto enrollment status filters into nullable domain values.
  static fromOptionalProtoEnrollmentStatus(value?: ProtoEnrollmentStatus): EnrollmentStatus | null {
    switch (value) {
      case undefined:
      case ProtoEnrollmentStatus.ENROLLMENT_STATUS_UNSPECIFIED:
        return null
      case ProtoEnrollmentStatus.ENROLLMENT_STATUS_ISSUED:
        return 'ISSUED'
      case ProtoEnrollmentStatus.ENROLLMENT_STATUS_USED:
        return 'USED'
      case ProtoEnrollmentStatus.ENROLLMENT_STATUS_EXPIRED:
        return 'EXPIRED'
      case ProtoEnrollmentStatus.ENROLLMENT_STATUS_REVOKED:
        return 'REVOKED'
      default:
        throwInvalidProtoEnum('enrollmentStatus')
    }
  }

  // Converts proto request purpose values into domain access decision purposes.
  static fromProtoRequestPurpose(value?: ProtoDeviceAccessRequestPurpose): DeviceAccessRequestPurpose {
    switch (value) {
      case ProtoDeviceAccessRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_ENROLLMENT:
        return 'ENROLLMENT'
      case ProtoDeviceAccessRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_LOGIN:
        return 'LOGIN'
      case ProtoDeviceAccessRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_BOOTSTRAP:
        return 'BOOTSTRAP'
      case ProtoDeviceAccessRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_BUSINESS_REQUEST:
        return 'BUSINESS_REQUEST'
      case ProtoDeviceAccessRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_HEARTBEAT:
        return 'HEARTBEAT'
      case ProtoDeviceAccessRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_DIAGNOSTIC_LOG:
        return 'DIAGNOSTIC_LOG'
      default:
        throwInvalidProtoEnum('requestPurpose')
    }
  }

  // Converts proto network status values into domain runtime status values.
  static fromProtoNetworkStatus(value?: ProtoNetworkStatus): NetworkStatus {
    switch (value) {
      case ProtoNetworkStatus.NETWORK_STATUS_ONLINE:
        return 'ONLINE'
      case ProtoNetworkStatus.NETWORK_STATUS_OFFLINE:
        return 'OFFLINE'
      case ProtoNetworkStatus.NETWORK_STATUS_UNKNOWN:
      case ProtoNetworkStatus.NETWORK_STATUS_UNSPECIFIED:
      case undefined:
        return 'UNKNOWN'
      default:
        throwInvalidProtoEnum('networkStatus')
    }
  }

  // Converts proto network type values into domain runtime network type values.
  static fromProtoNetworkType(value?: ProtoNetworkType): NetworkType {
    switch (value) {
      case ProtoNetworkType.NETWORK_TYPE_WIFI:
        return 'WIFI'
      case ProtoNetworkType.NETWORK_TYPE_CELLULAR:
        return 'CELLULAR'
      case ProtoNetworkType.NETWORK_TYPE_ETHERNET:
        return 'ETHERNET'
      case ProtoNetworkType.NETWORK_TYPE_NONE:
        return 'NONE'
      case ProtoNetworkType.NETWORK_TYPE_UNKNOWN:
      case ProtoNetworkType.NETWORK_TYPE_UNSPECIFIED:
      case undefined:
        return 'UNKNOWN'
      default:
        throwInvalidProtoEnum('networkType')
    }
  }

  // Converts proto app state values into domain runtime app state values.
  static fromProtoAppState(value?: ProtoAppState): AppState {
    switch (value) {
      case ProtoAppState.APP_STATE_FOREGROUND:
        return 'FOREGROUND'
      case ProtoAppState.APP_STATE_BACKGROUND:
        return 'BACKGROUND'
      case ProtoAppState.APP_STATE_CLOSED:
        return 'CLOSED'
      case ProtoAppState.APP_STATE_UNKNOWN:
      case ProtoAppState.APP_STATE_UNSPECIFIED:
      case undefined:
        return 'UNKNOWN'
      default:
        throwInvalidProtoEnum('appState')
    }
  }

  // Presents enrollment output while protecting nullable fields from leaking nulls.
  static toEnrollment(input: Partial<TerminalDeviceEnrollmentEntity> & {
    enrollmentId: string
    tenantId?: string
    terminalDeviceType?: TerminalDeviceType
    displayName?: string
    status?: EnrollmentStatus
  }): TerminalDeviceEnrollment {
    return {
      enrollmentId: input.enrollmentId,
      tenantId: input.tenantId ?? '',
      terminalDeviceType: input.terminalDeviceType ? toProtoTerminalDeviceType(input.terminalDeviceType) : ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_UNSPECIFIED,
      displayName: input.displayName ?? '',
      status: input.status ? toProtoEnrollmentStatus(input.status) : ProtoEnrollmentStatus.ENROLLMENT_STATUS_UNSPECIFIED,
      expectedManufacturerSerial: input.expectedManufacturerSerial ?? '',
      expiresAt: toIsoString(input.expiresAt),
      usedAt: toIsoString(input.usedAt),
      usedByTerminalDeviceId: input.usedByTerminalDeviceId ?? '',
      revokedAt: toIsoString(input.revokedAt),
      revokedBy: input.revokedBy ?? '',
      createdBy: input.createdBy ?? '',
      createdAt: toIsoString(input.createdAt),
      notes: input.notes ?? ''
    }
  }

  // Presents an enrollment list page without exposing enrollment code secrets.
  static toListEnrollments(result: ListEnrollmentsResult): {
    items: TerminalDeviceEnrollment[]
    pagination: { page: number; pageSize: number; total: number }
  } {
    return {
      items: result.items.map((item) => this.toEnrollment(item)),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }
    }
  }

  // Presents activation command output in the generated gRPC response shape.
  static toActivationResult(result: ActivateEnrollmentResult): {
    activated: boolean
    terminalDeviceId: string
    tenantId: string
    terminalDeviceType: ProtoTerminalDeviceType
    deviceStatus: ProtoTerminalDeviceStatus
    enrollmentId: string
    decisionCode: ProtoDeviceAccessDecisionCode
  } {
    return {
      activated: result.activated,
      terminalDeviceId: result.terminalDeviceId ?? '',
      tenantId: result.tenantId ?? '',
      terminalDeviceType: result.terminalDeviceType
        ? toProtoTerminalDeviceType(result.terminalDeviceType)
        : ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_UNSPECIFIED,
      deviceStatus: result.deviceStatus
        ? toProtoTerminalDeviceStatus(result.deviceStatus)
        : ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_UNSPECIFIED,
      enrollmentId: result.enrollmentId ?? '',
      decisionCode: toProtoAccessDecisionCode(result.decisionCode)
    }
  }

  // Presents access decision output in the generated gRPC response shape.
  static toDeviceAccessDecision(decision: DeviceAccessDecision): ProtoDeviceAccessDecision {
    return {
      allowed: decision.allowed,
      decisionCode: toProtoAccessDecisionCode(decision.decisionCode),
      resolvedTenantId: decision.resolvedTenantId ?? '',
      terminalDeviceId: decision.terminalDeviceId ?? '',
      terminalDeviceType: decision.terminalDeviceType
        ? toProtoTerminalDeviceType(decision.terminalDeviceType)
        : ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_UNSPECIFIED,
      deviceStatus: decision.deviceStatus
        ? toProtoTerminalDeviceStatus(decision.deviceStatus)
        : ProtoTerminalDeviceStatus.TERMINAL_DEVICE_STATUS_UNSPECIFIED,
      presenceStatus: toProtoPresenceStatus(decision.presenceStatus),
      versionPolicy: decision.versionPolicy ? this.toVersionPolicy(decision.versionPolicy, decision.resolvedTenantId, decision.terminalDeviceType) : undefined,
      requiredAction: toProtoRequiredAction(decision.requiredAction),
      messageKey: decision.messageKey ?? '',
      shouldClearLocalSession: decision.shouldClearLocalSession,
      shouldClearLocalTerminalDeviceId: decision.shouldClearLocalTerminalDeviceId,
      shouldRevokeServerSessions: decision.shouldRevokeServerSessions
    }
  }

  // Presents heartbeat command output using the compact heartbeat response contract.
  static toHeartbeatResult(result: RecordHeartbeatResult): {
    accepted: boolean
    terminalDeviceId: string
    lastHeartbeatAt: string
    presenceStatus: ProtoPresenceStatus
  } {
    return {
      accepted: result.decision.allowed,
      terminalDeviceId: result.snapshot.terminalDeviceId,
      lastHeartbeatAt: result.snapshot.lastHeartbeatAt.toISOString(),
      presenceStatus: toProtoPresenceStatus(result.snapshot.presenceStatus)
    }
  }

  // Presents a version policy entity or decision projection as generated gRPC policy output.
  static toVersionPolicy(
    policy: VersionPolicyLike,
    tenantId?: string | null,
    terminalDeviceType?: TerminalDeviceType | null
  ): TerminalDeviceVersionPolicy {
    return {
      tenantId: 'tenantId' in policy ? policy.tenantId : tenantId ?? '',
      terminalDeviceType: 'terminalDeviceType' in policy
        ? toProtoTerminalDeviceType(policy.terminalDeviceType)
        : terminalDeviceType
          ? toProtoTerminalDeviceType(terminalDeviceType)
          : ProtoTerminalDeviceType.TERMINAL_DEVICE_TYPE_UNSPECIFIED,
      minSupportedAppVersion: policy.minSupportedAppVersion,
      latestAppVersion: policy.latestAppVersion,
      upgradeRequired: policy.upgradeRequired,
      upgradeRecommended: policy.upgradeRecommended,
      apkDownloadUrl: policy.apkDownloadUrl ?? '',
      releaseNotesUrl: policy.releaseNotesUrl ?? '',
      updatedAt: 'updatedAt' in policy ? toIsoString(policy.updatedAt) : '',
      updatedBy: 'updatedBy' in policy ? policy.updatedBy : ''
    }
  }

  // Presents a terminal device list page as generated gRPC summary output.
  static toListTerminalDevices(result: ListTerminalDevicesResult): {
    items: TerminalDeviceSummary[]
    pagination: { page: number; pageSize: number; total: number }
  } {
    return {
      items: result.items.map((item) => this.toTerminalDeviceSummary(item)),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }
    }
  }

  // Presents one terminal device summary with latest runtime snapshot fields.
  static toTerminalDeviceSummary(projection: TerminalDeviceSummaryProjection): TerminalDeviceSummary {
    const { device, runtime } = projection
    return {
      terminalDeviceId: device.terminalDeviceId,
      tenantId: device.tenantId,
      terminalDeviceType: toProtoTerminalDeviceType(device.terminalDeviceType),
      displayName: device.displayName,
      status: toProtoTerminalDeviceStatus(device.status),
      presenceStatus: toProtoPresenceStatus(runtime?.presenceStatus ?? 'UNKNOWN'),
      appVersion: runtime?.appVersion ?? '',
      androidVersion: runtime?.androidVersion ?? device.androidVersion ?? '',
      manufacturer: device.manufacturer ?? '',
      model: device.model ?? '',
      lastHeartbeatAt: toIsoString(runtime?.lastHeartbeatAt),
      lastReportedAccountId: runtime?.lastReportedAccountId ?? '',
      registeredAt: device.registeredAt.toISOString(),
      enrollmentId: device.enrollmentId ?? ''
    }
  }

  // Presents terminal device detail including nullable fields as safe strings.
  static toTerminalDeviceDetail(device: TerminalDeviceEntity): TerminalDeviceDetail {
    return {
      terminalDeviceId: device.terminalDeviceId,
      tenantId: device.tenantId,
      terminalDeviceType: toProtoTerminalDeviceType(device.terminalDeviceType),
      displayName: device.displayName,
      status: toProtoTerminalDeviceStatus(device.status),
      statusReason: device.statusReason ?? '',
      registeredAt: device.registeredAt.toISOString(),
      enrollmentId: device.enrollmentId ?? '',
      notes: device.notes ?? ''
    }
  }

  // Presents a non-lifecycle update command result in the generated gRPC response shape.
  static toUpdateTerminalDeviceResult(result: UpdateTerminalDeviceResult): {
    terminalDeviceId: string
    displayName: string
    notes: string
    updatedAt: string
  } {
    return {
      terminalDeviceId: result.terminalDeviceId,
      displayName: result.displayName,
      notes: result.notes ?? '',
      updatedAt: result.updatedAt.toISOString()
    }
  }

  // Presents terminal device identity signals with sensitive fields masked unless explicitly included.
  static toTerminalDeviceIdentity(device: TerminalDeviceEntity, includeSensitiveIdentity: boolean): TerminalDeviceIdentity {
    return {
      manufacturerSerial: includeSensitiveIdentity ? device.manufacturerSerial ?? '' : '',
      androidId: includeSensitiveIdentity ? device.androidId ?? '' : '',
      appInstallationId: includeSensitiveIdentity ? device.appInstallationId ?? '' : '',
      manufacturer: device.manufacturer ?? '',
      model: device.model ?? '',
      manufacturerSerialMasked: maskIdentitySignal(device.manufacturerSerial),
      androidIdMasked: maskIdentitySignal(device.androidId)
    }
  }

  // Presents the current runtime snapshot with unknown defaults for absent status fields.
  static toRuntimeSnapshot(snapshot: TerminalDeviceRuntimeSnapshotEntity | null): TerminalDeviceRuntimeSnapshot | undefined {
    if (!snapshot) {
      return undefined
    }

    return {
      terminalDeviceId: snapshot.terminalDeviceId,
      presenceStatus: toProtoPresenceStatus(snapshot.presenceStatus),
      lastHeartbeatAt: snapshot.lastHeartbeatAt.toISOString(),
      lastClientTime: toIsoString(snapshot.lastClientTime),
      appVersion: snapshot.appVersion ?? '',
      androidVersion: snapshot.androidVersion ?? '',
      webViewVersion: snapshot.webViewVersion ?? '',
      networkStatus: toProtoNetworkStatus(snapshot.networkStatus),
      networkType: toProtoNetworkType(snapshot.networkType),
      batteryLevel: snapshot.batteryLevel ?? undefined,
      appState: toProtoAppState(snapshot.appState),
      lastReportedAccountId: snapshot.lastReportedAccountId ?? '',
      lastReportedSessionId: snapshot.lastReportedSessionId ?? ''
    }
  }

  // Presents a terminal device governance audit page as generated gRPC output.
  static toListTerminalDeviceAuditEvents(result: ListTerminalDeviceAuditEventsResult): {
    items: ReturnType<typeof TerminalDeviceGrpcPresenter.toAuditEvent>[]
    pagination: { page: number; pageSize: number; total: number }
  } {
    return {
      items: result.items.map((item) => this.toAuditEvent(item)),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }
    }
  }

  // Presents one governance audit event with JSON payloads serialized for gRPC clients.
  static toAuditEvent(event: TerminalDeviceAuditEventEntity): {
    auditEventId: string
    tenantId: string
    operatorAccountId: string
    operatorOrgId: string
    action: string
    targetTerminalDeviceId: string
    beforeJson: string
    afterJson: string
    reason: string
    traceId: string
    occurredAt: string
  } {
    return {
      auditEventId: event.auditEventId,
      tenantId: event.tenantId,
      operatorAccountId: event.operatorAccountId,
      operatorOrgId: event.operatorOrgId ?? '',
      action: event.action,
      targetTerminalDeviceId: event.targetTerminalDeviceId ?? '',
      beforeJson: event.beforeJson ? JSON.stringify(event.beforeJson) : '',
      afterJson: event.afterJson ? JSON.stringify(event.afterJson) : '',
      reason: event.reason ?? '',
      traceId: event.traceId ?? '',
      occurredAt: event.occurredAt.toISOString()
    }
  }

  // Presents lifecycle transition output including the external session revoke intent contract.
  static toChangeStatusResult(result: ChangeTerminalDeviceStatusResult): {
    terminalDeviceId: string
    previousStatus: ProtoTerminalDeviceStatus
    status: ProtoTerminalDeviceStatus
    statusReason: string
    changedAt: string
    sessionRevokeIntent: { required: boolean; sessionTerminal: string; terminalDeviceId: string }
  } {
    return {
      terminalDeviceId: result.terminalDeviceId,
      previousStatus: toProtoTerminalDeviceStatus(result.previousStatus),
      status: toProtoTerminalDeviceStatus(result.deviceStatus),
      statusReason: result.statusReason ?? '',
      changedAt: result.changedAt.toISOString(),
      sessionRevokeIntent: {
        required: result.sessionRevokeIntent?.shouldRevokeServerSessions ?? false,
        sessionTerminal: result.sessionRevokeIntent?.terminal ?? 'PDA',
        terminalDeviceId: result.sessionRevokeIntent?.terminalDeviceId ?? result.terminalDeviceId
      }
    }
  }
}

// toProtoTerminalDeviceType maps domain terminal device type values into generated enum values.
function toProtoTerminalDeviceType(value: TerminalDeviceType): ProtoTerminalDeviceType {
  return ProtoTerminalDeviceType[`TERMINAL_DEVICE_TYPE_${value}`]
}

// toProtoTerminalDeviceStatus maps domain lifecycle status values into generated enum values.
function toProtoTerminalDeviceStatus(value: TerminalDeviceStatus): ProtoTerminalDeviceStatus {
  return ProtoTerminalDeviceStatus[`TERMINAL_DEVICE_STATUS_${value}`]
}

// toProtoEnrollmentStatus maps domain enrollment status values into generated enum values.
function toProtoEnrollmentStatus(value: EnrollmentStatus): ProtoEnrollmentStatus {
  return ProtoEnrollmentStatus[`ENROLLMENT_STATUS_${value}`]
}

// toProtoPresenceStatus maps domain presence status values into generated enum values.
function toProtoPresenceStatus(value: PresenceStatus): ProtoPresenceStatus {
  return ProtoPresenceStatus[`PRESENCE_STATUS_${value}`]
}

// toProtoNetworkStatus maps domain network status values into generated enum values.
function toProtoNetworkStatus(value: NetworkStatus): ProtoNetworkStatus {
  return ProtoNetworkStatus[`NETWORK_STATUS_${value}`]
}

// toProtoNetworkType maps domain network type values into generated enum values.
function toProtoNetworkType(value: NetworkType): ProtoNetworkType {
  return ProtoNetworkType[`NETWORK_TYPE_${value}`]
}

// toProtoAppState maps domain app state values into generated enum values.
function toProtoAppState(value: AppState): ProtoAppState {
  return ProtoAppState[`APP_STATE_${value}`]
}

// toProtoAccessDecisionCode maps application access and activation decisions into generated enum values.
function toProtoAccessDecisionCode(value: string): ProtoDeviceAccessDecisionCode {
  switch (value) {
    case 'ALLOW':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_ALLOW
    case 'ENROLLMENT_REQUIRED':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_ENROLLMENT_REQUIRED
    case 'DEVICE_PENDING_APPROVAL':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_DEVICE_PENDING_APPROVAL
    case 'DEVICE_DISABLED':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_DEVICE_DISABLED
    case 'DEVICE_LOST':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_DEVICE_LOST
    case 'DEVICE_MAINTENANCE':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_DEVICE_MAINTENANCE
    case 'DEVICE_DECOMMISSIONED':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_DEVICE_DECOMMISSIONED
    case 'APP_VERSION_UNSUPPORTED':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_APP_VERSION_UNSUPPORTED
    case 'DEVICE_IDENTITY_CONFLICT':
    case 'EXPECTED_SERIAL_MISMATCH':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_DEVICE_IDENTITY_CONFLICT
    case 'TERMINAL_DEVICE_NOT_FOUND':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_TERMINAL_DEVICE_NOT_FOUND
    case 'INVALID_TERMINAL_DEVICE_TYPE':
    case 'ENROLLMENT_TYPE_MISMATCH':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_INVALID_TERMINAL_DEVICE_TYPE
    case 'ENROLLMENT_EXPIRED':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_ENROLLMENT_EXPIRED
    case 'ENROLLMENT_USED':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_ENROLLMENT_USED
    case 'ENROLLMENT_REVOKED':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_ENROLLMENT_REVOKED
    case 'ENROLLMENT_NOT_FOUND':
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_ENROLLMENT_INVALID
    default:
      return ProtoDeviceAccessDecisionCode.DEVICE_ACCESS_DECISION_CODE_UNSPECIFIED
  }
}

// toProtoRequiredAction maps application required actions into generated enum values.
function toProtoRequiredAction(value: string): ProtoDeviceRequiredAction {
  switch (value) {
    case 'NONE':
      return ProtoDeviceRequiredAction.DEVICE_REQUIRED_ACTION_NONE
    case 'ENROLL_DEVICE':
      return ProtoDeviceRequiredAction.DEVICE_REQUIRED_ACTION_ENROLL_DEVICE
    case 'CONTACT_ADMIN':
      return ProtoDeviceRequiredAction.DEVICE_REQUIRED_ACTION_CONTACT_ADMIN
    case 'CLEAR_LOCAL_SESSION':
      return ProtoDeviceRequiredAction.DEVICE_REQUIRED_ACTION_CLEAR_LOCAL_SESSION
    case 'CLEAR_LOCAL_DEVICE_AND_SESSION':
      return ProtoDeviceRequiredAction.DEVICE_REQUIRED_ACTION_CLEAR_LOCAL_DEVICE_AND_SESSION
    case 'UPGRADE_APP':
      return ProtoDeviceRequiredAction.DEVICE_REQUIRED_ACTION_UPGRADE_APP
    default:
      return ProtoDeviceRequiredAction.DEVICE_REQUIRED_ACTION_UNSPECIFIED
  }
}

// toIsoString converts nullable dates into the service's empty-string absent field convention.
function toIsoString(value?: Date | null): string {
  return value ? value.toISOString() : ''
}

// maskIdentitySignal keeps only the last four characters without leaking the original signal length.
function maskIdentitySignal(value?: string | null): string {
  if (!value) {
    return ''
  }
  return `********${value.slice(-4)}`
}

// throwInvalidProtoEnum rejects unsafe UNSPECIFIED or unknown enum inputs with a stable service error.
function throwInvalidProtoEnum(fieldName: string): never {
  throw new TerminalDeviceError('UNSUPPORTED_TERMINAL_DEVICE_TYPE', `${fieldName} is required or unsupported`)
}
