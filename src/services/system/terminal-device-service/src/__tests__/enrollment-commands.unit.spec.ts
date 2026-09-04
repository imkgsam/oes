import { createHash } from 'node:crypto'
import {
  CreateEnrollmentCommand,
  CreateEnrollmentHandler
} from '../application/commands/enrollment/create-enrollment.command'
import {
  RevokeEnrollmentCommand,
  RevokeEnrollmentHandler
} from '../application/commands/enrollment/revoke-enrollment.command'
import {
  ActivateEnrollmentCommand,
  ActivateEnrollmentHandler
} from '../application/commands/enrollment/activate-enrollment.command'
import { TerminalDeviceAuditEventEntity } from '../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceEnrollmentEntity } from '../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceEntity } from '../domain/entities/terminal-device.entity'
import { TerminalDeviceError } from '../domain/errors/terminal-device.error'
import { TerminalDeviceCredentialVerifierService } from '../application/services/terminal-device-credential-verifier.service'
import { TerminalDeviceAuditEventRepository } from '../domain/repositories/terminal-device-audit-event.repository'
import {
  InMemoryTerminalDeviceActivationRepository,
  InMemoryTerminalDeviceAuditEventRepository,
  InMemoryTerminalDeviceEnrollmentRepository,
  InMemoryTerminalDeviceRepository,
  InMemoryTerminalDeviceStore
} from '../infrastructure/repositories/in-memory'

class CapturingAuditEventRepository implements TerminalDeviceAuditEventRepository {
  readonly events: TerminalDeviceAuditEventEntity[] = []

  // Captures audit events so enrollment command tests can assert governance facts.
  async create(entity: TerminalDeviceAuditEventEntity): Promise<TerminalDeviceAuditEventEntity> {
    this.events.push(entity)
    return entity
  }

  // Lists captured audit events for compatibility with the repository port.
  async listByTerminalDeviceId(
    tenantId: string,
    terminalDeviceId: string
  ): Promise<TerminalDeviceAuditEventEntity[]> {
    return this.events.filter(
      (event) => event.tenantId === tenantId && event.targetTerminalDeviceId === terminalDeviceId
    )
  }
}

const hashEnrollmentCode = (code: string): string => createHash('sha256').update(code).digest('hex')

describe('enrollment commands', () => {
  describe('create enrollment', () => {
    it('creates an ISSUED PDA enrollment and returns the raw code only in the command response', async () => {
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository()
      const auditEventRepository = new CapturingAuditEventRepository()
      const handler = new CreateEnrollmentHandler(enrollmentRepository, auditEventRepository)

      const result = await handler.execute(
        new CreateEnrollmentCommand({
          tenantId: 'tenant-1',
          terminalDeviceType: 'PDA',
          displayName: 'Warehouse PDA 01',
          expectedManufacturerSerial: 'SN-001',
          expiresAt: new Date('2026-05-17T00:00:00.000Z'),
          notes: 'pilot device',
          operatorContext: {
            operatorAccountId: 'operator-1',
            operatorOrgId: 'org-1',
            traceId: 'trace-create-1'
          },
          now: new Date('2026-05-16T00:00:00.000Z')
        })
      )

      const stored = await enrollmentRepository.findById(result.enrollmentId)

      expect(result).toMatchObject({
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        displayName: 'Warehouse PDA 01',
        status: 'ISSUED',
        expiresAt: new Date('2026-05-17T00:00:00.000Z'),
        createdAt: new Date('2026-05-16T00:00:00.000Z')
      })
      expect(result.enrollmentCode).toMatch(/^ENR-[A-Z0-9]{12}$/)
      expect(stored).toMatchObject({
        enrollmentId: result.enrollmentId,
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        displayName: 'Warehouse PDA 01',
        status: 'ISSUED',
        expectedManufacturerSerial: 'SN-001',
        createdBy: 'operator-1',
        notes: 'pilot device'
      })
      expect(stored?.codeHash).toBe(hashEnrollmentCode(result.enrollmentCode))
      expect(stored?.codeHash).not.toBe(result.enrollmentCode)
      expect(JSON.stringify(stored)).not.toContain(result.enrollmentCode)
      expect(
        await enrollmentRepository.findByCodeHash(hashEnrollmentCode(result.enrollmentCode))
      ).toEqual(stored)
      expect(auditEventRepository.events).toHaveLength(1)
      expect(auditEventRepository.events[0]).toMatchObject({
        tenantId: 'tenant-1',
        operatorAccountId: 'operator-1',
        operatorOrgId: 'org-1',
        action: 'ENROLLMENT_CREATED',
        targetTerminalDeviceId: null,
        reason: null,
        traceId: 'trace-create-1'
      })
      expect(auditEventRepository.events[0].afterJson).toMatchObject({
        enrollmentId: result.enrollmentId,
        status: 'ISSUED',
        terminalDeviceType: 'PDA'
      })
    })
  })

  describe('activate enrollment', () => {
    it('activates a valid ISSUED enrollment as an ACTIVE terminal device and marks the enrollment USED', async () => {
      const store = new InMemoryTerminalDeviceStore()
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
      const deviceRepository = new InMemoryTerminalDeviceRepository(store)
      const activationRepository = new InMemoryTerminalDeviceActivationRepository(store)
      const auditEventRepository = new InMemoryTerminalDeviceAuditEventRepository(store)
      const enrollment = await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-activate-1',
          codeHash: hashEnrollmentCode('ENR-ACTIVATE001')
        })
      )
      const handler = new ActivateEnrollmentHandler(
        enrollmentRepository,
        deviceRepository,
        activationRepository,
        new TerminalDeviceCredentialVerifierService()
      )

      const result = await handler.execute(
        new ActivateEnrollmentCommand({
          enrollmentCode: 'ENR-ACTIVATE001',
          terminalDeviceType: 'PDA',
          identity: {
            manufacturerSerial: 'SN-001',
            androidId: 'android-1',
            appInstallationId: 'install-1',
            manufacturer: 'Seuic',
            model: 'Cruise Ge'
          },
          software: {
            androidVersion: '9',
            webViewVersion: '66.0.3359.158',
            appVersion: '2.0.0'
          },
          traceId: 'trace-activate-1',
          now: new Date('2026-05-16T00:05:00.000Z')
        })
      )

      expect(result).toMatchObject({
        activated: true,
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        deviceStatus: 'ACTIVE',
        enrollmentId: enrollment.enrollmentId,
        decisionCode: 'ALLOW'
      })
      expect(result.terminalDeviceId).toEqual(expect.any(String))

      const device = await deviceRepository.findById(result.terminalDeviceId as string)
      expect(device).toMatchObject({
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        displayName: 'Warehouse PDA 01',
        status: 'ACTIVE',
        enrollmentId: enrollment.enrollmentId,
        manufacturerSerial: 'SN-001',
        androidId: 'android-1',
        appInstallationId: 'install-1',
        manufacturer: 'Seuic',
        model: 'Cruise Ge',
        androidVersion: '9'
      })

      const usedEnrollment = await enrollmentRepository.findById(enrollment.enrollmentId)
      expect(usedEnrollment).toMatchObject({
        status: 'USED',
        usedByTerminalDeviceId: result.terminalDeviceId,
        usedAt: new Date('2026-05-16T00:05:00.000Z')
      })
      const auditEvents = await auditEventRepository.listByTerminalDeviceId(
        'tenant-1',
        result.terminalDeviceId as string
      )
      expect(auditEvents).toHaveLength(1)
      expect(auditEvents[0]).toMatchObject({
        tenantId: 'tenant-1',
        operatorAccountId: 'SYSTEM',
        action: 'ENROLLMENT_USED',
        targetTerminalDeviceId: result.terminalDeviceId,
        traceId: 'trace-activate-1'
      })
    })

    it('rejects non-PDA activation even if an old non-PDA enrollment exists', async () => {
      const store = new InMemoryTerminalDeviceStore()
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
      const deviceRepository = new InMemoryTerminalDeviceRepository(store)
      const activationRepository = new InMemoryTerminalDeviceActivationRepository(store)
      const auditEventRepository = new InMemoryTerminalDeviceAuditEventRepository(store)
      await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-non-pda-1',
          terminalDeviceType: 'KIOSK',
          codeHash: hashEnrollmentCode('ENR-KIOSK00001')
        })
      )
      const handler = new ActivateEnrollmentHandler(
        enrollmentRepository,
        deviceRepository,
        activationRepository,
        new TerminalDeviceCredentialVerifierService()
      )

      const result = await handler.execute(
        new ActivateEnrollmentCommand({
          enrollmentCode: 'ENR-KIOSK00001',
          terminalDeviceType: 'KIOSK',
          identity: {
            manufacturerSerial: 'SN-001',
            androidId: 'android-1',
            appInstallationId: 'install-1',
            manufacturer: 'Seuic',
            model: 'Cruise Ge'
          },
          software: {
            androidVersion: '9',
            webViewVersion: '66.0.3359.158',
            appVersion: '2.0.0'
          },
          traceId: 'trace-kiosk-1',
          now: new Date('2026-05-16T00:05:00.000Z')
        })
      )

      expect(result).toEqual({
        activated: false,
        terminalDeviceId: null,
        tenantId: null,
        terminalDeviceType: null,
        deviceStatus: null,
        enrollmentId: null,
        decisionCode: 'ENROLLMENT_TYPE_MISMATCH'
      })
      expect((await enrollmentRepository.findById('enrollment-non-pda-1'))?.status).toBe('ISSUED')
      expect(
        await auditEventRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-unused')
      ).toHaveLength(0)
    })

    it.each([
      [
        'expired enrollment',
        createEnrollment({
          enrollmentId: 'enrollment-expired-1',
          codeHash: hashEnrollmentCode('ENR-EXPIRED001'),
          expiresAt: new Date('2026-05-15T00:00:00.000Z')
        }),
        'ENROLLMENT_EXPIRED'
      ],
      [
        'used enrollment',
        createEnrollment({
          enrollmentId: 'enrollment-used-1',
          codeHash: hashEnrollmentCode('ENR-USED000000'),
          status: 'USED',
          usedAt: new Date('2026-05-16T00:00:00.000Z'),
          usedByTerminalDeviceId: 'terminal-device-used-1'
        }),
        'ENROLLMENT_USED'
      ],
      [
        'revoked enrollment',
        createEnrollment({
          enrollmentId: 'enrollment-revoked-1',
          codeHash: hashEnrollmentCode('ENR-REVOKED001'),
          status: 'REVOKED',
          revokedAt: new Date('2026-05-16T00:00:00.000Z'),
          revokedBy: 'operator-1'
        }),
        'ENROLLMENT_REVOKED'
      ]
    ])('rejects %s', async (_name, enrollment, decisionCode) => {
      const store = new InMemoryTerminalDeviceStore()
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
      const deviceRepository = new InMemoryTerminalDeviceRepository(store)
      const activationRepository = new InMemoryTerminalDeviceActivationRepository(store)
      const auditEventRepository = new InMemoryTerminalDeviceAuditEventRepository(store)
      await enrollmentRepository.create(enrollment)
      const handler = new ActivateEnrollmentHandler(
        enrollmentRepository,
        deviceRepository,
        activationRepository,
        new TerminalDeviceCredentialVerifierService()
      )

      const result = await handler.execute(
        new ActivateEnrollmentCommand({
          enrollmentCode: findCodeForHash(enrollment.codeHash),
          terminalDeviceType: 'PDA',
          identity: {
            manufacturerSerial: 'SN-001',
            androidId: 'android-1',
            appInstallationId: 'install-1',
            manufacturer: 'Seuic',
            model: 'Cruise Ge'
          },
          software: {
            androidVersion: '9',
            webViewVersion: '66.0.3359.158',
            appVersion: '2.0.0'
          },
          traceId: 'trace-reject-1',
          now: new Date('2026-05-16T00:05:00.000Z')
        })
      )

      expect(result).toEqual({
        activated: false,
        terminalDeviceId: null,
        tenantId: null,
        terminalDeviceType: null,
        deviceStatus: null,
        enrollmentId: null,
        decisionCode
      })
      expect(
        await auditEventRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-unused')
      ).toHaveLength(0)
    })

    it('rejects an expected manufacturer serial mismatch', async () => {
      const store = new InMemoryTerminalDeviceStore()
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
      const deviceRepository = new InMemoryTerminalDeviceRepository(store)
      const activationRepository = new InMemoryTerminalDeviceActivationRepository(store)
      const auditEventRepository = new InMemoryTerminalDeviceAuditEventRepository(store)
      await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-serial-mismatch-1',
          codeHash: hashEnrollmentCode('ENR-SERIAL0001'),
          expectedManufacturerSerial: 'SN-EXPECTED'
        })
      )
      const handler = new ActivateEnrollmentHandler(
        enrollmentRepository,
        deviceRepository,
        activationRepository,
        new TerminalDeviceCredentialVerifierService()
      )

      const result = await handler.execute(
        new ActivateEnrollmentCommand({
          enrollmentCode: 'ENR-SERIAL0001',
          terminalDeviceType: 'PDA',
          identity: {
            manufacturerSerial: 'SN-ACTUAL',
            androidId: 'android-1',
            appInstallationId: 'install-1',
            manufacturer: 'Seuic',
            model: 'Cruise Ge'
          },
          software: {
            androidVersion: '9',
            webViewVersion: '66.0.3359.158',
            appVersion: '2.0.0'
          },
          traceId: 'trace-serial-1',
          now: new Date('2026-05-16T00:05:00.000Z')
        })
      )

      expect(result.decisionCode).toBe('EXPECTED_SERIAL_MISMATCH')
      expect(result.activated).toBe(false)
      expect((await enrollmentRepository.findById('enrollment-serial-mismatch-1'))?.status).toBe(
        'ISSUED'
      )
      expect(
        await auditEventRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-unused')
      ).toHaveLength(0)
    })

    it('rejects a possible identity match without auto-recovering the old device', async () => {
      const store = new InMemoryTerminalDeviceStore()
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
      const deviceRepository = new InMemoryTerminalDeviceRepository(store)
      const activationRepository = new InMemoryTerminalDeviceActivationRepository(store)
      const auditEventRepository = new InMemoryTerminalDeviceAuditEventRepository(store)
      await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-identity-conflict-1',
          codeHash: hashEnrollmentCode('ENR-CONFLICT01')
        })
      )
      await deviceRepository.create(
        new TerminalDeviceEntity({
          terminalDeviceId: 'terminal-device-old-1',
          tenantId: 'tenant-1',
          terminalDeviceType: 'PDA',
          displayName: 'Old PDA',
          status: 'DISABLED',
          statusReason: 'old disabled device',
          enrollmentId: 'enrollment-old-1',
          manufacturerSerial: 'SN-001',
          androidId: 'android-old',
          appInstallationId: 'install-old',
          manufacturer: 'Seuic',
          model: 'Cruise Ge',
          androidVersion: '9',
          registeredAt: new Date('2026-05-15T00:00:00.000Z'),
          updatedAt: new Date('2026-05-15T00:00:00.000Z'),
          notes: null
        })
      )
      const handler = new ActivateEnrollmentHandler(
        enrollmentRepository,
        deviceRepository,
        activationRepository,
        new TerminalDeviceCredentialVerifierService()
      )

      const result = await handler.execute(
        new ActivateEnrollmentCommand({
          enrollmentCode: 'ENR-CONFLICT01',
          terminalDeviceType: 'PDA',
          identity: {
            manufacturerSerial: 'SN-001',
            androidId: 'android-1',
            appInstallationId: 'install-1',
            manufacturer: 'Seuic',
            model: 'Cruise Ge'
          },
          software: {
            androidVersion: '9',
            webViewVersion: '66.0.3359.158',
            appVersion: '2.0.0'
          },
          traceId: 'trace-conflict-1',
          now: new Date('2026-05-16T00:05:00.000Z')
        })
      )

      expect(result).toEqual({
        activated: false,
        terminalDeviceId: null,
        tenantId: null,
        terminalDeviceType: null,
        deviceStatus: null,
        enrollmentId: null,
        decisionCode: 'DEVICE_IDENTITY_CONFLICT'
      })
      expect(await deviceRepository.findById('terminal-device-old-1')).toMatchObject({
        status: 'DISABLED',
        enrollmentId: 'enrollment-old-1'
      })
      expect((await enrollmentRepository.findById('enrollment-identity-conflict-1'))?.status).toBe(
        'ISSUED'
      )
      expect(
        await auditEventRepository.listByTerminalDeviceId('tenant-1', 'terminal-device-old-1')
      ).toHaveLength(0)
    })

    it('commits activation as one consistency boundary and rejects stale duplicate activation', async () => {
      const store = new InMemoryTerminalDeviceStore()
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
      const deviceRepository = new InMemoryTerminalDeviceRepository(store)
      const activationRepository = new InMemoryTerminalDeviceActivationRepository(store)
      const enrollment = await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-race-1',
          codeHash: hashEnrollmentCode('ENR-RACE000001')
        })
      )
      const firstDevice = createDeviceFromEnrollment(enrollment, 'terminal-device-race-1')
      const firstUsedEnrollment = enrollment.markUsed(
        firstDevice.terminalDeviceId,
        new Date('2026-05-16T00:05:00.000Z')
      )
      const secondDevice = createDeviceFromEnrollment(enrollment, 'terminal-device-race-2')
      const secondUsedEnrollment = enrollment.markUsed(
        secondDevice.terminalDeviceId,
        new Date('2026-05-16T00:06:00.000Z')
      )

      await activationRepository.completeEnrollmentActivation({
        issuedEnrollment: enrollment,
        usedEnrollment: firstUsedEnrollment,
        terminalDevice: firstDevice,
        auditEvent: createActivationAuditEvent(
          enrollment,
          firstUsedEnrollment,
          firstDevice,
          'audit-race-1'
        )
      })

      await expect(
        activationRepository.completeEnrollmentActivation({
          issuedEnrollment: enrollment,
          usedEnrollment: secondUsedEnrollment,
          terminalDevice: secondDevice,
          auditEvent: createActivationAuditEvent(
            enrollment,
            secondUsedEnrollment,
            secondDevice,
            'audit-race-2'
          )
        })
      ).rejects.toMatchObject<TerminalDeviceError>({
        code: 'ENROLLMENT_ACTIVATION_CONFLICT'
      })

      expect(await deviceRepository.findById('terminal-device-race-1')).toEqual(firstDevice)
      expect(await deviceRepository.findById('terminal-device-race-2')).toBeNull()
      expect(await enrollmentRepository.findById(enrollment.enrollmentId)).toMatchObject({
        status: 'USED',
        usedByTerminalDeviceId: 'terminal-device-race-1'
      })
    })
  })

  describe('revoke enrollment', () => {
    it('revokes an ISSUED enrollment and writes an audit event', async () => {
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository()
      const auditEventRepository = new CapturingAuditEventRepository()
      await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-revoke-issued-1',
          codeHash: hashEnrollmentCode('ENR-REVOKE001')
        })
      )
      const handler = new RevokeEnrollmentHandler(enrollmentRepository, auditEventRepository)

      const result = await handler.execute(
        new RevokeEnrollmentCommand({
          tenantId: 'tenant-1',
          enrollmentId: 'enrollment-revoke-issued-1',
          reason: 'Issued by mistake',
          operatorContext: {
            operatorAccountId: 'operator-1',
            operatorOrgId: 'org-1',
            traceId: 'trace-revoke-1'
          },
          now: new Date('2026-05-16T01:00:00.000Z')
        })
      )

      expect(result).toEqual({
        enrollmentId: 'enrollment-revoke-issued-1',
        status: 'REVOKED',
        revokedAt: new Date('2026-05-16T01:00:00.000Z'),
        revokedBy: 'operator-1'
      })
      expect(await enrollmentRepository.findById('enrollment-revoke-issued-1')).toMatchObject({
        status: 'REVOKED',
        revokedAt: new Date('2026-05-16T01:00:00.000Z'),
        revokedBy: 'operator-1'
      })
      expect(auditEventRepository.events).toHaveLength(1)
      expect(auditEventRepository.events[0]).toMatchObject({
        tenantId: 'tenant-1',
        operatorAccountId: 'operator-1',
        operatorOrgId: 'org-1',
        action: 'ENROLLMENT_REVOKED',
        targetTerminalDeviceId: null,
        reason: 'Issued by mistake',
        traceId: 'trace-revoke-1'
      })
      expect(auditEventRepository.events[0].afterJson).toMatchObject({
        enrollmentId: 'enrollment-revoke-issued-1',
        status: 'REVOKED'
      })
    })

    it('does not revoke a USED enrollment', async () => {
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository()
      const auditEventRepository = new CapturingAuditEventRepository()
      await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-revoke-used-1',
          codeHash: hashEnrollmentCode('ENR-REVOKEUSED'),
          status: 'USED',
          usedAt: new Date('2026-05-16T00:30:00.000Z'),
          usedByTerminalDeviceId: 'terminal-device-1'
        })
      )
      const handler = new RevokeEnrollmentHandler(enrollmentRepository, auditEventRepository)

      await expect(
        handler.execute(
          new RevokeEnrollmentCommand({
            tenantId: 'tenant-1',
            enrollmentId: 'enrollment-revoke-used-1',
            reason: 'cleanup',
            operatorContext: {
              operatorAccountId: 'operator-1',
              traceId: 'trace-revoke-used-1'
            },
            now: new Date('2026-05-16T01:00:00.000Z')
          })
        )
      ).rejects.toMatchObject<TerminalDeviceError>({
        code: 'ENROLLMENT_USED'
      })
      expect((await enrollmentRepository.findById('enrollment-revoke-used-1'))?.status).toBe('USED')
      expect(auditEventRepository.events).toHaveLength(0)
    })

    it('requires a revoke reason', async () => {
      const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository()
      const auditEventRepository = new CapturingAuditEventRepository()
      await enrollmentRepository.create(
        createEnrollment({
          enrollmentId: 'enrollment-revoke-reason-1',
          codeHash: hashEnrollmentCode('ENR-REASON001')
        })
      )
      const handler = new RevokeEnrollmentHandler(enrollmentRepository, auditEventRepository)

      await expect(
        handler.execute(
          new RevokeEnrollmentCommand({
            tenantId: 'tenant-1',
            enrollmentId: 'enrollment-revoke-reason-1',
            reason: '   ',
            operatorContext: {
              operatorAccountId: 'operator-1',
              traceId: 'trace-revoke-reason-1'
            },
            now: new Date('2026-05-16T01:00:00.000Z')
          })
        )
      ).rejects.toMatchObject<TerminalDeviceError>({
        code: 'ENROLLMENT_REVOCATION_REASON_REQUIRED'
      })
      expect((await enrollmentRepository.findById('enrollment-revoke-reason-1'))?.status).toBe(
        'ISSUED'
      )
      expect(auditEventRepository.events).toHaveLength(0)
    })
  })
})

function createEnrollment(
  input: Partial<ConstructorParameters<typeof TerminalDeviceEnrollmentEntity>[0]>
): TerminalDeviceEnrollmentEntity {
  return new TerminalDeviceEnrollmentEntity({
    enrollmentId: 'enrollment-1',
    tenantId: 'tenant-1',
    terminalDeviceType: 'PDA',
    displayName: 'Warehouse PDA 01',
    codeHash: hashEnrollmentCode('ENR-DEFAULT001'),
    status: 'ISSUED',
    expectedManufacturerSerial: 'SN-001',
    expiresAt: new Date('2026-05-17T00:00:00.000Z'),
    usedAt: null,
    usedByTerminalDeviceId: null,
    revokedAt: null,
    revokedBy: null,
    createdBy: 'operator-1',
    createdAt: new Date('2026-05-16T00:00:00.000Z'),
    notes: null,
    ...input
  })
}

function createDeviceFromEnrollment(
  enrollment: TerminalDeviceEnrollmentEntity,
  terminalDeviceId: string
): TerminalDeviceEntity {
  return new TerminalDeviceEntity({
    terminalDeviceId,
    tenantId: enrollment.tenantId,
    terminalDeviceType: enrollment.terminalDeviceType,
    displayName: enrollment.displayName,
    status: 'ACTIVE',
    statusReason: null,
    enrollmentId: enrollment.enrollmentId,
    manufacturerSerial: 'SN-001',
    androidId: `android-${terminalDeviceId}`,
    appInstallationId: `install-${terminalDeviceId}`,
    manufacturer: 'Seuic',
    model: 'Cruise Ge',
    androidVersion: '9',
    registeredAt: new Date('2026-05-16T00:05:00.000Z'),
    updatedAt: new Date('2026-05-16T00:05:00.000Z'),
    notes: enrollment.notes
  })
}

function createActivationAuditEvent(
  enrollment: TerminalDeviceEnrollmentEntity,
  usedEnrollment: TerminalDeviceEnrollmentEntity,
  device: TerminalDeviceEntity,
  auditEventId: string
): TerminalDeviceAuditEventEntity {
  return new TerminalDeviceAuditEventEntity({
    auditEventId,
    tenantId: device.tenantId,
    operatorAccountId: 'SYSTEM',
    operatorOrgId: null,
    action: 'ENROLLMENT_USED',
    targetTerminalDeviceId: device.terminalDeviceId,
    beforeJson: {
      enrollmentId: enrollment.enrollmentId,
      status: enrollment.status
    },
    afterJson: {
      enrollmentId: usedEnrollment.enrollmentId,
      status: usedEnrollment.status,
      terminalDeviceId: device.terminalDeviceId,
      deviceStatus: device.status
    },
    reason: null,
    traceId: 'trace-race-1',
    occurredAt: new Date('2026-05-16T00:05:00.000Z')
  })
}

function findCodeForHash(codeHash: string): string {
  const knownCodes = ['ENR-EXPIRED001', 'ENR-USED000000', 'ENR-REVOKED001']
  const code = knownCodes.find((candidate) => hashEnrollmentCode(candidate) === codeHash)
  if (!code) {
    throw new Error(`Unknown seeded code hash: ${codeHash}`)
  }
  return code
}
