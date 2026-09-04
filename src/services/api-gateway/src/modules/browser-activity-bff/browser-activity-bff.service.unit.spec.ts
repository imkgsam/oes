import { ForbiddenException } from '@nestjs/common'

import { BrowserActivityBffService } from './browser-activity-bff.service'

describe('BrowserActivityBffService', () => {
  const browserActivityClient = {
    appendVisitSessions: jest.fn(),
    getDomainAggregation: jest.fn(),
    getEmployeeAuditGrants: jest.fn(),
    getAuditControl: jest.fn(),
    getEmployeeTimeline: jest.fn(),
    getOnlinePresence: jest.fn(),
    getOverview: jest.fn(),
    getPolicy: jest.fn(),
    heartbeat: jest.fn(),
    disconnect: jest.fn(),
    searchUrls: jest.fn(),
    updateEmployeeAuditGrant: jest.fn(),
    updatePolicy: jest.fn()
  }
  const permissionService = {
    getAccountTerminalAccess: jest.fn()
  }
  const service = new BrowserActivityBffService(browserActivityClient as any, permissionService as any)
  const extensionSource = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: {
      aid: 'account-1',
      displayName: '陈双鹏',
      terminal: 'BROWSER_EXTENSION',
      tid: 'tenant-1',
      userId: 'user-1'
    }
  }
  const webSource = {
    requestId: 'req-web-1',
    traceId: 'trace-web-1',
    user: {
      aid: 'admin-account-1',
      displayName: '梁嘉铭',
      terminal: 'WEB',
      tid: 'tenant-web-1',
      userId: 'admin-user-1'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    permissionService.getAccountTerminalAccess.mockResolvedValue({
      effectiveAllowedTerminals: ['WEB', 'BROWSER_EXTENSION']
    })
    browserActivityClient.getEmployeeAuditGrants.mockResolvedValue({
      grants: []
    })
  })

  it('forwards visit sessions with trusted extension session context instead of client-supplied context', async () => {
    browserActivityClient.appendVisitSessions.mockResolvedValue({
      acceptedCount: 1,
      policyEnabled: true,
      rejectedCount: 0
    })

    await expect(
      service.appendVisitSessions(
        {
          operator: {
            accountId: 'spoofed-account',
            terminal: 'WEB'
          },
          sessions: [
            {
              activeDurationSeconds: 60,
              clientVisitId: 'visit-1',
              domain: 'supplier.example',
              dwellDurationSeconds: 60,
              endedAt: '2026-06-25T09:01:00.000Z',
              extensionSessionId: 'extension-session-1',
              foregroundDurationSeconds: 60,
              idleDurationSeconds: 0,
              lastFlushedAt: '2026-06-25T09:01:00.000Z',
              mergeKey: 'spoofed:supplier.example:https://supplier.example',
              pageTitle: 'Supplier',
              startedAt: '2026-06-25T09:00:00.000Z',
              url: 'https://supplier.example'
            }
          ],
          tenantId: 'spoofed-tenant'
        } as any,
        extensionSource
      )
    ).resolves.toEqual({
      acceptedCount: 1,
      policyEnabled: true,
      rejectedCount: 0
    })

    expect(browserActivityClient.appendVisitSessions).toHaveBeenCalledWith({
      audit: expect.objectContaining({
        reason: 'BROWSER_EXTENSION_INGEST'
      }),
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION',
        userId: 'user-1'
      },
      sessions: expect.any(Array),
      tenantId: 'tenant-1',
      trace: {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    })
  })

  it('rejects extension ingest from non-browser-extension terminal source', async () => {
    await expect(
      service.appendVisitSessions(
        {
          sessions: []
        },
        {
          user: {
            aid: 'account-1',
            terminal: 'WEB',
            tid: 'tenant-1'
          }
        }
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(browserActivityClient.appendVisitSessions).not.toHaveBeenCalled()
  })

  it('forwards heartbeat only with trusted extension session context', async () => {
    browserActivityClient.heartbeat.mockResolvedValue({
      accepted: true,
      nextHeartbeatAfterSeconds: 60,
      policyEnabled: true
    })

    await service.heartbeat(
      {
        extensionSessionId: 'extension-session-1',
        observedAt: '2026-06-25T09:30:00.000Z',
        tenantId: 'spoofed-tenant'
      } as any,
      extensionSource
    )

    expect(browserActivityClient.heartbeat).toHaveBeenCalledWith({
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:30:00.000Z',
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION',
        userId: 'user-1'
      },
      tenantId: 'tenant-1',
      trace: {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    })
  })

  it('forwards extension disconnect only with trusted extension session context', async () => {
    browserActivityClient.disconnect.mockResolvedValue({ accepted: true })

    await service.disconnect(
      {
        extensionSessionId: 'extension-session-1',
        observedAt: '2026-06-25T09:31:00.000Z',
        tenantId: 'spoofed-tenant'
      } as any,
      extensionSource
    )

    expect(browserActivityClient.disconnect).toHaveBeenCalledWith({
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:31:00.000Z',
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION',
        userId: 'user-1'
      },
      tenantId: 'tenant-1',
      trace: {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    })
  })

  it('forwards audit control checks only with trusted extension session context', async () => {
    browserActivityClient.getAuditControl.mockResolvedValue({
      enabled: false,
      nextPollAfterSeconds: 60,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
    })

    await expect(
      service.getAuditControl(
        {
          tenantId: 'spoofed-tenant'
        } as any,
        extensionSource
      )
    ).resolves.toEqual({
      enabled: false,
      nextPollAfterSeconds: 60,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
    })

    expect(browserActivityClient.getAuditControl).toHaveBeenCalledWith({
      operator: {
        accountId: 'account-1',
        displayName: '陈双鹏',
        terminal: 'BROWSER_EXTENSION',
        userId: 'user-1'
      },
      tenantId: 'tenant-1',
      trace: {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    })
  })

  it('forwards policy reads with trusted web tenant context', async () => {
    browserActivityClient.getPolicy.mockResolvedValue({
      aggregateRetentionDays: 365,
      enabled: false,
      rawRetentionDays: 90
    })

    await expect(service.getPolicy(webSource)).resolves.toEqual({
      aggregateRetentionDays: 365,
      enabled: false,
      rawRetentionDays: 90
    })

    expect(browserActivityClient.getPolicy).toHaveBeenCalledWith({
      operator: {
        accountId: 'admin-account-1',
        displayName: '梁嘉铭',
        terminal: 'WEB',
        userId: 'admin-user-1'
      },
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
  })

  it('updates policy through trusted web context while ignoring client-supplied tenant context', async () => {
    browserActivityClient.updatePolicy.mockResolvedValue({
      aggregateRetentionDays: 365,
      enabled: true,
      rawRetentionDays: 90
    })

    await service.updatePolicy(
      {
        aggregateRetentionDays: 365,
        enabled: true,
        rawRetentionDays: 90,
        tenantId: 'spoofed-tenant'
      } as any,
      webSource
    )

    expect(browserActivityClient.updatePolicy).toHaveBeenCalledWith({
      audit: {
        reason: 'BROWSER_ACTIVITY_POLICY_UPDATE'
      },
      operator: {
        accountId: 'admin-account-1',
        displayName: '梁嘉铭',
        terminal: 'WEB',
        userId: 'admin-user-1'
      },
      policy: {
        aggregateRetentionDays: 365,
        enabled: true,
        rawRetentionDays: 90
      },
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
  })

  it('forwards admin read queries with trusted web tenant context', async () => {
    browserActivityClient.getOverview.mockResolvedValue({
      employees: [
        {
          accountId: 'employee-1',
          displayName: '陈双鹏'
        }
      ]
    })
    browserActivityClient.getEmployeeAuditGrants.mockResolvedValue({
      grants: [
        {
          accountId: 'employee-1',
          enabled: true
        }
      ]
    })
    browserActivityClient.getOnlinePresence.mockResolvedValue({ employees: [] })
    browserActivityClient.getEmployeeTimeline.mockResolvedValue({ visits: [] })
    browserActivityClient.getDomainAggregation.mockResolvedValue({ domains: [] })
    browserActivityClient.searchUrls.mockResolvedValue({ results: [] })

    await expect(service.getOverview({ period: 'LAST_1_DAY' }, webSource)).resolves.toEqual({
      employees: [
        {
          accountId: 'employee-1',
          auditEnabled: true,
          browserExtensionLoginAllowed: true,
          displayName: '陈双鹏'
        }
      ]
    })
    await service.getOnlinePresence(
      { includeOfflineWithinMinutes: 1440, status: 'ALL' },
      webSource
    )
    await service.getEmployeeTimeline('employee-1', { period: 'LAST_1_MONTH' }, webSource)
    await service.getDomainAggregation(
      { employeeAccountId: 'employee-1', period: 'LAST_1_WEEK' },
      webSource
    )
    await service.searchUrls({ keyword: 'supplier', period: 'LAST_1_HOUR' }, webSource)

    expect(browserActivityClient.getOverview).toHaveBeenCalledWith({
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      period: 'LAST_1_DAY',
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
    expect(browserActivityClient.getEmployeeAuditGrants).toHaveBeenCalledWith({
      accountIds: ['employee-1'],
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
    expect(permissionService.getAccountTerminalAccess).toHaveBeenCalledWith({
      accountId: 'employee-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-web-1'
    }, webSource)
    expect(browserActivityClient.getOnlinePresence).toHaveBeenCalledWith({
      includeOfflineWithinMinutes: 1440,
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      status: 'ALL',
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
    expect(browserActivityClient.getEmployeeTimeline).toHaveBeenCalledWith({
      employeeAccountId: 'employee-1',
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      period: 'LAST_1_MONTH',
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
    expect(browserActivityClient.getDomainAggregation).toHaveBeenCalledWith({
      employeeAccountId: 'employee-1',
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      period: 'LAST_1_WEEK',
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
    expect(browserActivityClient.searchUrls).toHaveBeenCalledWith({
      audit: {
        reason: 'BROWSER_ACTIVITY_URL_DETAIL_SEARCH'
      },
      keyword: 'supplier',
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      period: 'LAST_1_HOUR',
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
  })

  it('rejects admin reads from non-web terminal source', async () => {
    await expect(service.getOverview({ period: 'LAST_7_DAYS' }, extensionSource)).rejects.toBeInstanceOf(
      ForbiddenException
    )

    expect(browserActivityClient.getOverview).not.toHaveBeenCalled()
  })

  it('updates employee audit grants only after browser extension terminal access is available', async () => {
    browserActivityClient.updateEmployeeAuditGrant.mockResolvedValue({
      accountId: 'employee-1',
      enabled: true
    })

    await expect(
      service.updateEmployeeAuditGrant('employee-1', { enabled: true }, webSource)
    ).resolves.toEqual({
      accountId: 'employee-1',
      enabled: true
    })

    expect(permissionService.getAccountTerminalAccess).toHaveBeenCalledWith({
      accountId: 'employee-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-web-1'
    }, webSource)
    expect(browserActivityClient.updateEmployeeAuditGrant).toHaveBeenCalledWith({
      accountId: 'employee-1',
      audit: {
        reason: 'BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE'
      },
      enabled: true,
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })

    jest.clearAllMocks()
    permissionService.getAccountTerminalAccess.mockResolvedValue({
      effectiveAllowedTerminals: ['WEB']
    })

    await expect(
      service.updateEmployeeAuditGrant('employee-1', { enabled: true }, webSource)
    ).rejects.toThrow('Browser Extension terminal access is required')
    expect(browserActivityClient.updateEmployeeAuditGrant).not.toHaveBeenCalled()
  })

  it('reads employee audit grants with browser extension login eligibility for directory accounts', async () => {
    browserActivityClient.getEmployeeAuditGrants.mockResolvedValue({
      grants: [
        {
          accountId: 'employee-1',
          enabled: true
        },
        {
          accountId: 'employee-2',
          enabled: false
        }
      ]
    })
    permissionService.getAccountTerminalAccess
      .mockResolvedValueOnce({ effectiveAllowedTerminals: ['WEB', 'BROWSER_EXTENSION'] })
      .mockResolvedValueOnce({ effectiveAllowedTerminals: ['WEB'] })

    await expect(
      service.getEmployeeAuditGrants({ accountIds: ['employee-1', 'employee-2'] }, webSource)
    ).resolves.toEqual({
      grants: [
        {
          accountId: 'employee-1',
          browserExtensionLoginAllowed: true,
          enabled: true
        },
        {
          accountId: 'employee-2',
          browserExtensionLoginAllowed: false,
          enabled: false
        }
      ]
    })

    expect(browserActivityClient.getEmployeeAuditGrants).toHaveBeenCalledWith({
      accountIds: ['employee-1', 'employee-2'],
      operator: expect.objectContaining({ accountId: 'admin-account-1', terminal: 'WEB' }),
      tenantId: 'tenant-web-1',
      trace: {
        requestId: 'req-web-1',
        traceId: 'trace-web-1'
      }
    })
  })

  it('treats omitted terminal access lists as browser-extension unavailable instead of failing', async () => {
    browserActivityClient.getEmployeeAuditGrants.mockResolvedValue({
      grants: [
        {
          accountId: 'employee-without-terminal-facts',
          enabled: false
        },
        {
          accountId: 'employee-with-extension',
          enabled: true
        }
      ]
    })
    permissionService.getAccountTerminalAccess
      .mockResolvedValueOnce({
        accountId: 'employee-without-terminal-facts',
        hasOverride: false,
        scopeLevel: 'TENANT',
        tenantId: 'tenant-web-1'
      })
      .mockResolvedValueOnce({
        accountId: 'employee-with-extension',
        effectiveAllowedTerminals: ['WEB', 'BROWSER_EXTENSION'],
        hasOverride: true,
        scopeLevel: 'TENANT',
        tenantId: 'tenant-web-1'
      })

    await expect(
      service.getEmployeeAuditGrants({
        accountIds: ['employee-without-terminal-facts', 'employee-with-extension']
      }, webSource)
    ).resolves.toEqual({
      grants: [
        {
          accountId: 'employee-without-terminal-facts',
          browserExtensionLoginAllowed: false,
          enabled: false
        },
        {
          accountId: 'employee-with-extension',
          browserExtensionLoginAllowed: true,
          enabled: true
        }
      ]
    })
  })
})
