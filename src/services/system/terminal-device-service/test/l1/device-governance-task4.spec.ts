import {
  ChangeTerminalDeviceStatusCommand,
  ChangeTerminalDeviceStatusHandler
} from '../../src/application/commands/device/change-terminal-device-status.command'
import {
  RecordHeartbeatCommand,
  RecordHeartbeatHandler
} from '../../src/application/commands/runtime/record-heartbeat.command'
import {
  UpsertVersionPolicyCommand,
  UpsertVersionPolicyHandler
} from '../../src/application/commands/version-policy/upsert-version-policy.command'
import { DeviceAccessDecisionService } from '../../src/application/services/device-access-decision.service'
import { TerminalDeviceEntity } from '../../src/domain/entities/terminal-device.entity'
import { TerminalDeviceVersionPolicyEntity } from '../../src/domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceStatus } from '../../src/domain/enums/terminal-device.enums'
import { TerminalDeviceError } from '../../src/domain/errors/terminal-device.error'
import {
  InMemoryTerminalDeviceAuditEventRepository,
  InMemoryTerminalDeviceRepository,
  InMemoryTerminalDeviceRuntimeSnapshotRepository,
  InMemoryTerminalDeviceStore,
  InMemoryTerminalDeviceVersionPolicyRepository
} from '../../src/infrastructure/repositories/in-memory'

describe('Task 4 device governance application services', () => {
  describe('device access decisions', () => {
    it.each(['LOGIN', 'BOOTSTRAP', 'BUSINESS_REQUEST'] as const)(
      'allows %s for an ACTIVE device when app version satisfies policy',
      async (requestPurpose) => {
        const context = await createDecisionContext()

        const decision = await context.decisionService.resolve({
          terminalDeviceId: 'terminal-device-1',
          terminalDeviceType: 'PDA',
          requestPurpose,
          appVersion: '2.1.0',
          now: new Date('2026-05-16T00:00:00.000Z')
        })

        expect(decision).toMatchObject({
          allowed: true,
          decisionCode: 'ALLOW',
          resolvedTenantId: 'tenant-1',
          terminalDeviceId: 'terminal-device-1',
          terminalDeviceType: 'PDA',
          deviceStatus: 'ACTIVE',
          presenceStatus: 'UNKNOWN',
          requiredAction: 'NONE',
          shouldClearLocalSession: false,
          shouldClearLocalTerminalDeviceId: false,
          shouldRevokeServerSessions: false
        })
        expect(decision.versionPolicy).toMatchObject({
          minSupportedAppVersion: '2.0.0',
          latestAppVersion: '2.1.0',
          upgradeRequired: false,
          upgradeRecommended: false
        })
      }
    )

    it.each([
      'PENDING_APPROVAL',
      'DISABLED',
      'LOST',
      'MAINTENANCE',
      'DECOMMISSIONED'
    ] as TerminalDeviceStatus[])(
      'denies login and business requests for %s devices with cleanup guidance',
      async (status) => {
        const context = await createDecisionContext(status)

        const loginDecision = await context.decisionService.resolve({
          terminalDeviceId: 'terminal-device-1',
          terminalDeviceType: 'PDA',
          requestPurpose: 'LOGIN',
          appVersion: '2.1.0'
        })
        const businessDecision = await context.decisionService.resolve({
          terminalDeviceId: 'terminal-device-1',
          terminalDeviceType: 'PDA',
          requestPurpose: 'BUSINESS_REQUEST',
          appVersion: '2.1.0'
        })

        expect(loginDecision.allowed).toBe(false)
        expect(businessDecision.allowed).toBe(false)
        expect(loginDecision.deviceStatus).toBe(status)
        expect(loginDecision.resolvedTenantId).toBe('tenant-1')
        expect(loginDecision.decisionCode).toBe(`DEVICE_${status}`)
        expect(loginDecision.shouldClearLocalSession).toBe(status !== 'PENDING_APPROVAL')
        expect(loginDecision.shouldClearLocalTerminalDeviceId).toBe(status === 'DECOMMISSIONED')
        expect(loginDecision.requiredAction).toBe(
          status === 'DECOMMISSIONED'
            ? 'CLEAR_LOCAL_DEVICE_AND_SESSION'
            : status === 'PENDING_APPROVAL'
              ? 'CONTACT_ADMIN'
              : 'CLEAR_LOCAL_SESSION'
        )
      }
    )

    it.each(['HEARTBEAT', 'DIAGNOSTIC_LOG'] as const)(
      'allows %s governance responses for non-active devices',
      async (requestPurpose) => {
        const context = await createDecisionContext('DISABLED')

        const decision = await context.decisionService.resolve({
          terminalDeviceId: 'terminal-device-1',
          terminalDeviceType: 'PDA',
          requestPurpose,
          appVersion: '1.0.0'
        })

        expect(decision).toMatchObject({
          allowed: true,
          decisionCode: 'DEVICE_DISABLED',
          resolvedTenantId: 'tenant-1',
          deviceStatus: 'DISABLED',
          requiredAction: 'CLEAR_LOCAL_SESSION',
          shouldClearLocalSession: true,
          shouldClearLocalTerminalDeviceId: false,
          shouldRevokeServerSessions: true
        })
        expect(decision.versionPolicy).toMatchObject({
          upgradeRequired: true,
          upgradeRecommended: true
        })
      }
    )
  })

  describe('version policy decisions', () => {
    it('denies login when app version is below the minimum supported version', async () => {
      const context = await createDecisionContext()

      const decision = await context.decisionService.resolve({
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        requestPurpose: 'LOGIN',
        appVersion: '1.9.9'
      })

      expect(decision).toMatchObject({
        allowed: false,
        decisionCode: 'APP_VERSION_UNSUPPORTED',
        requiredAction: 'UPGRADE_APP',
        shouldClearLocalSession: false,
        shouldClearLocalTerminalDeviceId: false
      })
      expect(decision.versionPolicy).toMatchObject({
        minSupportedAppVersion: '2.0.0',
        latestAppVersion: '2.1.0',
        upgradeRequired: true,
        upgradeRecommended: true
      })
    })

    it('allows login but recommends upgrade when app version is below latest and above minimum', async () => {
      const context = await createDecisionContext()

      const decision = await context.decisionService.resolve({
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        requestPurpose: 'LOGIN',
        appVersion: '2.0.1'
      })

      expect(decision).toMatchObject({
        allowed: true,
        decisionCode: 'ALLOW',
        requiredAction: 'NONE'
      })
      expect(decision.versionPolicy).toMatchObject({
        upgradeRequired: false,
        upgradeRecommended: true
      })
    })

    it('accepts heartbeat even when the reported app version is unsupported', async () => {
      const context = await createDecisionContext()

      const decision = await context.decisionService.resolve({
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        requestPurpose: 'HEARTBEAT',
        appVersion: '1.0.0'
      })

      expect(decision).toMatchObject({
        allowed: true,
        decisionCode: 'APP_VERSION_UNSUPPORTED',
        requiredAction: 'UPGRADE_APP'
      })
    })

    it('does not mark upgrade required unless the reported app version is below minimum', async () => {
      const context = await createDecisionContext()
      await context.versionPolicyRepository.upsert(
        new TerminalDeviceVersionPolicyEntity({
          versionPolicyId: 'version-policy-required-flag',
          tenantId: 'tenant-1',
          terminalDeviceType: 'PDA',
          minSupportedAppVersion: '2.0.0',
          latestAppVersion: '2.1.0',
          upgradeRequired: true,
          upgradeRecommended: true,
          apkDownloadUrl: null,
          releaseNotesUrl: null,
          updatedBy: 'operator-1',
          updatedAt: new Date('2026-05-16T00:00:00.000Z'),
          createdAt: new Date('2026-05-16T00:00:00.000Z')
        })
      )

      const decision = await context.decisionService.resolve({
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        requestPurpose: 'LOGIN',
        appVersion: '2.1.0'
      })

      expect(decision).toMatchObject({
        allowed: true,
        decisionCode: 'ALLOW',
        requiredAction: 'NONE'
      })
      expect(decision.versionPolicy).toMatchObject({
        upgradeRequired: false,
        upgradeRecommended: true
      })
    })
  })

  describe('lifecycle transitions', () => {
    it.each(['DISABLED', 'LOST', 'MAINTENANCE'] as TerminalDeviceStatus[])(
      'restores %s devices to ACTIVE with audit',
      async (status) => {
        const context = await createLifecycleContext(status)
        const handler = new ChangeTerminalDeviceStatusHandler(
          context.deviceRepository,
          context.auditRepository
        )

        const result = await handler.execute(
          new ChangeTerminalDeviceStatusCommand({
            tenantId: 'tenant-1',
            terminalDeviceId: 'terminal-device-1',
            targetStatus: 'ACTIVE',
            reason: `restoring ${status}`,
            operatorContext: {
              operatorAccountId: 'operator-1',
              operatorOrgId: 'org-1',
              traceId: 'trace-restore'
            },
            now: new Date('2026-05-16T01:00:00.000Z')
          })
        )

        expect(result.deviceStatus).toBe('ACTIVE')
        expect(result.sessionRevokeIntent).toBeNull()
        expect((await context.deviceRepository.findById('terminal-device-1'))?.status).toBe(
          'ACTIVE'
        )
        expect(
          (await context.auditRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-1'))[0]
        ).toMatchObject({
          action: 'STATUS_CHANGED',
          reason: `restoring ${status}`,
          beforeJson: { status },
          afterJson: { status: 'ACTIVE' }
        })
      }
    )

    it('does not restore a DECOMMISSIONED device to ACTIVE', async () => {
      const context = await createLifecycleContext('DECOMMISSIONED')
      const handler = new ChangeTerminalDeviceStatusHandler(
        context.deviceRepository,
        context.auditRepository
      )

      await expect(
        handler.execute(
          new ChangeTerminalDeviceStatusCommand({
            tenantId: 'tenant-1',
            terminalDeviceId: 'terminal-device-1',
            targetStatus: 'ACTIVE',
            reason: 'restore retired device',
            operatorContext: {
              operatorAccountId: 'operator-1'
            }
          })
        )
      ).rejects.toMatchObject({
        code: 'TERMINAL_DEVICE_DECOMMISSIONED_CANNOT_RESTORE'
      } satisfies Partial<TerminalDeviceError>)
    })

    it.each(['DISABLED', 'LOST', 'MAINTENANCE', 'PENDING_APPROVAL'] as TerminalDeviceStatus[])(
      'does not let a DECOMMISSIONED device transition to %s and bypass terminal status',
      async (targetStatus) => {
        const context = await createLifecycleContext('DECOMMISSIONED')
        const handler = new ChangeTerminalDeviceStatusHandler(
          context.deviceRepository,
          context.auditRepository
        )

        await expect(
          handler.execute(
            new ChangeTerminalDeviceStatusCommand({
              tenantId: 'tenant-1',
              terminalDeviceId: 'terminal-device-1',
              targetStatus,
              reason: `move retired device to ${targetStatus}`,
              operatorContext: {
                operatorAccountId: 'operator-1'
              }
            })
          )
        ).rejects.toMatchObject({
          code: 'TERMINAL_DEVICE_DECOMMISSIONED_CANNOT_RESTORE'
        } satisfies Partial<TerminalDeviceError>)
        expect((await context.deviceRepository.findById('terminal-device-1'))?.status).toBe(
          'DECOMMISSIONED'
        )
        expect(
          await context.auditRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-1')
        ).toHaveLength(0)
      }
    )

    it.each(['DISABLED', 'LOST', 'MAINTENANCE', 'DECOMMISSIONED'] as TerminalDeviceStatus[])(
      'returns a session revoke intent when transitioning to %s',
      async (targetStatus) => {
        const context = await createLifecycleContext('ACTIVE')
        const unavailableEventPublisher = {
          publish: jest.fn().mockResolvedValue(undefined)
        }
        const handler = new ChangeTerminalDeviceStatusHandler(
          context.deviceRepository,
          context.auditRepository,
          unavailableEventPublisher
        )

        const result = await handler.execute(
          new ChangeTerminalDeviceStatusCommand({
            tenantId: 'tenant-1',
            terminalDeviceId: 'terminal-device-1',
            targetStatus,
            reason: `mark ${targetStatus}`,
            operatorContext: {
              operatorAccountId: 'operator-1',
              traceId: 'trace-status'
            },
            now: new Date('2026-05-16T02:00:00.000Z')
          })
        )

        expect(result.sessionRevokeIntent).toMatchObject({
          tenantId: 'tenant-1',
          terminalDeviceId: 'terminal-device-1',
          terminal: 'PDA',
          shouldRevokeServerSessions: true,
          reason: `mark ${targetStatus}`
        })
        expect(unavailableEventPublisher.publish).toHaveBeenCalledWith({
          tenantId: 'tenant-1',
          terminalDeviceId: 'terminal-device-1',
          previousStatus: 'ACTIVE',
          newStatus: targetStatus,
          operatorAccountId: 'operator-1',
          operatorOrgId: null,
          traceId: 'trace-status',
          reason: `mark ${targetStatus}`,
          occurredAt: new Date('2026-05-16T02:00:00.000Z')
        })
      }
    )

    it('requires reason for high-risk lifecycle transitions before writing audit', async () => {
      const context = await createLifecycleContext('ACTIVE')
      const handler = new ChangeTerminalDeviceStatusHandler(
        context.deviceRepository,
        context.auditRepository
      )

      await expect(
        handler.execute(
          new ChangeTerminalDeviceStatusCommand({
            tenantId: 'tenant-1',
            terminalDeviceId: 'terminal-device-1',
            targetStatus: 'LOST',
            operatorContext: {
              operatorAccountId: 'operator-1'
            }
          })
        )
      ).rejects.toMatchObject({
        code: 'TERMINAL_DEVICE_STATUS_REASON_REQUIRED'
      } satisfies Partial<TerminalDeviceError>)
      expect(
        await context.auditRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-1')
      ).toHaveLength(0)
    })

    it('rejects lifecycle transition when tenant context does not own the device', async () => {
      const context = await createLifecycleContext('ACTIVE')
      const handler = new ChangeTerminalDeviceStatusHandler(
        context.deviceRepository,
        context.auditRepository
      )

      await expect(
        handler.execute(
          new ChangeTerminalDeviceStatusCommand({
            tenantId: 'tenant-other',
            terminalDeviceId: 'terminal-device-1',
            targetStatus: 'DISABLED',
            reason: 'wrong tenant attempt',
            operatorContext: {
              operatorAccountId: 'operator-1'
            }
          })
        )
      ).rejects.toMatchObject({
        code: 'TERMINAL_DEVICE_NOT_FOUND'
      } satisfies Partial<TerminalDeviceError>)
      expect((await context.deviceRepository.findById('terminal-device-1'))?.status).toBe('ACTIVE')
      expect(
        await context.auditRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-1')
      ).toHaveLength(0)
    })
  })

  describe('runtime heartbeat snapshot', () => {
    it('records heartbeat diagnostics using server receive time without changing lifecycle status', async () => {
      const context = await createDecisionContext('MAINTENANCE')
      const handler = new RecordHeartbeatHandler(
        context.deviceRepository,
        context.runtimeSnapshotRepository,
        context.decisionService
      )

      const result = await handler.execute(
        new RecordHeartbeatCommand({
          terminalDeviceId: 'terminal-device-1',
          terminalDeviceType: 'PDA',
          appVersion: '2.1.0',
          androidVersion: '14',
          webViewVersion: '124.0.0',
          networkStatus: 'ONLINE',
          networkType: 'WIFI',
          batteryLevel: 88,
          appState: 'FOREGROUND',
          lastClientTime: new Date('2026-05-15T23:59:00.000Z'),
          session: {
            accountId: 'account-1',
            sessionId: 'session-1'
          },
          traceId: 'trace-heartbeat',
          receivedAt: new Date('2026-05-16T00:00:00.000Z')
        })
      )

      expect(result.snapshot).toMatchObject({
        terminalDeviceId: 'terminal-device-1',
        tenantId: 'tenant-1',
        presenceStatus: 'ONLINE',
        lastHeartbeatAt: new Date('2026-05-16T00:00:00.000Z'),
        lastClientTime: new Date('2026-05-15T23:59:00.000Z'),
        appVersion: '2.1.0',
        androidVersion: '14',
        webViewVersion: '124.0.0',
        networkStatus: 'ONLINE',
        networkType: 'WIFI',
        batteryLevel: 88,
        appState: 'FOREGROUND',
        lastReportedAccountId: 'account-1',
        lastReportedSessionId: 'session-1'
      })
      expect(result.decision).toMatchObject({
        allowed: true,
        deviceStatus: 'MAINTENANCE',
        presenceStatus: 'ONLINE'
      })
      expect((await context.deviceRepository.findById('terminal-device-1'))?.status).toBe(
        'MAINTENANCE'
      )
    })
  })

  describe('version policy commands and queries', () => {
    it('upserts and returns tenant terminal version policy with audit', async () => {
      const versionPolicyRepository = new InMemoryTerminalDeviceVersionPolicyRepository()
      const auditRepository = new InMemoryTerminalDeviceAuditEventRepository(
        new InMemoryTerminalDeviceStore()
      )
      const handler = new UpsertVersionPolicyHandler(versionPolicyRepository, auditRepository)

      const result = await handler.execute(
        new UpsertVersionPolicyCommand({
          tenantId: 'tenant-1',
          terminalDeviceType: 'PDA',
          minSupportedAppVersion: '2.0.0',
          latestAppVersion: '2.2.0',
          upgradeRequired: false,
          upgradeRecommended: true,
          apkDownloadUrl: 'https://download.example/app.apk',
          releaseNotesUrl: 'https://download.example/release-notes',
          reason: 'Initial PDA rollout policy',
          operatorContext: {
            operatorAccountId: 'operator-1',
            operatorOrgId: 'org-1',
            traceId: 'trace-policy'
          },
          now: new Date('2026-05-16T03:00:00.000Z')
        })
      )

      expect(result).toMatchObject({
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        minSupportedAppVersion: '2.0.0',
        latestAppVersion: '2.2.0',
        upgradeRequired: false,
        upgradeRecommended: true,
        apkDownloadUrl: 'https://download.example/app.apk',
        releaseNotesUrl: 'https://download.example/release-notes',
        updatedBy: 'operator-1',
        updatedAt: new Date('2026-05-16T03:00:00.000Z')
      })
      expect(await versionPolicyRepository.findByTenantAndType('tenant-1', 'PDA')).toEqual(result)
      expect(
        (await auditRepository.listByTerminalDeviceId('tenant-1', 'VERSION_POLICY:PDA'))[0]
      ).toMatchObject({
        action: 'VERSION_POLICY_UPSERTED',
        targetTerminalDeviceId: 'VERSION_POLICY:PDA',
        reason: 'Initial PDA rollout policy'
      })
    })

    it('requires a reason when updating an existing version policy before writing audit', async () => {
      const versionPolicyRepository = new InMemoryTerminalDeviceVersionPolicyRepository()
      const auditRepository = new InMemoryTerminalDeviceAuditEventRepository(
        new InMemoryTerminalDeviceStore()
      )
      const handler = new UpsertVersionPolicyHandler(versionPolicyRepository, auditRepository)

      await handler.execute(
        new UpsertVersionPolicyCommand({
          tenantId: 'tenant-1',
          terminalDeviceType: 'PDA',
          minSupportedAppVersion: '2.0.0',
          latestAppVersion: '2.1.0',
          upgradeRequired: false,
          upgradeRecommended: false,
          operatorContext: {
            operatorAccountId: 'operator-1'
          },
          now: new Date('2026-05-16T03:00:00.000Z')
        })
      )

      await expect(
        handler.execute(
          new UpsertVersionPolicyCommand({
            tenantId: 'tenant-1',
            terminalDeviceType: 'PDA',
            minSupportedAppVersion: '2.0.0',
            latestAppVersion: '2.2.0',
            upgradeRequired: false,
            upgradeRecommended: true,
            reason: '   ',
            operatorContext: {
              operatorAccountId: 'operator-1'
            },
            now: new Date('2026-05-16T04:00:00.000Z')
          })
        )
      ).rejects.toMatchObject({
        code: 'TERMINAL_DEVICE_VERSION_POLICY_REASON_REQUIRED'
      } satisfies Partial<TerminalDeviceError>)
      expect(
        await auditRepository.listByTerminalDeviceId('tenant-1', 'VERSION_POLICY:PDA')
      ).toHaveLength(1)
    })
  })
})

// createDecisionContext assembles the in-memory repositories and seeded device state used by access decision tests.
async function createDecisionContext(status: TerminalDeviceStatus = 'ACTIVE') {
  const store = new InMemoryTerminalDeviceStore()
  const deviceRepository = new InMemoryTerminalDeviceRepository(store)
  const runtimeSnapshotRepository = new InMemoryTerminalDeviceRuntimeSnapshotRepository()
  const versionPolicyRepository = new InMemoryTerminalDeviceVersionPolicyRepository()

  await deviceRepository.create(createDevice(status))
  await versionPolicyRepository.upsert(createVersionPolicy())

  const decisionService = new DeviceAccessDecisionService(
    deviceRepository,
    runtimeSnapshotRepository,
    versionPolicyRepository
  )

  return {
    deviceRepository,
    runtimeSnapshotRepository,
    versionPolicyRepository,
    decisionService
  }
}

// createLifecycleContext assembles in-memory repositories and seeded device state used by status transition tests.
async function createLifecycleContext(status: TerminalDeviceStatus) {
  const store = new InMemoryTerminalDeviceStore()
  const deviceRepository = new InMemoryTerminalDeviceRepository(store)
  const auditRepository = new InMemoryTerminalDeviceAuditEventRepository(store)

  await deviceRepository.create(createDevice(status))

  return {
    deviceRepository,
    auditRepository
  }
}

// createDevice builds a terminal device entity with a variable lifecycle status for Task 4 tests.
function createDevice(status: TerminalDeviceStatus): TerminalDeviceEntity {
  return new TerminalDeviceEntity({
    terminalDeviceId: 'terminal-device-1',
    tenantId: 'tenant-1',
    terminalDeviceType: 'PDA',
    displayName: 'PDA 01',
    status,
    statusReason: null,
    enrollmentId: null,
    manufacturerSerial: 'SN-001',
    androidId: 'android-1',
    appInstallationId: 'install-1',
    manufacturer: 'Seuic',
    model: 'Cruise Ge',
    androidVersion: '14',
    registeredAt: new Date('2026-05-15T00:00:00.000Z'),
    updatedAt: new Date('2026-05-15T00:00:00.000Z'),
    notes: null
  })
}

// createVersionPolicy builds the default PDA version policy used by access decision tests.
function createVersionPolicy(): TerminalDeviceVersionPolicyEntity {
  return new TerminalDeviceVersionPolicyEntity({
    versionPolicyId: 'version-policy-1',
    tenantId: 'tenant-1',
    terminalDeviceType: 'PDA',
    minSupportedAppVersion: '2.0.0',
    latestAppVersion: '2.1.0',
    upgradeRequired: false,
    upgradeRecommended: false,
    apkDownloadUrl: null,
    releaseNotesUrl: null,
    updatedBy: 'operator-1',
    updatedAt: new Date('2026-05-15T00:00:00.000Z'),
    createdAt: new Date('2026-05-15T00:00:00.000Z')
  })
}
