import { TerminalDeviceAuditEventEntity } from '../../src/domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceEnrollmentEntity } from '../../src/domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceHeartbeatRecordEntity } from '../../src/domain/entities/terminal-device-heartbeat-record.entity'
import { TerminalDeviceRuntimeSnapshotEntity } from '../../src/domain/entities/terminal-device-runtime-snapshot.entity'
import { TerminalDeviceVersionPolicyEntity } from '../../src/domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceEntity } from '../../src/domain/entities/terminal-device.entity'
import {
  PrismaTerminalDeviceActivationRepository,
  PrismaTerminalDeviceAuditEventRepository,
  PrismaTerminalDeviceEnrollmentRepository,
  PrismaTerminalDeviceRepository,
  PrismaTerminalDeviceRuntimeSnapshotRepository,
  PrismaTerminalDeviceVersionPolicyRepository
} from '../../src/infrastructure/repositories/prisma'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('terminal-device-service Prisma repositories L2', () => {
  let prisma: PrismaService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('persists enrollment activation so a fresh repository can list the device by tenant', async () => {
    const enrollmentRepository = new PrismaTerminalDeviceEnrollmentRepository(prisma)
    const activationRepository = new PrismaTerminalDeviceActivationRepository(prisma)
    const freshDeviceRepository = new PrismaTerminalDeviceRepository(prisma)
    const freshAuditRepository = new PrismaTerminalDeviceAuditEventRepository(prisma)
    const now = new Date('2026-05-17T00:00:00.000Z')
    const enrollment = await enrollmentRepository.create(
      new TerminalDeviceEnrollmentEntity({
        enrollmentId: `${prefix}_enrollment_1`,
        tenantId: `${prefix}_tenant_1`,
        terminalDeviceType: 'PDA',
        displayName: 'Meilong PDA 01',
        codeHash: `${prefix}_hash_1`,
        status: 'ISSUED',
        expectedManufacturerSerial: 'SERIAL-1',
        expiresAt: new Date('2026-05-18T00:00:00.000Z'),
        usedAt: null,
        usedByTerminalDeviceId: null,
        revokedAt: null,
        revokedBy: null,
        createdBy: `${prefix}_operator_1`,
        createdAt: now,
        notes: 'persistent activation'
      })
    )
    const device = new TerminalDeviceEntity({
      terminalDeviceId: `${prefix}_device_1`,
      tenantId: enrollment.tenantId,
      terminalDeviceType: enrollment.terminalDeviceType,
      displayName: enrollment.displayName,
      status: 'ACTIVE',
      statusReason: null,
      enrollmentId: enrollment.enrollmentId,
      manufacturerSerial: 'SERIAL-1',
      androidId: `${prefix}_android_1`,
      appInstallationId: `${prefix}_install_1`,
      manufacturer: 'SEUIC',
      model: 'CRUISE Ge',
      androidVersion: '9',
      registeredAt: now,
      updatedAt: now,
      notes: enrollment.notes
    })
    const usedEnrollment = enrollment.markUsed(device.terminalDeviceId, now)
    const auditEvent = new TerminalDeviceAuditEventEntity({
      auditEventId: `${prefix}_audit_1`,
      tenantId: device.tenantId,
      operatorAccountId: 'SYSTEM',
      operatorOrgId: null,
      action: 'ENROLLMENT_USED',
      targetTerminalDeviceId: device.terminalDeviceId,
      beforeJson: { status: enrollment.status },
      afterJson: { status: usedEnrollment.status, terminalDeviceId: device.terminalDeviceId },
      reason: null,
      traceId: `${prefix}_trace_1`,
      occurredAt: now
    })

    await activationRepository.completeEnrollmentActivation({
      issuedEnrollment: enrollment,
      usedEnrollment,
      terminalDevice: device,
      auditEvent
    })

    expect(await freshDeviceRepository.findById(device.terminalDeviceId)).toMatchObject({
      terminalDeviceId: device.terminalDeviceId,
      tenantId: device.tenantId,
      status: 'ACTIVE',
      enrollmentId: enrollment.enrollmentId
    })
    expect(await freshDeviceRepository.listByTenant(device.tenantId)).toHaveLength(1)
    expect(await enrollmentRepository.findById(enrollment.enrollmentId)).toMatchObject({
      status: 'USED',
      usedByTerminalDeviceId: device.terminalDeviceId
    })
    expect(await freshAuditRepository.listByTerminalDeviceId(device.tenantId, device.terminalDeviceId)).toHaveLength(1)
  })

  it('persists runtime snapshots and version policy audit without requiring a device target', async () => {
    const deviceRepository = new PrismaTerminalDeviceRepository(prisma)
    const runtimeRepository = new PrismaTerminalDeviceRuntimeSnapshotRepository(prisma)
    const versionPolicyRepository = new PrismaTerminalDeviceVersionPolicyRepository(prisma)
    const auditRepository = new PrismaTerminalDeviceAuditEventRepository(prisma)
    const now = new Date('2026-05-17T01:00:00.000Z')
    const device = await deviceRepository.create(
      new TerminalDeviceEntity({
        terminalDeviceId: `${prefix}_device_runtime_1`,
        tenantId: `${prefix}_tenant_1`,
        terminalDeviceType: 'PDA',
        displayName: 'Runtime PDA',
        status: 'ACTIVE',
        statusReason: null,
        enrollmentId: null,
        manufacturerSerial: null,
        androidId: `${prefix}_android_runtime_1`,
        appInstallationId: `${prefix}_install_runtime_1`,
        manufacturer: 'SEUIC',
        model: 'CRUISE Ge',
        androidVersion: '9',
        registeredAt: now,
        updatedAt: now,
        notes: null
      })
    )

    await runtimeRepository.upsert(
      new TerminalDeviceRuntimeSnapshotEntity({
        terminalDeviceId: device.terminalDeviceId,
        tenantId: device.tenantId,
        presenceStatus: 'ONLINE',
        lastHeartbeatAt: now,
        lastClientTime: now,
        appVersion: '0.1.0',
        androidVersion: '9',
        webViewVersion: '66.0.3359.158',
        networkStatus: 'ONLINE',
        networkType: 'WIFI',
        batteryLevel: 88,
        appState: 'FOREGROUND',
        lastReportedAccountId: `${prefix}_account_1`,
        lastReportedSessionId: `${prefix}_session_1`
      })
    )
    await runtimeRepository.appendHeartbeatRecord(
      new TerminalDeviceHeartbeatRecordEntity({
        heartbeatId: `${prefix}_heartbeat_1`,
        terminalDeviceId: device.terminalDeviceId,
        tenantId: device.tenantId,
        presenceStatus: 'ONLINE',
        receivedAt: now,
        clientTime: now,
        appVersion: '0.1.0',
        androidVersion: '9',
        webViewVersion: '66.0.3359.158',
        networkStatus: 'ONLINE',
        networkType: 'WIFI',
        batteryLevel: 88,
        appState: 'FOREGROUND',
        reportedAccountId: `${prefix}_account_1`,
        reportedSessionId: `${prefix}_session_1`,
        traceId: `${prefix}_trace_heartbeat`
      })
    )
    const policy = await versionPolicyRepository.upsert(
      new TerminalDeviceVersionPolicyEntity({
        versionPolicyId: `${prefix}_version_policy_1`,
        tenantId: device.tenantId,
        terminalDeviceType: 'PDA',
        minSupportedAppVersion: '0.1.0',
        latestAppVersion: '0.2.0',
        upgradeRequired: false,
        upgradeRecommended: true,
        apkDownloadUrl: null,
        releaseNotesUrl: null,
        updatedBy: `${prefix}_operator_1`,
        updatedAt: now,
        createdAt: now
      })
    )
    await auditRepository.create(
      new TerminalDeviceAuditEventEntity({
        auditEventId: `${prefix}_audit_policy_1`,
        tenantId: device.tenantId,
        operatorAccountId: `${prefix}_operator_1`,
        operatorOrgId: null,
        action: 'VERSION_POLICY_UPSERTED',
        targetTerminalDeviceId: null,
        beforeJson: null,
        afterJson: { versionPolicyId: policy.versionPolicyId },
        reason: 'integration test policy',
        traceId: `${prefix}_trace_2`,
        occurredAt: now
      })
    )

    expect(await runtimeRepository.findByTerminalDeviceId(device.terminalDeviceId)).toMatchObject({
      terminalDeviceId: device.terminalDeviceId,
      presenceStatus: 'ONLINE',
      batteryLevel: 88
    })
    await expect(
      runtimeRepository.listHeartbeatRecords({
        tenantId: device.tenantId,
        terminalDeviceId: device.terminalDeviceId
      })
    ).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          heartbeatId: `${prefix}_heartbeat_1`,
          reportedSessionId: `${prefix}_session_1`
        })
      ],
      total: 1
    })
    expect(await versionPolicyRepository.findByTenantAndType(device.tenantId, 'PDA')).toMatchObject({
      versionPolicyId: policy.versionPolicyId,
      latestAppVersion: '0.2.0'
    })
  })
})
