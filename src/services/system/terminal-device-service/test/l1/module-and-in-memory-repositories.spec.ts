import { TerminalDeviceEnrollmentEntity } from '../../src/domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceEntity } from '../../src/domain/entities/terminal-device.entity'
import { TerminalDeviceAuditEventEntity } from '../../src/domain/entities/terminal-device-audit-event.entity'
import {
  InMemoryTerminalDeviceAuditEventRepository,
  InMemoryTerminalDeviceEnrollmentRepository,
  InMemoryTerminalDeviceRepository,
  InMemoryTerminalDeviceStore
} from '../../src/infrastructure/repositories/in-memory'

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
})
