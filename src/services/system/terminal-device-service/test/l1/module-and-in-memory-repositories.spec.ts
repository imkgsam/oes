import { TerminalDeviceEnrollmentEntity } from '../../src/domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceEntity } from '../../src/domain/entities/terminal-device.entity'
import { TerminalDeviceAuditEventEntity } from '../../src/domain/entities/terminal-device-audit-event.entity'
import {
  InMemoryTerminalDeviceAuditEventRepository,
  InMemoryTerminalDeviceEnrollmentRepository,
  InMemoryTerminalDeviceRepository,
  InMemoryTerminalDeviceStore
} from '../../src/infrastructure/repositories/in-memory'
import { PrismaTerminalDeviceRepository } from '../../src/infrastructure/repositories/prisma/prisma-terminal-device.repository'

describe('terminal device module and in-memory repositories', () => {
  it('persists an enrollment and device in memory', async () => {
    const store = new InMemoryTerminalDeviceStore()
    const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
    const deviceRepository = new InMemoryTerminalDeviceRepository(store)

    const enrollment = await enrollmentRepository.create(
      new TerminalDeviceEnrollmentEntity({
        enrollmentId: 'enrollment-1',
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        displayName: 'PDA 01',
        codeHash: 'hash-1',
        status: 'ISSUED',
        expectedManufacturerSerial: 'SERIAL-1',
        expiresAt: new Date('2026-05-17T00:00:00.000Z'),
        usedAt: null,
        usedByTerminalDeviceId: null,
        revokedAt: null,
        revokedBy: null,
        createdBy: 'operator-1',
        createdAt: new Date('2026-05-16T00:00:00.000Z'),
        notes: 'initial enrollment'
      })
    )
    const device = await deviceRepository.create(
      new TerminalDeviceEntity({
        terminalDeviceId: 'terminal-device-1',
        tenantId: enrollment.tenantId,
        terminalDeviceType: enrollment.terminalDeviceType,
        displayName: enrollment.displayName,
        status: 'ACTIVE',
        statusReason: null,
        enrollmentId: enrollment.enrollmentId,
        manufacturerSerial: 'SERIAL-1',
        androidId: 'android-1',
        appInstallationId: 'install-1',
        manufacturer: 'Acme',
        model: 'PDA-X',
        androidVersion: '14',
        registeredAt: new Date('2026-05-16T00:01:00.000Z'),
        updatedAt: new Date('2026-05-16T00:01:00.000Z'),
        notes: null
      })
    )

    expect(await enrollmentRepository.findById('enrollment-1')).toEqual(enrollment)
    expect(await deviceRepository.findById('terminal-device-1')).toEqual(device)
    expect(device.tenantId).toBe('tenant-1')
  })

  it('mirrors unique enrollment code and device enrollment constraints in memory', async () => {
    const store = new InMemoryTerminalDeviceStore()
    const enrollmentRepository = new InMemoryTerminalDeviceEnrollmentRepository(store)
    const deviceRepository = new InMemoryTerminalDeviceRepository(store)

    const firstEnrollment = new TerminalDeviceEnrollmentEntity({
      enrollmentId: 'enrollment-unique-1',
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      displayName: 'PDA 01',
      codeHash: 'hash-unique',
      status: 'ISSUED',
      expectedManufacturerSerial: null,
      expiresAt: new Date('2026-05-17T00:00:00.000Z'),
      usedAt: null,
      usedByTerminalDeviceId: null,
      revokedAt: null,
      revokedBy: null,
      createdBy: 'operator-1',
      createdAt: new Date('2026-05-16T00:00:00.000Z'),
      notes: null
    })

    await enrollmentRepository.create(firstEnrollment)
    await expect(
      enrollmentRepository.create(
        new TerminalDeviceEnrollmentEntity({
          ...firstEnrollment,
          enrollmentId: 'enrollment-unique-2'
        })
      )
    ).rejects.toThrow('Terminal device enrollment code hash already exists')

    const firstDevice = new TerminalDeviceEntity({
      terminalDeviceId: 'terminal-device-unique-1',
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      displayName: 'PDA 01',
      status: 'ACTIVE',
      statusReason: null,
      enrollmentId: 'enrollment-unique-1',
      manufacturerSerial: null,
      androidId: null,
      appInstallationId: null,
      manufacturer: null,
      model: null,
      androidVersion: null,
      registeredAt: new Date('2026-05-16T00:01:00.000Z'),
      updatedAt: new Date('2026-05-16T00:01:00.000Z'),
      notes: null
    })

    await deviceRepository.create(firstDevice)
    await expect(
      deviceRepository.create(
        new TerminalDeviceEntity({
          ...firstDevice,
          terminalDeviceId: 'terminal-device-unique-2'
        })
      )
    ).rejects.toThrow('Terminal device enrollment is already linked')
  })

  it('mirrors audit event primary-key uniqueness in memory', async () => {
    const auditEventRepository = new InMemoryTerminalDeviceAuditEventRepository(new InMemoryTerminalDeviceStore())
    const event = new TerminalDeviceAuditEventEntity({
      auditEventId: 'audit-event-1',
      tenantId: 'tenant-1',
      operatorAccountId: 'operator-1',
      operatorOrgId: null,
      action: 'STATUS_CHANGED',
      targetTerminalDeviceId: 'terminal-device-1',
      beforeJson: { status: 'ACTIVE' },
      afterJson: { status: 'DISABLED' },
      reason: 'test status transition',
      traceId: 'trace-1',
      occurredAt: new Date('2026-05-16T00:00:00.000Z')
    })

    await auditEventRepository.create(event)
    await expect(auditEventRepository.create(event)).rejects.toThrow('Terminal device audit event already exists')
  })

  it('uses credential version and hash as the Prisma compare-and-swap predicate', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 })
    const repository = new PrismaTerminalDeviceRepository({ terminalDevice: { updateMany } } as never)
    const current = credentialDevice()
    const replacement = new TerminalDeviceEntity({ ...current, deviceCredentialHash: 'hash-2', deviceCredentialVersion: 2 })

    await expect(repository.compareAndSwapCredential(current, replacement)).resolves.toBeNull()
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        terminalDeviceId: 'terminal-device-cas-1',
        deviceCredentialVersion: 1,
        deviceCredentialHash: 'hash-1',
        deviceCredentialState: 'ACTIVE',
        status: 'ACTIVE'
      })
    }))
  })

  it('encloses lifecycle and audit writes in one Prisma transaction', async () => {
    const current = credentialDevice()
    const audit = new TerminalDeviceAuditEventEntity({
      auditEventId: 'audit-transaction-1', tenantId: current.tenantId, operatorAccountId: 'operator-1', operatorOrgId: null,
      action: 'STATUS_CHANGED', targetTerminalDeviceId: current.terminalDeviceId, beforeJson: { status: 'ACTIVE' },
      afterJson: { status: 'LOST' }, reason: 'lost', traceId: 'trace-1', occurredAt: new Date('2026-08-11T00:00:00.000Z')
    })
    const update = jest.fn().mockResolvedValue(current)
    const create = jest.fn().mockRejectedValue(new Error('audit insert failed'))
    const transaction = jest.fn(async (callback) => callback({
      terminalDevice: { update }, terminalDeviceAuditEvent: { create }
    }))
    const repository = new PrismaTerminalDeviceRepository({ $transaction: transaction } as never)

    await expect(repository.commitStatusChange(current, audit)).rejects.toMatchObject({
      code: 'TERMINAL_DEVICE_PERSISTENCE_ERROR'
    })
    expect(transaction).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('leaves the shipped in-memory device unchanged when its atomic audit commit is rejected', async () => {
    const store = new InMemoryTerminalDeviceStore()
    const repository = new InMemoryTerminalDeviceRepository(store)
    const current = credentialDevice()
    await repository.create(current)
    store.auditEventIds.add('audit-duplicate-1')
    const audit = new TerminalDeviceAuditEventEntity({
      auditEventId: 'audit-duplicate-1', tenantId: current.tenantId, operatorAccountId: 'operator-1', operatorOrgId: null,
      action: 'STATUS_CHANGED', targetTerminalDeviceId: current.terminalDeviceId, beforeJson: { status: 'ACTIVE' },
      afterJson: { status: 'LOST' }, reason: 'lost', traceId: null, occurredAt: new Date('2026-08-11T00:00:00.000Z')
    })

    await expect(repository.commitStatusChange(new TerminalDeviceEntity({ ...current, status: 'LOST' }), audit)).rejects.toMatchObject({
      code: 'AUDIT_EVENT_ALREADY_EXISTS'
    })
    expect((await repository.findById(current.terminalDeviceId))?.status).toBe('ACTIVE')
  })
})

// Builds a credential-bearing active device fixture for Prisma mutation tests.
function credentialDevice(): TerminalDeviceEntity {
  return new TerminalDeviceEntity({
    terminalDeviceId: 'terminal-device-cas-1', tenantId: 'tenant-1', terminalDeviceType: 'PDA', displayName: 'PDA 1',
    status: 'ACTIVE', statusReason: null, enrollmentId: null, manufacturerSerial: null, androidId: null,
    appInstallationId: 'install-1', manufacturer: null, model: null, androidVersion: null,
    registeredAt: new Date('2026-08-11T00:00:00.000Z'), updatedAt: new Date('2026-08-11T00:00:00.000Z'), notes: null,
    deviceCredentialHash: 'hash-1', deviceCredentialVersion: 1, deviceCredentialState: 'ACTIVE'
  })
}
