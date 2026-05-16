import { Inject, Injectable } from '@nestjs/common'
import { SYMBOLS } from '../../common/constants/symbols'
import { TerminalDeviceVersionPolicyEntity } from '../../domain/entities/terminal-device-version-policy.entity'
import { PresenceStatus, TerminalDeviceStatus, TerminalDeviceType } from '../../domain/enums/terminal-device.enums'
import { TerminalDeviceRepository } from '../../domain/repositories/terminal-device.repository'
import { TerminalDeviceRuntimeSnapshotRepository } from '../../domain/repositories/terminal-device-runtime-snapshot.repository'
import { TerminalDeviceVersionPolicyRepository } from '../../domain/repositories/terminal-device-version-policy.repository'

export type DeviceAccessRequestPurpose =
  | 'ENROLLMENT'
  | 'LOGIN'
  | 'BOOTSTRAP'
  | 'BUSINESS_REQUEST'
  | 'HEARTBEAT'
  | 'DIAGNOSTIC_LOG'

export type DeviceAccessDecisionCode =
  | 'ALLOW'
  | 'ENROLLMENT_REQUIRED'
  | 'DEVICE_PENDING_APPROVAL'
  | 'DEVICE_DISABLED'
  | 'DEVICE_LOST'
  | 'DEVICE_MAINTENANCE'
  | 'DEVICE_DECOMMISSIONED'
  | 'APP_VERSION_UNSUPPORTED'
  | 'DEVICE_IDENTITY_CONFLICT'
  | 'TERMINAL_DEVICE_NOT_FOUND'
  | 'INVALID_TERMINAL_DEVICE_TYPE'

export type DeviceAccessRequiredAction =
  | 'NONE'
  | 'ENROLL_DEVICE'
  | 'CONTACT_ADMIN'
  | 'CLEAR_LOCAL_SESSION'
  | 'CLEAR_LOCAL_DEVICE_AND_SESSION'
  | 'UPGRADE_APP'

export interface DeviceAccessVersionPolicyDecision {
  minSupportedAppVersion: string
  latestAppVersion: string
  upgradeRequired: boolean
  upgradeRecommended: boolean
  apkDownloadUrl: string | null
  releaseNotesUrl: string | null
}

export interface ResolveDeviceAccessDecisionInput {
  tenantId?: string | null
  terminalDeviceId?: string | null
  terminalDeviceType: TerminalDeviceType
  requestPurpose: DeviceAccessRequestPurpose
  appVersion?: string | null
  now?: Date
}

export interface DeviceAccessDecision {
  allowed: boolean
  decisionCode: DeviceAccessDecisionCode
  resolvedTenantId: string | null
  terminalDeviceId: string | null
  terminalDeviceType: TerminalDeviceType | null
  deviceStatus: TerminalDeviceStatus | null
  presenceStatus: PresenceStatus
  versionPolicy: DeviceAccessVersionPolicyDecision | null
  requiredAction: DeviceAccessRequiredAction
  messageKey: string | null
  shouldClearLocalSession: boolean
  shouldClearLocalTerminalDeviceId: boolean
  shouldRevokeServerSessions: boolean
}

interface VersionDecision {
  allowedForStrictPurpose: boolean
  decisionCode: 'ALLOW' | 'APP_VERSION_UNSUPPORTED'
  requiredAction: 'NONE' | 'UPGRADE_APP'
  versionPolicy: DeviceAccessVersionPolicyDecision | null
}

@Injectable()
// DeviceAccessDecisionService centralizes lifecycle, presence and version policy decisions for managed terminal requests.
export class DeviceAccessDecisionService {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository,
    @Inject(SYMBOLS.REPO.VERSION_POLICY)
    private readonly versionPolicyRepository: TerminalDeviceVersionPolicyRepository
  ) {}

  // Resolves the service-owned access decision without leaking lifecycle or version rules to callers.
  async resolve(input: ResolveDeviceAccessDecisionInput): Promise<DeviceAccessDecision> {
    if (input.terminalDeviceType !== 'PDA') {
      return deniedWithoutDevice('INVALID_TERMINAL_DEVICE_TYPE', input.tenantId ?? null)
    }

    if (!input.terminalDeviceId) {
      return deniedWithoutDevice('ENROLLMENT_REQUIRED', input.tenantId ?? null)
    }

    const device = await this.terminalDeviceRepository.findById(input.terminalDeviceId)
    if (!device) {
      return deniedWithoutDevice('TERMINAL_DEVICE_NOT_FOUND', input.tenantId ?? null)
    }

    if (device.terminalDeviceType !== input.terminalDeviceType) {
      return {
        ...baseDecision({
          decisionCode: 'INVALID_TERMINAL_DEVICE_TYPE',
          resolvedTenantId: device.tenantId,
          terminalDeviceId: device.terminalDeviceId,
          terminalDeviceType: device.terminalDeviceType,
          deviceStatus: device.status,
          presenceStatus: 'UNKNOWN'
        }),
        requiredAction: 'CONTACT_ADMIN'
      }
    }

    const [runtimeSnapshot, policy] = await Promise.all([
      this.runtimeSnapshotRepository.findByTerminalDeviceId(device.terminalDeviceId),
      this.versionPolicyRepository.findByTenantAndType(device.tenantId, device.terminalDeviceType)
    ])
    const presenceStatus = runtimeSnapshot?.presenceStatus ?? 'UNKNOWN'
    const lifecycleDecision = lifecycleDecisionForStatus(device.status)
    const versionDecision = decideVersion(policy, input.appVersion ?? null)
    const governancePurpose = input.requestPurpose === 'HEARTBEAT' || input.requestPurpose === 'DIAGNOSTIC_LOG'

    if (device.status !== 'ACTIVE') {
      return {
        ...baseDecision({
          allowed: governancePurpose,
          decisionCode: lifecycleDecision.decisionCode,
          resolvedTenantId: device.tenantId,
          terminalDeviceId: device.terminalDeviceId,
          terminalDeviceType: device.terminalDeviceType,
          deviceStatus: device.status,
          presenceStatus
        }),
        versionPolicy: versionDecision.versionPolicy,
        requiredAction: lifecycleDecision.requiredAction,
        shouldClearLocalSession: lifecycleDecision.shouldClearLocalSession,
        shouldClearLocalTerminalDeviceId: lifecycleDecision.shouldClearLocalTerminalDeviceId,
        shouldRevokeServerSessions: lifecycleDecision.shouldRevokeServerSessions
      }
    }

    if (!versionDecision.allowedForStrictPurpose) {
      return {
        ...baseDecision({
          allowed: governancePurpose,
          decisionCode: versionDecision.decisionCode,
          resolvedTenantId: device.tenantId,
          terminalDeviceId: device.terminalDeviceId,
          terminalDeviceType: device.terminalDeviceType,
          deviceStatus: device.status,
          presenceStatus
        }),
        versionPolicy: versionDecision.versionPolicy,
        requiredAction: versionDecision.requiredAction
      }
    }

    return {
      ...baseDecision({
        allowed: true,
        decisionCode: 'ALLOW',
        resolvedTenantId: device.tenantId,
        terminalDeviceId: device.terminalDeviceId,
        terminalDeviceType: device.terminalDeviceType,
        deviceStatus: device.status,
        presenceStatus
      }),
      versionPolicy: versionDecision.versionPolicy,
      requiredAction: versionDecision.requiredAction
    }
  }
}

// compareAppVersions compares dotted application version strings with numeric segment semantics.
export function compareAppVersions(left: string, right: string): number {
  const leftSegments = parseVersionSegments(left)
  const rightSegments = parseVersionSegments(right)
  const length = Math.max(leftSegments.length, rightSegments.length)

  for (let index = 0; index < length; index += 1) {
    const leftSegment = leftSegments[index] ?? 0
    const rightSegment = rightSegments[index] ?? 0
    if (leftSegment !== rightSegment) {
      return leftSegment > rightSegment ? 1 : -1
    }
  }

  return 0
}

// parseVersionSegments converts a version string into comparable numeric segments.
function parseVersionSegments(version: string): number[] {
  return version.split('.').map((segment) => Number.parseInt(segment, 10) || 0)
}

// decideVersion evaluates the stored version policy for one reported app version.
function decideVersion(policy: TerminalDeviceVersionPolicyEntity | null, appVersion: string | null): VersionDecision {
  if (!policy || !appVersion) {
    return {
      allowedForStrictPurpose: true,
      decisionCode: 'ALLOW',
      requiredAction: 'NONE',
      versionPolicy: policy ? mapVersionPolicy(policy, false, false) : null
    }
  }

  const belowMinimum = compareAppVersions(appVersion, policy.minSupportedAppVersion) < 0
  const belowLatest = compareAppVersions(appVersion, policy.latestAppVersion) < 0

  return {
    allowedForStrictPurpose: !belowMinimum,
    decisionCode: belowMinimum ? 'APP_VERSION_UNSUPPORTED' : 'ALLOW',
    requiredAction: belowMinimum ? 'UPGRADE_APP' : 'NONE',
    versionPolicy: mapVersionPolicy(policy, belowMinimum, belowLatest)
  }
}

// mapVersionPolicy projects persisted policy with request-specific upgrade guidance.
function mapVersionPolicy(
  policy: TerminalDeviceVersionPolicyEntity,
  upgradeRequired: boolean,
  upgradeRecommended: boolean
): DeviceAccessVersionPolicyDecision {
  return {
    minSupportedAppVersion: policy.minSupportedAppVersion,
    latestAppVersion: policy.latestAppVersion,
    upgradeRequired,
    upgradeRecommended: policy.upgradeRecommended || upgradeRequired || upgradeRecommended,
    apkDownloadUrl: policy.apkDownloadUrl,
    releaseNotesUrl: policy.releaseNotesUrl
  }
}

// lifecycleDecisionForStatus maps lifecycle status into cleanup and governance response semantics.
function lifecycleDecisionForStatus(status: TerminalDeviceStatus): {
  decisionCode: DeviceAccessDecisionCode
  requiredAction: DeviceAccessRequiredAction
  shouldClearLocalSession: boolean
  shouldClearLocalTerminalDeviceId: boolean
  shouldRevokeServerSessions: boolean
} {
  if (status === 'ACTIVE') {
    return {
      decisionCode: 'ALLOW',
      requiredAction: 'NONE',
      shouldClearLocalSession: false,
      shouldClearLocalTerminalDeviceId: false,
      shouldRevokeServerSessions: false
    }
  }

  if (status === 'DECOMMISSIONED') {
    return {
      decisionCode: 'DEVICE_DECOMMISSIONED',
      requiredAction: 'CLEAR_LOCAL_DEVICE_AND_SESSION',
      shouldClearLocalSession: true,
      shouldClearLocalTerminalDeviceId: true,
      shouldRevokeServerSessions: true
    }
  }

  return {
    decisionCode: `DEVICE_${status}` as DeviceAccessDecisionCode,
    requiredAction: status === 'PENDING_APPROVAL' ? 'CONTACT_ADMIN' : 'CLEAR_LOCAL_SESSION',
    shouldClearLocalSession: status !== 'PENDING_APPROVAL',
    shouldClearLocalTerminalDeviceId: false,
    shouldRevokeServerSessions: status !== 'PENDING_APPROVAL'
  }
}

// deniedWithoutDevice builds a denial when no terminal device registry record can be resolved.
function deniedWithoutDevice(decisionCode: DeviceAccessDecisionCode, resolvedTenantId: string | null): DeviceAccessDecision {
  return baseDecision({
    allowed: false,
    decisionCode,
    resolvedTenantId,
    terminalDeviceId: null,
    terminalDeviceType: null,
    deviceStatus: null,
    presenceStatus: 'UNKNOWN'
  })
}

// baseDecision creates the common DeviceAccessDecision response shape with secure cleanup defaults.
function baseDecision(input: {
  allowed?: boolean
  decisionCode: DeviceAccessDecisionCode
  resolvedTenantId: string | null
  terminalDeviceId: string | null
  terminalDeviceType: TerminalDeviceType | null
  deviceStatus: TerminalDeviceStatus | null
  presenceStatus: PresenceStatus
}): DeviceAccessDecision {
  return {
    allowed: input.allowed ?? false,
    decisionCode: input.decisionCode,
    resolvedTenantId: input.resolvedTenantId,
    terminalDeviceId: input.terminalDeviceId,
    terminalDeviceType: input.terminalDeviceType,
    deviceStatus: input.deviceStatus,
    presenceStatus: input.presenceStatus,
    versionPolicy: null,
    requiredAction: 'CONTACT_ADMIN',
    messageKey: null,
    shouldClearLocalSession: false,
    shouldClearLocalTerminalDeviceId: false,
    shouldRevokeServerSessions: false
  }
}
