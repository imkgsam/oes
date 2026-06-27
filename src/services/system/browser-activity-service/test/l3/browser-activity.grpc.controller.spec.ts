import { BrowserActivityApplication } from '../../src/application/browser-activity-application'
import { createInMemoryBrowserActivityApplication } from '../../src/application/testing/create-in-memory-browser-activity-application'
import { BrowserActivityGrpcController } from '../../src/interfaces/grpc/browser-activity.grpc.controller'

function visit() {
  return {
    activeDurationSeconds: 60,
    clientVisitId: 'visit-1',
    domain: 'supplier.example',
    dwellDurationSeconds: 60,
    endedAt: '2026-06-25T09:01:00.000Z',
    extensionSessionId: 'extension-session-1',
    foregroundDurationSeconds: 60,
    idleDurationSeconds: 0,
    lastFlushedAt: '2026-06-25T09:01:00.000Z',
    mergeKey: 'account-1:supplier.example:https://supplier.example',
    pageTitle: 'Supplier',
    startedAt: '2026-06-25T09:00:00.000Z',
    url: 'https://supplier.example'
  }
}

describe('BrowserActivityGrpcController', () => {
  it('maps policy, ingest, overview, timeline, domain, and URL search requests', async () => {
    const application = createInMemoryBrowserActivityApplication()
    const controller = new BrowserActivityGrpcController(application)

    await expect(
      controller.updatePolicy({
        operator: {
          accountId: 'admin-1',
          terminal: 'WEB'
        },
        policy: {
          aggregateRetentionDays: 365,
          enabled: true,
          rawRetentionDays: 90
        },
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      policy: {
        aggregateRetentionDays: 365,
        enabled: true,
        rawRetentionDays: 90
      }
    })
    await expect(
      controller.updateEmployeeAuditGrant({
        accountId: 'account-1',
        enabled: true,
        operator: {
          accountId: 'admin-1',
          terminal: 'WEB'
        },
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      grant: expect.objectContaining({
        accountId: 'account-1',
        enabled: true,
        updatedBy: 'admin-1'
      })
    })
    await expect(
      controller.getEmployeeAuditGrants({
        accountIds: ['account-1', 'account-2'],
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      grants: [
        expect.objectContaining({
          accountId: 'account-1',
          enabled: true
        }),
        {
          accountId: 'account-2',
          enabled: false
        }
      ]
    })
    await expect(
      controller.getAuditControl({
        operator: {
          accountId: 'account-1',
          terminal: 'BROWSER_EXTENSION'
        },
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      enabled: true,
      nextPollAfterSeconds: 60,
      reasonCode: 'ENABLED'
    })
    await expect(
      controller.appendVisitSessions({
        operator: {
          accountId: 'account-1',
          displayName: '陈双鹏',
          terminal: 'BROWSER_EXTENSION'
        },
        sessions: [visit()],
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      acceptedCount: 1,
      policyEnabled: true,
      rejectedCount: 0
    })

    await expect(controller.getOverview({ period: 'LAST_7_DAYS', tenantId: 'tenant-1' })).resolves.toEqual(
      expect.objectContaining({
        employees: [
          expect.objectContaining({
            accountId: 'account-1',
            activeDurationSeconds: 60,
            displayName: '陈双鹏'
          })
        ],
        period: 'LAST_7_DAYS'
      })
    )
    await expect(
      controller.getEmployeeTimeline({
        employeeAccountId: 'account-1',
        period: 'LAST_7_DAYS',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      employeeAccountId: 'account-1',
      visits: [
        expect.objectContaining({
          domain: 'supplier.example',
          visitId: 'visit-1'
        })
      ]
    })
    await expect(
      controller.getDomainAggregation({
        employeeAccountId: 'account-1',
        period: 'LAST_7_DAYS',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      domains: [
        expect.objectContaining({
          domain: 'supplier.example',
          visitCount: 1
        })
      ]
    })
    await expect(
      controller.searchUrls({
        keyword: 'supplier',
        operator: {
          accountId: 'admin-1',
          terminal: 'WEB'
        },
        period: 'LAST_7_DAYS',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      results: [
        expect.objectContaining({
          domain: 'supplier.example',
          employeeDisplayName: '陈双鹏',
          visitCount: 1
        })
      ]
    })
  })

  it('maps online presence requests through the gRPC controller', async () => {
    const application = new BrowserActivityApplication({
      now: () => Date.parse('2026-06-25T09:31:00.000Z')
    })
    const controller = new BrowserActivityGrpcController(application)

    await controller.updateEmployeeAuditGrant({
      accountId: 'account-1',
      enabled: true,
      operator: {
        accountId: 'admin-1',
        terminal: 'WEB'
      },
      tenantId: 'tenant-1'
    })
    await controller.heartbeat({
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:30:10.000Z',
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId: 'tenant-1'
    })

    await expect(
      controller.getOnlinePresence({
        includeOfflineWithinMinutes: 1440,
        status: 'ALL',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        employees: [
          expect.objectContaining({
            accountId: 'account-1',
            displayName: '陈双鹏',
            onlineStatus: 'ONLINE'
          })
        ],
        summary: {
          offlineCount: 0,
          onlineCount: 1,
          staleCount: 0
        }
      })
    )

    await expect(
      controller.disconnect({
        extensionSessionId: 'extension-session-1',
        observedAt: '2026-06-25T09:31:00.000Z',
        operator: {
          accountId: 'account-1',
          terminal: 'BROWSER_EXTENSION'
        },
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({ accepted: true })

    await expect(
      controller.getOnlinePresence({
        includeOfflineWithinMinutes: 1440,
        status: 'ALL',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        employees: [],
        summary: {
          offlineCount: 0,
          onlineCount: 0,
          staleCount: 0
        }
      })
    )
  })
})
