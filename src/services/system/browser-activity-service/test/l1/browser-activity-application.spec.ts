import { createInMemoryBrowserActivityApplication } from '../../src/application/testing/create-in-memory-browser-activity-application'
import { BrowserActivityApplication } from '../../src/application/browser-activity-application'

function validVisitSession() {
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

/** Provides the complete trusted facts mandatory for Browser Activity management and sensitive reads. */
function trustedAudit(action = 'TEST_BROWSER_ACTIVITY_AUDIT', tenantId = 'tenant-1') {
  return {
    action,
    operatorAccountId: 'admin-1',
    requestId: 'request-1',
    sessionId: 'session-1',
    tenantId,
    traceId: 'trace-1'
  }
}

async function enableEmployeeGrant(
  service: BrowserActivityApplication,
  tenantId = 'tenant-1',
  accountId = 'account-1'
) {
  return service.updateEmployeeAuditGrant({
    accountId,
    enabled: true,
    operator: {
      accountId: 'admin-1',
      terminal: 'WEB'
    },
    audit: trustedAudit('BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE', tenantId),
    tenantId
  })
}

// Verifies browser-activity-service defaults to no collection and gates ingest by extension context.
describe('browser activity application', () => {
  it('defaults tenant policy to disabled with P1 retention defaults', async () => {
    const service = createInMemoryBrowserActivityApplication()

    await expect(service.getPolicy({ tenantId: 'tenant-1' })).resolves.toEqual({
      aggregateRetentionDays: 365,
      enabled: false,
      rawRetentionDays: 90
    })
  })

  it('rejects visit sessions when the extension context is missing', async () => {
    const service = createInMemoryBrowserActivityApplication()

    await expect(
      service.appendVisitSessions({
        operator: {
          accountId: 'account-1',
          terminal: 'WEB'
        },
        sessions: [validVisitSession()],
        tenantId: 'tenant-1'
      })
    ).rejects.toThrow('BROWSER_EXTENSION terminal is required')
  })

  it('defaults employee audit grants to disabled and updates them from web administrator context', async () => {
    const service = createInMemoryBrowserActivityApplication()

    await expect(
      service.getEmployeeAuditGrants({
        accountIds: ['account-1'],
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      grants: [
        {
          accountId: 'account-1',
          enabled: false
        }
      ]
    })

    await expect(enableEmployeeGrant(service)).resolves.toEqual(
      expect.objectContaining({
        accountId: 'account-1',
        enabled: true,
        updatedBy: 'admin-1'
      })
    )
  })

  it('returns disabled control and rejects visit sessions without storing data while the employee audit grant is disabled', async () => {
    const service = createInMemoryBrowserActivityApplication()

    await expect(
      service.getAuditControl({
        operator: {
          accountId: 'account-1',
          terminal: 'BROWSER_EXTENSION'
        },
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      enabled: false,
      nextPollAfterSeconds: 60,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
    })

    await expect(
      service.appendVisitSessions({
        operator: {
          accountId: 'account-1',
          terminal: 'BROWSER_EXTENSION'
        },
        sessions: [validVisitSession()],
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      acceptedCount: 0,
      policyEnabled: false,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED',
      rejectedCount: 1
    })

    await expect(
      service.getOverview({ period: 'LAST_7_DAYS', tenantId: 'tenant-1' })
    ).resolves.toEqual(
      expect.objectContaining({
        metrics: expect.objectContaining({
          employeeCount: 0,
          urlCount: 0
        })
      })
    )
  })

  it('accepts visit sessions after the employee audit grant is enabled for an extension tenant session', async () => {
    const service = createInMemoryBrowserActivityApplication()
    await enableEmployeeGrant(service)

    await expect(
      service.getAuditControl({
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
      service.appendVisitSessions({
        operator: {
          accountId: 'account-1',
          terminal: 'BROWSER_EXTENSION'
        },
        sessions: [validVisitSession()],
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      acceptedCount: 1,
      policyEnabled: true,
      rejectedCount: 0
    })
  })

  it('derives online presence only from authenticated extension heartbeat thresholds', async () => {
    const service = new BrowserActivityApplication({
      now: () => Date.parse('2026-06-25T09:31:00.000Z')
    })
    await enableEmployeeGrant(service, 'tenant-1', 'account-online')
    await enableEmployeeGrant(service, 'tenant-1', 'account-stale')
    await enableEmployeeGrant(service, 'tenant-1', 'account-offline')

    await expect(
      service.heartbeat({
        extensionSessionId: 'web-session',
        observedAt: '2026-06-25T09:30:30.000Z',
        operator: {
          accountId: 'account-web',
          terminal: 'WEB'
        },
        tenantId: 'tenant-1'
      })
    ).rejects.toThrow('BROWSER_EXTENSION terminal is required')

    await service.heartbeat({
      extensionSessionId: 'extension-online',
      observedAt: '2026-06-25T09:30:10.000Z',
      operator: {
        accountId: 'account-online',
        displayName: '在线员工',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId: 'tenant-1'
    })
    await service.heartbeat({
      extensionSessionId: 'extension-stale',
      observedAt: '2026-06-25T09:28:59.000Z',
      operator: {
        accountId: 'account-stale',
        displayName: '延迟员工',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId: 'tenant-1'
    })
    await service.heartbeat({
      extensionSessionId: 'extension-offline',
      observedAt: '2026-06-25T09:27:59.000Z',
      operator: {
        accountId: 'account-offline',
        displayName: '离线员工',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId: 'tenant-1'
    })

    await expect(
      service.getOnlinePresence({ tenantId: 'tenant-1', status: 'ALL' })
    ).resolves.toEqual({
      employees: [
        expect.objectContaining({
          accountId: 'account-online',
          displayName: '在线员工',
          extensionSessionId: 'extension-online',
          lastHeartbeatAt: '2026-06-25T09:30:10.000Z',
          onlineStatus: 'ONLINE'
        }),
        expect.objectContaining({
          accountId: 'account-stale',
          displayName: '延迟员工',
          onlineStatus: 'STALE'
        }),
        expect.objectContaining({
          accountId: 'account-offline',
          displayName: '离线员工',
          onlineStatus: 'OFFLINE'
        })
      ],
      serverTime: '2026-06-25T09:31:00.000Z',
      summary: {
        offlineCount: 1,
        onlineCount: 1,
        staleCount: 1
      },
      thresholds: {
        heartbeatIntervalSeconds: 60,
        onlineWithinSeconds: 90,
        staleWithinSeconds: 180
      }
    })
  })

  it('marks one extension session offline immediately when the extension disconnects', async () => {
    const service = new BrowserActivityApplication({
      now: () => Date.parse('2026-06-25T09:31:00.000Z')
    })
    await enableEmployeeGrant(service)
    await service.appendVisitSessions({
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      sessions: [validVisitSession()],
      tenantId: 'tenant-1'
    })
    await service.heartbeat({
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:30:30.000Z',
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId: 'tenant-1'
    })

    await expect(
      service.disconnect({
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
      service.getOverview({ period: 'LAST_1_DAY', tenantId: 'tenant-1' })
    ).resolves.toEqual(
      expect.objectContaining({
        employees: [
          expect.objectContaining({
            accountId: 'account-1',
            onlineStatus: 'OFFLINE'
          })
        ],
        metrics: expect.objectContaining({
          onlineEmployeeCount: 0,
          staleEmployeeCount: 0
        })
      })
    )
  })

  it('adds heartbeat-derived online status to overview employees without using web login state', async () => {
    const service = new BrowserActivityApplication({
      now: () => Date.parse('2026-06-25T09:31:00.000Z')
    })
    await enableEmployeeGrant(service)
    await service.appendVisitSessions({
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      sessions: [validVisitSession()],
      tenantId: 'tenant-1'
    })
    await service.heartbeat({
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:30:20.000Z',
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      tenantId: 'tenant-1'
    })

    await expect(
      service.getOverview({ period: 'LAST_7_DAYS', tenantId: 'tenant-1' })
    ).resolves.toEqual(
      expect.objectContaining({
        employees: [
          expect.objectContaining({
            accountId: 'account-1',
            lastHeartbeatAt: '2026-06-25T09:30:20.000Z',
            onlineStatus: 'ONLINE'
          })
        ],
        metrics: expect.objectContaining({
          onlineEmployeeCount: 1,
          staleEmployeeCount: 0
        })
      })
    )
  })

  it('returns overview, employee timeline, domain aggregation, and URL search from stored visit facts', async () => {
    const service = createInMemoryBrowserActivityApplication()
    await enableEmployeeGrant(service)
    await service.appendVisitSessions({
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      sessions: [
        validVisitSession(),
        {
          ...validVisitSession(),
          activeDurationSeconds: 30,
          clientVisitId: 'visit-2',
          domain: 'mail.example',
          dwellDurationSeconds: 45,
          endedAt: '2026-06-25T10:01:00.000Z',
          foregroundDurationSeconds: 40,
          idleDurationSeconds: 10,
          lastFlushedAt: '2026-06-25T10:01:00.000Z',
          mergeKey: 'account-1:mail.example:https://mail.example/inbox',
          pageTitle: 'Inbox',
          startedAt: '2026-06-25T10:00:15.000Z',
          url: 'https://mail.example/inbox'
        }
      ],
      tenantId: 'tenant-1'
    })

    await expect(
      service.getOverview({ period: 'LAST_7_DAYS', tenantId: 'tenant-1' })
    ).resolves.toEqual(
      expect.objectContaining({
        employees: [
          expect.objectContaining({
            accountId: 'account-1',
            activeDurationSeconds: 90,
            displayName: '陈双鹏',
            pageViewCount: 2
          })
        ],
        metrics: expect.objectContaining({
          activeDurationSeconds: 90,
          employeeCount: 1,
          idleDurationSeconds: 10,
          urlCount: 2
        }),
        period: 'LAST_7_DAYS'
      })
    )

    await expect(
      service.getEmployeeTimeline({
        audit: trustedAudit('BROWSER_ACTIVITY_EMPLOYEE_TIMELINE_READ'),
        employeeAccountId: 'account-1',
        period: 'LAST_7_DAYS',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      employeeAccountId: 'account-1',
      visits: [
        expect.objectContaining({
          domain: 'supplier.example',
          pageTitle: 'Supplier',
          url: 'https://supplier.example'
        }),
        expect.objectContaining({
          domain: 'mail.example',
          pageTitle: 'Inbox',
          url: 'https://mail.example/inbox'
        })
      ]
    })

    await expect(
      service.getDomainAggregation({
        audit: trustedAudit('BROWSER_ACTIVITY_DOMAIN_AGGREGATION_READ'),
        employeeAccountId: 'account-1',
        period: 'LAST_7_DAYS',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      domains: [
        expect.objectContaining({
          activeDurationSeconds: 60,
          domain: 'supplier.example',
          visitCount: 1
        }),
        expect.objectContaining({
          activeDurationSeconds: 30,
          domain: 'mail.example',
          visitCount: 1
        })
      ]
    })

    await expect(
      service.searchUrls({
        audit: trustedAudit('BROWSER_ACTIVITY_URL_DETAIL_SEARCH'),
        keyword: 'inbox',
        period: 'LAST_7_DAYS',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      results: [
        expect.objectContaining({
          activeDurationSeconds: 30,
          domain: 'mail.example',
          employeeDisplayName: '陈双鹏',
          pageTitle: 'Inbox',
          url: 'https://mail.example/inbox',
          visitCount: 1
        })
      ]
    })
  })

  it('filters overview and employee facts by the selected short monitoring period', async () => {
    const service = new BrowserActivityApplication({
      now: () => Date.parse('2026-06-25T12:00:00.000Z')
    })
    await enableEmployeeGrant(service)

    await service.appendVisitSessions({
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION'
      },
      sessions: [
        {
          ...validVisitSession(),
          activeDurationSeconds: 600,
          clientVisitId: 'visit-recent',
          domain: 'recent.example',
          endedAt: '2026-06-25T11:45:00.000Z',
          foregroundDurationSeconds: 600,
          lastFlushedAt: '2026-06-25T11:45:00.000Z',
          mergeKey: 'account-1:recent.example:https://recent.example',
          pageTitle: 'Recent',
          startedAt: '2026-06-25T11:35:00.000Z',
          url: 'https://recent.example'
        },
        {
          ...validVisitSession(),
          activeDurationSeconds: 900,
          clientVisitId: 'visit-older',
          domain: 'older.example',
          endedAt: '2026-06-25T09:10:00.000Z',
          foregroundDurationSeconds: 900,
          lastFlushedAt: '2026-06-25T09:10:00.000Z',
          mergeKey: 'account-1:older.example:https://older.example',
          pageTitle: 'Older',
          startedAt: '2026-06-25T08:55:00.000Z',
          url: 'https://older.example'
        }
      ],
      tenantId: 'tenant-1'
    })

    await expect(
      service.getOverview({ period: 'LAST_1_HOUR', tenantId: 'tenant-1' })
    ).resolves.toEqual(
      expect.objectContaining({
        metrics: expect.objectContaining({
          activeDurationSeconds: 600,
          urlCount: 1
        }),
        period: 'LAST_1_HOUR'
      })
    )
    await expect(
      service.getEmployeeTimeline({
        audit: trustedAudit('BROWSER_ACTIVITY_EMPLOYEE_TIMELINE_READ'),
        employeeAccountId: 'account-1',
        period: 'LAST_1_HOUR',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      employeeAccountId: 'account-1',
      visits: [
        expect.objectContaining({
          domain: 'recent.example',
          visitId: 'visit-recent'
        })
      ]
    })
    await expect(
      service.getDomainAggregation({
        audit: trustedAudit('BROWSER_ACTIVITY_DOMAIN_AGGREGATION_READ'),
        employeeAccountId: 'account-1',
        period: 'LAST_1_HOUR',
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      domains: [
        expect.objectContaining({
          activeDurationSeconds: 600,
          domain: 'recent.example'
        })
      ]
    })
  })

  it('rejects direct management and sensitive reads before state can bypass a trusted audit envelope', async () => {
    const service = createInMemoryBrowserActivityApplication()
    const update = {
      operator: { accountId: 'admin-1', terminal: 'WEB' },
      policy: { aggregateRetentionDays: 365, enabled: true, rawRetentionDays: 90 },
      tenantId: 'tenant-1'
    }

    await expect(service.updatePolicy(update as never)).rejects.toThrow(
      'Trusted browser activity audit action is required'
    )
    await expect(service.getPolicy({ tenantId: 'tenant-1' })).resolves.toEqual({
      aggregateRetentionDays: 365,
      enabled: false,
      rawRetentionDays: 90
    })
    await expect(
      service.searchUrls({
        keyword: 'supplier',
        period: 'LAST_1_DAY',
        tenantId: 'tenant-1'
      } as never)
    ).rejects.toThrow('Trusted browser activity audit action is required')

    for (const field of [
      'operatorAccountId',
      'sessionId',
      'tenantId',
      'requestId',
      'traceId'
    ] as const) {
      const audit = { ...trustedAudit(), [field]: ' ' }
      await expect(
        service.getDomainAggregation({
          audit,
          period: 'LAST_1_DAY',
          tenantId: 'tenant-1'
        })
      ).rejects.toThrow('Trusted browser activity audit')
    }
  })
})
