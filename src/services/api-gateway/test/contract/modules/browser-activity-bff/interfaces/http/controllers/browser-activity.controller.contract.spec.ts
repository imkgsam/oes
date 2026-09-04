import { Reflector } from '@nestjs/core'
import {
  BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { BrowserActivityController } from '../../../../../../../src/modules/browser-activity-bff/interfaces/http/controllers/browser-activity.controller'

describe('BrowserActivityController', () => {
  const service = {
    getDomainAggregation: jest.fn(),
    getEmployeeTimeline: jest.fn(),
    getEmployeeAuditGrants: jest.fn(),
    getOnlinePresence: jest.fn(),
    getOverview: jest.fn(),
    getPolicy: jest.fn(),
    searchUrls: jest.fn(),
    updateEmployeeAuditGrant: jest.fn(),
    updatePolicy: jest.fn()
  }
  const controller = new BrowserActivityController(service as any)
  const source = { user: { aid: 'admin-1', terminal: 'WEB', tid: 'tenant-1' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('guards tenant policy reads and writes with policy permissions', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.getPolicy)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.updatePolicy)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_MANAGE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.updateEmployeeAuditGrant)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.POLICY_MANAGE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.getEmployeeAuditGrants)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.OVERVIEW_READ] })
  })

  it('guards overview, employee timeline, domain, and URL reads with dedicated audit permissions', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.getOverview)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.OVERVIEW_READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.getOnlinePresence)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.OVERVIEW_READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.getEmployeeTimeline)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.EMPLOYEE_DETAIL_READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.getDomainAggregation)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.URL_DETAIL_READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, BrowserActivityController.prototype.searchUrls)
    ).toEqual({ all: [BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES.URL_DETAIL_READ] })
  })

  it('forwards admin requests to BrowserActivityBffService without accepting tenant context from clients', async () => {
    service.getPolicy.mockResolvedValue({ enabled: false })
    service.updatePolicy.mockResolvedValue({ enabled: true })
    service.updateEmployeeAuditGrant.mockResolvedValue({ accountId: 'employee-1', enabled: true })
    service.getEmployeeAuditGrants.mockResolvedValue({ grants: [] })
    service.getOverview.mockResolvedValue({ employees: [] })
    service.getOnlinePresence.mockResolvedValue({ employees: [] })
    service.getEmployeeTimeline.mockResolvedValue({ visits: [] })
    service.getDomainAggregation.mockResolvedValue({ domains: [] })
    service.searchUrls.mockResolvedValue({ results: [] })

    await controller.getPolicy(source as any)
    await controller.updatePolicy(
      {
        aggregateRetentionDays: 365,
        enabled: true,
        rawRetentionDays: 90,
        tenantId: 'spoofed-tenant'
      } as any,
      source as any
    )
    await controller.getOverview({ period: 'LAST_7_DAYS' }, source as any)
    await controller.getEmployeeAuditGrants({ accountIds: ['employee-1'] }, source as any)
    await controller.updateEmployeeAuditGrant('employee-1', { enabled: true }, source as any)
    await controller.getOnlinePresence(
      { includeOfflineWithinMinutes: 1440, status: 'ALL' },
      source as any
    )
    await controller.getEmployeeTimeline('employee-1', { period: 'LAST_30_DAYS' }, source as any)
    await controller.getDomainAggregation(
      { employeeAccountId: 'employee-1', period: 'LAST_7_DAYS' },
      source as any
    )
    await controller.searchUrls({ keyword: 'supplier', period: 'LAST_7_DAYS' }, source as any)

    expect(service.getPolicy).toHaveBeenCalledWith(source)
    expect(service.updatePolicy).toHaveBeenCalledWith(
      {
        aggregateRetentionDays: 365,
        enabled: true,
        rawRetentionDays: 90,
        tenantId: 'spoofed-tenant'
      },
      source
    )
    expect(service.getOverview).toHaveBeenCalledWith({ period: 'LAST_7_DAYS' }, source)
    expect(service.getEmployeeAuditGrants).toHaveBeenCalledWith({ accountIds: ['employee-1'] }, source)
    expect(service.updateEmployeeAuditGrant).toHaveBeenCalledWith('employee-1', { enabled: true }, source)
    expect(service.getOnlinePresence).toHaveBeenCalledWith(
      { includeOfflineWithinMinutes: 1440, status: 'ALL' },
      source
    )
    expect(service.getEmployeeTimeline).toHaveBeenCalledWith(
      'employee-1',
      { period: 'LAST_30_DAYS' },
      source
    )
    expect(service.getDomainAggregation).toHaveBeenCalledWith(
      { employeeAccountId: 'employee-1', period: 'LAST_7_DAYS' },
      source
    )
    expect(service.searchUrls).toHaveBeenCalledWith({ keyword: 'supplier', period: 'LAST_7_DAYS' }, source)
  })
})
