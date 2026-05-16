import {
  AppState as ProtoAppState,
  DeviceAccessDecisionCode as ProtoDecisionCode,
  DeviceAccessRequestPurpose as ProtoRequestPurpose,
  DeviceRequiredAction as ProtoRequiredAction,
  EnrollmentStatus as ProtoEnrollmentStatus,
  IdentityConfidence as ProtoIdentityConfidence,
  IdentitySource as ProtoIdentitySource,
  NetworkStatus as ProtoNetworkStatus,
  NetworkType as ProtoNetworkType,
  PresenceStatus as ProtoPresenceStatus,
  TerminalDeviceStatus as ProtoDeviceStatus,
  TerminalDeviceType as ProtoDeviceType
} from '@oes/common/generated/terminal_device_service'
import { RpcException } from '@nestjs/microservices'
import { ChangeTerminalDeviceStatusCommand } from '../../src/application/commands/device'
import { ActivateEnrollmentCommand, CreateEnrollmentCommand } from '../../src/application/commands/enrollment'
import { RecordHeartbeatCommand } from '../../src/application/commands/runtime'
import { UpsertVersionPolicyCommand } from '../../src/application/commands/version-policy'
import { GetTerminalDeviceQuery, ListTerminalDevicesQuery } from '../../src/application/queries/device'
import { GetVersionPolicyQuery } from '../../src/application/queries/version-policy'
import { DeviceAccessDecisionService } from '../../src/application/services'
import { TerminalDeviceGrpcController } from '../../src/interfaces/grpc/terminal-device.grpc.controller'

// buildController creates the gRPC controller with focused fake application dependencies.
function buildController(overrides: Partial<ControllerDeps> = {}): {
  controller: TerminalDeviceGrpcController
  deps: ControllerDeps
} {
  const deps: ControllerDeps = {
    createEnrollmentHandler: { execute: jest.fn() },
    activateEnrollmentHandler: { execute: jest.fn() },
    deviceAccessDecisionService: { resolve: jest.fn() },
    recordHeartbeatHandler: { execute: jest.fn() },
    getVersionPolicyHandler: { execute: jest.fn() },
    upsertVersionPolicyHandler: { execute: jest.fn() },
    listTerminalDevicesHandler: { execute: jest.fn() },
    getTerminalDeviceHandler: { execute: jest.fn() },
    changeTerminalDeviceStatusHandler: { execute: jest.fn() },
    ...overrides
  }

  return {
    deps,
    controller: new TerminalDeviceGrpcController(
      deps.createEnrollmentHandler as never,
      deps.activateEnrollmentHandler as never,
      deps.deviceAccessDecisionService as never,
      deps.recordHeartbeatHandler as never,
      deps.getVersionPolicyHandler as never,
      deps.upsertVersionPolicyHandler as never,
      deps.listTerminalDevicesHandler as never,
      deps.getTerminalDeviceHandler as never,
      deps.changeTerminalDeviceStatusHandler as never
    )
  }
}

interface ControllerDeps {
  createEnrollmentHandler: { execute: jest.Mock }
  activateEnrollmentHandler: { execute: jest.Mock }
  deviceAccessDecisionService: Pick<DeviceAccessDecisionService, 'resolve'> & { resolve: jest.Mock }
  recordHeartbeatHandler: { execute: jest.Mock }
  getVersionPolicyHandler: { execute: jest.Mock }
  upsertVersionPolicyHandler: { execute: jest.Mock }
  listTerminalDevicesHandler: { execute: jest.Mock }
  getTerminalDeviceHandler: { execute: jest.Mock }
  changeTerminalDeviceStatusHandler: { execute: jest.Mock }
}

describe('terminal-device-service grpc surface L3', () => {
  it('CreateEnrollment maps the proto request into a command and presents the enrollment code', async () => {
    const { controller, deps } = buildController()
    deps.createEnrollmentHandler.execute.mockResolvedValue({
      enrollmentId: 'enrollment-1',
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      displayName: 'Dock PDA',
      status: 'ISSUED',
      enrollmentCode: 'ENR-123',
      expiresAt: new Date('2026-06-01T00:00:00.000Z'),
      createdAt: new Date('2026-05-16T00:00:00.000Z')
    })

    const response = await controller.createEnrollment({
      tenantId: 'tenant-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      displayName: 'Dock PDA',
      expectedManufacturerSerial: 'SER-1',
      expiresAt: '2026-06-01T00:00:00.000Z',
      notes: 'warehouse dock',
      operatorContext: {
        operatorAccountId: 'operator-1',
        operatorOrgId: 'org-1',
        traceId: 'trace-1'
      }
    })

    expect(deps.createEnrollmentHandler.execute).toHaveBeenCalledWith(expect.any(CreateEnrollmentCommand))
    expect(deps.createEnrollmentHandler.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      displayName: 'Dock PDA',
      expectedManufacturerSerial: 'SER-1',
      notes: 'warehouse dock',
      operatorContext: {
        operatorAccountId: 'operator-1',
        operatorOrgId: 'org-1',
        traceId: 'trace-1'
      }
    })
    expect(response).toEqual({
      enrollment: expect.objectContaining({
        enrollmentId: 'enrollment-1',
        tenantId: 'tenant-1',
        terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
        displayName: 'Dock PDA',
        status: ProtoEnrollmentStatus.ENROLLMENT_STATUS_ISSUED,
        expiresAt: '2026-06-01T00:00:00.000Z',
        createdAt: '2026-05-16T00:00:00.000Z'
      }),
      enrollmentCode: 'ENR-123'
    })
  })

  it('ActivateEnrollment maps identity and software signals and presents activation outcome', async () => {
    const { controller, deps } = buildController()
    deps.activateEnrollmentHandler.execute.mockResolvedValue({
      activated: true,
      terminalDeviceId: 'device-1',
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      deviceStatus: 'ACTIVE',
      enrollmentId: 'enrollment-1',
      decisionCode: 'ALLOW'
    })

    const response = await controller.activateEnrollment({
      enrollmentCode: 'ENR-123',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      identity: {
        manufacturerSerial: 'SER-1',
        androidId: 'android-1',
        appInstallationId: 'install-1',
        manufacturer: 'Honeywell',
        model: 'CT60',
        identitySource: ProtoIdentitySource.IDENTITY_SOURCE_MANUFACTURER_SERIAL,
        identityConfidence: ProtoIdentityConfidence.IDENTITY_CONFIDENCE_HIGH
      },
      software: {
        androidVersion: '13',
        webViewVersion: '120',
        appVersion: '2.4.0'
      },
      traceId: 'trace-1'
    })

    expect(deps.activateEnrollmentHandler.execute).toHaveBeenCalledWith(expect.any(ActivateEnrollmentCommand))
    expect(deps.activateEnrollmentHandler.execute.mock.calls[0][0]).toMatchObject({
      enrollmentCode: 'ENR-123',
      terminalDeviceType: 'PDA',
      identity: {
        manufacturerSerial: 'SER-1',
        androidId: 'android-1',
        appInstallationId: 'install-1',
        manufacturer: 'Honeywell',
        model: 'CT60'
      },
      software: {
        androidVersion: '13',
        webViewVersion: '120',
        appVersion: '2.4.0'
      },
      traceId: 'trace-1'
    })
    expect(response).toEqual({
      activated: true,
      terminalDeviceId: 'device-1',
      tenantId: 'tenant-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      deviceStatus: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
      enrollmentId: 'enrollment-1',
      decisionCode: ProtoDecisionCode.DEVICE_ACCESS_DECISION_CODE_ALLOW
    })
  })

  it('ResolveDeviceAccessDecision maps request purpose and presents cleanup guidance', async () => {
    const { controller, deps } = buildController()
    deps.deviceAccessDecisionService.resolve.mockResolvedValue({
      allowed: false,
      decisionCode: 'APP_VERSION_UNSUPPORTED',
      resolvedTenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      terminalDeviceType: 'PDA',
      deviceStatus: 'ACTIVE',
      presenceStatus: 'ONLINE',
      versionPolicy: {
        minSupportedAppVersion: '2.0.0',
        latestAppVersion: '2.5.0',
        upgradeRequired: true,
        upgradeRecommended: true,
        apkDownloadUrl: null,
        releaseNotesUrl: 'https://example.test/release'
      },
      requiredAction: 'UPGRADE_APP',
      messageKey: null,
      shouldClearLocalSession: false,
      shouldClearLocalTerminalDeviceId: false,
      shouldRevokeServerSessions: false
    })

    const response = await controller.resolveDeviceAccessDecision({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      requestPurpose: ProtoRequestPurpose.DEVICE_ACCESS_REQUEST_PURPOSE_LOGIN,
      appVersion: '1.5.0',
      traceId: 'trace-1'
    })

    expect(deps.deviceAccessDecisionService.resolve).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      terminalDeviceType: 'PDA',
      requestPurpose: 'LOGIN',
      appVersion: '1.5.0'
    })
    expect(response.decision).toEqual(
      expect.objectContaining({
        allowed: false,
        decisionCode: ProtoDecisionCode.DEVICE_ACCESS_DECISION_CODE_APP_VERSION_UNSUPPORTED,
        terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
        deviceStatus: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
        presenceStatus: ProtoPresenceStatus.PRESENCE_STATUS_ONLINE,
        requiredAction: ProtoRequiredAction.DEVICE_REQUIRED_ACTION_UPGRADE_APP
      })
    )
    expect(response.decision?.versionPolicy).toEqual(
      expect.objectContaining({
        minSupportedAppVersion: '2.0.0',
        apkDownloadUrl: '',
        releaseNotesUrl: 'https://example.test/release'
      })
    )
  })

  it('RecordHeartbeat maps runtime diagnostics and returns the compact heartbeat contract', async () => {
    const { controller, deps } = buildController()
    deps.recordHeartbeatHandler.execute.mockResolvedValue({
      snapshot: {
        terminalDeviceId: 'device-1',
        tenantId: 'tenant-1',
        presenceStatus: 'ONLINE',
        lastHeartbeatAt: new Date('2026-05-16T01:02:03.000Z'),
        lastClientTime: new Date('2026-05-16T01:02:00.000Z'),
        appVersion: '2.4.0',
        androidVersion: '13',
        webViewVersion: '120',
        networkStatus: 'ONLINE',
        networkType: 'WIFI',
        batteryLevel: 86,
        appState: 'FOREGROUND',
        lastReportedAccountId: 'account-1',
        lastReportedSessionId: 'session-1'
      },
      decision: {
        allowed: true
      }
    })

    const response = await controller.recordHeartbeat({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      software: {
        androidVersion: '13',
        webViewVersion: '120',
        appVersion: '2.4.0'
      },
      runtime: {
        networkStatus: ProtoNetworkStatus.NETWORK_STATUS_ONLINE,
        networkType: ProtoNetworkType.NETWORK_TYPE_WIFI,
        batteryLevel: 86,
        appState: ProtoAppState.APP_STATE_FOREGROUND
      },
      reportedSession: {
        accountId: 'account-1',
        sessionId: 'session-1'
      },
      clientTime: '2026-05-16T01:02:00.000Z',
      receivedAt: '2026-05-16T01:02:03.000Z',
      traceId: 'trace-1'
    })

    expect(deps.recordHeartbeatHandler.execute).toHaveBeenCalledWith(expect.any(RecordHeartbeatCommand))
    expect(deps.recordHeartbeatHandler.execute.mock.calls[0][0]).toMatchObject({
      terminalDeviceId: 'device-1',
      terminalDeviceType: 'PDA',
      appVersion: '2.4.0',
      networkStatus: 'ONLINE',
      networkType: 'WIFI',
      batteryLevel: 86,
      appState: 'FOREGROUND',
      session: {
        accountId: 'account-1',
        sessionId: 'session-1'
      },
      traceId: 'trace-1'
    })
    expect(response).toEqual({
      accepted: true,
      terminalDeviceId: 'device-1',
      lastHeartbeatAt: '2026-05-16T01:02:03.000Z',
      presenceStatus: ProtoPresenceStatus.PRESENCE_STATUS_ONLINE
    })
  })

  it('GetVersionPolicy maps a query and presents nullable policy URLs safely', async () => {
    const { controller, deps } = buildController()
    deps.getVersionPolicyHandler.execute.mockResolvedValue({
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      minSupportedAppVersion: '2.0.0',
      latestAppVersion: '2.5.0',
      upgradeRequired: false,
      upgradeRecommended: true,
      apkDownloadUrl: null,
      releaseNotesUrl: null,
      updatedAt: new Date('2026-05-16T02:00:00.000Z'),
      updatedBy: 'operator-1'
    })

    const response = await controller.getVersionPolicy({
      tenantId: 'tenant-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA
    })

    expect(deps.getVersionPolicyHandler.execute).toHaveBeenCalledWith(expect.any(GetVersionPolicyQuery))
    expect(response.policy).toEqual({
      tenantId: 'tenant-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      minSupportedAppVersion: '2.0.0',
      latestAppVersion: '2.5.0',
      upgradeRequired: false,
      upgradeRecommended: true,
      apkDownloadUrl: '',
      releaseNotesUrl: '',
      updatedAt: '2026-05-16T02:00:00.000Z',
      updatedBy: 'operator-1'
    })
  })

  it('UpsertVersionPolicy maps administrator input to the version policy command', async () => {
    const { controller, deps } = buildController()
    deps.upsertVersionPolicyHandler.execute.mockResolvedValue({
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      minSupportedAppVersion: '2.0.0',
      latestAppVersion: '2.5.0',
      upgradeRequired: true,
      upgradeRecommended: true,
      apkDownloadUrl: 'https://example.test/app.apk',
      releaseNotesUrl: null,
      updatedAt: new Date('2026-05-16T02:00:00.000Z'),
      updatedBy: 'operator-1'
    })

    const response = await controller.upsertVersionPolicy({
      tenantId: 'tenant-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      minSupportedAppVersion: '2.0.0',
      latestAppVersion: '2.5.0',
      upgradeRequired: true,
      upgradeRecommended: true,
      apkDownloadUrl: 'https://example.test/app.apk',
      releaseNotesUrl: '',
      reason: 'rollout',
      operatorContext: {
        operatorAccountId: 'operator-1',
        traceId: 'trace-1'
      }
    })

    expect(deps.upsertVersionPolicyHandler.execute).toHaveBeenCalledWith(expect.any(UpsertVersionPolicyCommand))
    expect(deps.upsertVersionPolicyHandler.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      minSupportedAppVersion: '2.0.0',
      latestAppVersion: '2.5.0',
      upgradeRequired: true,
      upgradeRecommended: true,
      apkDownloadUrl: 'https://example.test/app.apk',
      releaseNotesUrl: null,
      reason: 'rollout',
      operatorContext: {
        operatorAccountId: 'operator-1',
        traceId: 'trace-1'
      }
    })
    expect(response.policy?.releaseNotesUrl).toBe('')
  })

  it('ListTerminalDevices maps filters and presents runtime-enriched summaries', async () => {
    const { controller, deps } = buildController()
    deps.listTerminalDevicesHandler.execute.mockResolvedValue({
      items: [
        {
          device: {
            terminalDeviceId: 'device-1',
            tenantId: 'tenant-1',
            terminalDeviceType: 'PDA',
            displayName: 'Dock PDA',
            status: 'ACTIVE',
            manufacturer: 'Honeywell',
            model: 'CT60',
            androidVersion: '13',
            registeredAt: new Date('2026-05-01T00:00:00.000Z'),
            enrollmentId: 'enrollment-1'
          },
          runtime: {
            presenceStatus: 'ONLINE',
            appVersion: '2.4.0',
            lastHeartbeatAt: new Date('2026-05-16T03:00:00.000Z'),
            lastReportedAccountId: 'account-1'
          }
        }
      ],
      page: 2,
      pageSize: 10,
      total: 1
    })

    const response = await controller.listTerminalDevices({
      tenantId: 'tenant-1',
      terminalDeviceType: ProtoDeviceType.TERMINAL_DEVICE_TYPE_PDA,
      status: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
      presenceStatus: ProtoPresenceStatus.PRESENCE_STATUS_ONLINE,
      keyword: 'dock',
      pagination: {
        page: 2,
        pageSize: 10
      }
    })

    expect(deps.listTerminalDevicesHandler.execute).toHaveBeenCalledWith(expect.any(ListTerminalDevicesQuery))
    expect(deps.listTerminalDevicesHandler.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      status: 'ACTIVE',
      presenceStatus: 'ONLINE',
      keyword: 'dock',
      page: 2,
      pageSize: 10
    })
    expect(response.items?.[0]).toEqual(
      expect.objectContaining({
        terminalDeviceId: 'device-1',
        status: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
        presenceStatus: ProtoPresenceStatus.PRESENCE_STATUS_ONLINE,
        appVersion: '2.4.0',
        lastHeartbeatAt: '2026-05-16T03:00:00.000Z'
      })
    )
    expect(response.pagination).toEqual({ page: 2, pageSize: 10, total: 1 })
  })

  it('GetTerminalDevice maps detail queries and masks identity unless sensitive identity is requested', async () => {
    const { controller, deps } = buildController()
    deps.getTerminalDeviceHandler.execute.mockResolvedValue({
      device: {
        terminalDeviceId: 'device-1',
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        displayName: 'Dock PDA',
        status: 'ACTIVE',
        statusReason: null,
        registeredAt: new Date('2026-05-01T00:00:00.000Z'),
        enrollmentId: 'enrollment-1',
        notes: null,
        manufacturerSerial: 'SER-123456',
        androidId: 'android-123456',
        appInstallationId: 'install-1',
        manufacturer: 'Honeywell',
        model: 'CT60'
      },
      runtime: {
        terminalDeviceId: 'device-1',
        presenceStatus: 'ONLINE',
        lastHeartbeatAt: new Date('2026-05-16T03:00:00.000Z'),
        appVersion: '2.4.0',
        androidVersion: '13',
        webViewVersion: '120',
        networkStatus: 'ONLINE',
        networkType: 'WIFI',
        batteryLevel: 86,
        appState: 'FOREGROUND',
        lastReportedAccountId: 'account-1',
        lastReportedSessionId: 'session-1'
      }
    })

    const response = await controller.getTerminalDevice({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      includeSensitiveIdentity: false
    })

    expect(deps.getTerminalDeviceHandler.execute).toHaveBeenCalledWith(expect.any(GetTerminalDeviceQuery))
    expect(deps.getTerminalDeviceHandler.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      includeSensitiveIdentity: false
    })
    expect(response.device).toEqual(
      expect.objectContaining({
        terminalDeviceId: 'device-1',
        status: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
        statusReason: '',
        notes: ''
      })
    )
    expect(response.identity).toEqual(
      expect.objectContaining({
        manufacturerSerial: '',
        androidId: '',
        appInstallationId: '',
        manufacturerSerialMasked: '********3456',
        androidIdMasked: '********3456'
      })
    )
    expect(response.runtime).toEqual(
      expect.objectContaining({
        presenceStatus: ProtoPresenceStatus.PRESENCE_STATUS_ONLINE,
        networkStatus: ProtoNetworkStatus.NETWORK_STATUS_ONLINE,
        appState: ProtoAppState.APP_STATE_FOREGROUND
      })
    )
  })

  it('ChangeTerminalDeviceStatus maps lifecycle commands and presents PDA session revoke intent', async () => {
    const { controller, deps } = buildController()
    deps.changeTerminalDeviceStatusHandler.execute.mockResolvedValue({
      terminalDeviceId: 'device-1',
      tenantId: 'tenant-1',
      previousStatus: 'ACTIVE',
      deviceStatus: 'DISABLED',
      statusReason: 'lost by user',
      changedAt: new Date('2026-05-16T04:00:00.000Z'),
      sessionRevokeIntent: {
        tenantId: 'tenant-1',
        terminalDeviceId: 'device-1',
        terminal: 'PDA',
        shouldRevokeServerSessions: true,
        reason: 'lost by user',
        requestedAt: new Date('2026-05-16T04:00:00.000Z')
      }
    })

    const response = await controller.changeTerminalDeviceStatus({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      targetStatus: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_DISABLED,
      reason: 'lost by user',
      operatorContext: {
        operatorAccountId: 'operator-1',
        operatorOrgId: 'org-1',
        traceId: 'trace-1'
      }
    })

    expect(deps.changeTerminalDeviceStatusHandler.execute).toHaveBeenCalledWith(
      expect.any(ChangeTerminalDeviceStatusCommand)
    )
    expect(deps.changeTerminalDeviceStatusHandler.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      targetStatus: 'DISABLED',
      reason: 'lost by user',
      operatorContext: {
        operatorAccountId: 'operator-1',
        operatorOrgId: 'org-1',
        traceId: 'trace-1'
      }
    })
    expect(response).toEqual({
      terminalDeviceId: 'device-1',
      previousStatus: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
      status: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_DISABLED,
      statusReason: 'lost by user',
      changedAt: '2026-05-16T04:00:00.000Z',
      sessionRevokeIntent: {
        required: true,
        sessionTerminal: 'PDA',
        terminalDeviceId: 'device-1'
      }
    })
  })

  it('ChangeTerminalDeviceStatus presents status reason and changed time when restore to ACTIVE has no revoke intent', async () => {
    const { controller, deps } = buildController()
    deps.changeTerminalDeviceStatusHandler.execute.mockResolvedValue({
      terminalDeviceId: 'device-1',
      tenantId: 'tenant-1',
      previousStatus: 'MAINTENANCE',
      deviceStatus: 'ACTIVE',
      statusReason: 'repair complete',
      changedAt: new Date('2026-05-16T05:00:00.000Z'),
      sessionRevokeIntent: null
    })

    const response = await controller.changeTerminalDeviceStatus({
      tenantId: 'tenant-1',
      terminalDeviceId: 'device-1',
      targetStatus: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
      reason: 'repair complete',
      operatorContext: {
        operatorAccountId: 'operator-1'
      }
    })

    expect(response).toEqual({
      terminalDeviceId: 'device-1',
      previousStatus: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_MAINTENANCE,
      status: ProtoDeviceStatus.TERMINAL_DEVICE_STATUS_ACTIVE,
      statusReason: 'repair complete',
      changedAt: '2026-05-16T05:00:00.000Z',
      sessionRevokeIntent: {
        required: false,
        sessionTerminal: 'PDA',
        terminalDeviceId: 'device-1'
      }
    })
  })

  it.each([
    ['ListEnrollments', () => buildController().controller.listEnrollments({})],
    ['UpdateTerminalDevice', () => buildController().controller.updateTerminalDevice({})],
    ['ListTerminalDeviceAuditEvents', () => buildController().controller.listTerminalDeviceAuditEvents({})],
    ['GetRuntimeSnapshot', () => buildController().controller.getRuntimeSnapshot({})]
  ])('%s fails explicitly instead of returning fake success', (_methodName, invoke) => {
    expect(invoke).toThrow(RpcException)
    try {
      invoke()
    } catch (error) {
      expect((error as RpcException).getError()).toMatchObject({
        grpcStatus: 12,
        code: 'TERMINAL_DEVICE_RPC_UNIMPLEMENTED'
      })
    }
  })
})
