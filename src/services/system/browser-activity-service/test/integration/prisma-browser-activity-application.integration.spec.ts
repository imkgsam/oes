import { PrismaBrowserActivityApplication } from '../../src/infrastructure/prisma/prisma-browser-activity-application'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** Supplies the exact trusted audit facts required by Browser Activity sensitive operations. */
function trustedAudit(prefix: string, tenantId: string, action = 'TEST_BROWSER_ACTIVITY_AUDIT') {
  return {
    action,
    operatorAccountId: `${prefix}_admin_1`,
    requestId: `${prefix}_request_1`,
    sessionId: `${prefix}_session_1`,
    tenantId,
    traceId: `${prefix}_trace_1`
  }
}

function visit(prefix: string) {
  return {
    activeDurationSeconds: 60,
    clientVisitId: `${prefix}_visit_1`,
    domain: 'supplier.example',
    dwellDurationSeconds: 75,
    endedAt: '2026-06-25T09:01:15.000Z',
    extensionSessionId: `${prefix}_extension_session_1`,
    foregroundDurationSeconds: 70,
    idleDurationSeconds: 15,
    lastFlushedAt: '2026-06-25T09:01:15.000Z',
    mergeKey: `${prefix}_account_1:supplier.example:https://supplier.example/orders`,
    pageTitle: 'Supplier Orders',
    startedAt: '2026-06-25T09:00:00.000Z',
    url: 'https://supplier.example/orders'
  }
}

describe('browser-activity-service Prisma application Integration', () => {
  let prisma: PrismaService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
  })

  beforeEach(() => {
    prefix = createTestPrefix()
  })

  afterEach(async () => {
    if (prisma) {
      await cleanupByPrefix(prisma, prefix)
    }
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('persists tenant policy and visit summaries for fresh application reads', async () => {
    const now = () => Date.parse('2026-06-25T09:02:00.000Z')
    const service = new PrismaBrowserActivityApplication(prisma, { now })
    const tenantId = `${prefix}_tenant_1`

    await service.updatePolicy({
      audit: trustedAudit(prefix, tenantId, 'BROWSER_ACTIVITY_POLICY_UPDATE'),
      operator: {
        accountId: `${prefix}_admin_1`,
        terminal: 'WEB'
      },
      policy: {
        aggregateRetentionDays: 365,
        enabled: true,
        rawRetentionDays: 90
      },
      tenantId
    })
    await service.updateEmployeeAuditGrant({
      accountId: `${prefix}_account_1`,
      enabled: true,
      operator: {
        accountId: `${prefix}_admin_1`,
        terminal: 'WEB'
      },
      audit: trustedAudit(prefix, tenantId, 'BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE'),
      tenantId
    })
    await service.appendVisitSessions({
      operator: {
        accountId: `${prefix}_account_1`,
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      sessions: [visit(prefix)],
      tenantId
    })

    const fresh = new PrismaBrowserActivityApplication(prisma, { now })
    await expect(fresh.getPolicy({ tenantId })).resolves.toEqual({
      aggregateRetentionDays: 365,
      enabled: true,
      rawRetentionDays: 90
    })
    await expect(fresh.getOverview({ period: 'LAST_7_DAYS', tenantId })).resolves.toEqual(
      expect.objectContaining({
        employees: [
          expect.objectContaining({
            accountId: `${prefix}_account_1`,
            activeDurationSeconds: 60,
            displayName: '陈双鹏',
            pageViewCount: 1
          })
        ],
        metrics: expect.objectContaining({
          activeDurationSeconds: 60,
          urlCount: 1
        })
      })
    )
  })

  it('persists heartbeat-derived online presence for fresh application reads', async () => {
    const tenantId = `${prefix}_tenant_presence`
    const service = new PrismaBrowserActivityApplication(prisma, {
      now: () => Date.parse('2026-06-25T09:31:00.000Z')
    })

    await service.updateEmployeeAuditGrant({
      accountId: `${prefix}_account_online`,
      enabled: true,
      operator: {
        accountId: `${prefix}_admin_1`,
        terminal: 'WEB'
      },
      audit: trustedAudit(prefix, tenantId, 'BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE'),
      tenantId
    })
    await service.updateEmployeeAuditGrant({
      accountId: `${prefix}_account_stale`,
      enabled: true,
      operator: {
        accountId: `${prefix}_admin_1`,
        terminal: 'WEB'
      },
      audit: trustedAudit(prefix, tenantId, 'BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE'),
      tenantId
    })
    await service.heartbeat({
      extensionSessionId: `${prefix}_extension_online`,
      observedAt: '2026-06-25T09:30:10.000Z',
      operator: {
        accountId: `${prefix}_account_online`,
        displayName: '在线员工',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId
    })
    await service.heartbeat({
      extensionSessionId: `${prefix}_extension_stale`,
      observedAt: '2026-06-25T09:28:59.000Z',
      operator: {
        accountId: `${prefix}_account_stale`,
        displayName: '延迟员工',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId
    })

    const fresh = new PrismaBrowserActivityApplication(prisma, {
      now: () => Date.parse('2026-06-25T09:31:00.000Z')
    })
    await expect(fresh.getOnlinePresence({ tenantId, status: 'ALL' })).resolves.toEqual(
      expect.objectContaining({
        employees: [
          expect.objectContaining({
            accountId: `${prefix}_account_online`,
            displayName: '在线员工',
            onlineStatus: 'ONLINE'
          }),
          expect.objectContaining({
            accountId: `${prefix}_account_stale`,
            displayName: '延迟员工',
            onlineStatus: 'STALE'
          })
        ],
        summary: {
          offlineCount: 0,
          onlineCount: 1,
          staleCount: 1
        }
      })
    )
  })

  it('persists employee audit grants and returns disabled control without storing visits when a grant is disabled', async () => {
    const service = new PrismaBrowserActivityApplication(prisma)
    const tenantId = `${prefix}_tenant_grant`

    await expect(
      service.getAuditControl({
        operator: {
          accountId: `${prefix}_account_1`,
          terminal: 'BROWSER_EXTENSION'
        },
        tenantId
      })
    ).resolves.toEqual({
      enabled: false,
      nextPollAfterSeconds: 60,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
    })

    await expect(
      service.appendVisitSessions({
        operator: {
          accountId: `${prefix}_account_1`,
          displayName: '陈双鹏',
          terminal: 'BROWSER_EXTENSION'
        },
        sessions: [visit(prefix)],
        tenantId
      })
    ).resolves.toEqual({
      acceptedCount: 0,
      policyEnabled: false,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED',
      rejectedCount: 1
    })

    await service.updateEmployeeAuditGrant({
      accountId: `${prefix}_account_1`,
      enabled: true,
      operator: {
        accountId: `${prefix}_admin_1`,
        terminal: 'WEB'
      },
      audit: trustedAudit(prefix, tenantId, 'BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE'),
      tenantId
    })

    const fresh = new PrismaBrowserActivityApplication(prisma)
    await expect(
      fresh.getAuditControl({
        operator: {
          accountId: `${prefix}_account_1`,
          terminal: 'BROWSER_EXTENSION'
        },
        tenantId
      })
    ).resolves.toEqual({
      enabled: true,
      nextPollAfterSeconds: 60,
      reasonCode: 'ENABLED'
    })
    await expect(
      fresh.getEmployeeAuditGrants({
        accountIds: [`${prefix}_account_1`, `${prefix}_account_2`],
        tenantId
      })
    ).resolves.toEqual({
      grants: [
        expect.objectContaining({
          accountId: `${prefix}_account_1`,
          enabled: true,
          updatedBy: `${prefix}_admin_1`
        }),
        {
          accountId: `${prefix}_account_2`,
          enabled: false
        }
      ]
    })
  })

  it('fails closed for missing audit facts and leaves a management write uncommitted when audit persistence fails', async () => {
    const service = new PrismaBrowserActivityApplication(prisma)
    const tenantId = `${prefix}_tenant_atomic`
    const input = {
      audit: trustedAudit(prefix, tenantId, 'BROWSER_ACTIVITY_POLICY_UPDATE'),
      operator: { accountId: `${prefix}_admin_1`, terminal: 'WEB' },
      policy: { aggregateRetentionDays: 365, enabled: true, rawRetentionDays: 90 },
      tenantId
    }

    await expect(service.updatePolicy({ ...input, audit: undefined } as never)).rejects.toThrow(
      'Trusted browser activity audit action is required'
    )

    const transaction = jest
      .spyOn(prisma, '$transaction')
      .mockRejectedValueOnce(new Error('audit persistence unavailable'))
    await expect(service.updatePolicy(input)).rejects.toThrow('audit persistence unavailable')
    transaction.mockRestore()

    await expect(service.getPolicy({ tenantId })).resolves.toEqual({
      aggregateRetentionDays: 365,
      enabled: false,
      rawRetentionDays: 90
    })
  })
})
