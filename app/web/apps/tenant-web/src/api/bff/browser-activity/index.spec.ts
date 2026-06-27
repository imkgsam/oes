import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const put = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    put
  }
}))

// Verifies the browser activity API client stays on the dedicated browser-activity BFF surface.
describe('tenant-web browser activity api', () => {
  beforeEach(() => {
    get.mockReset()
    put.mockReset()
  })

  it('loads the tenant browser activity audit workbench through dedicated endpoints', async () => {
    const {
      getBrowserActivityDomainAggregationApi,
      getBrowserActivityEmployeeTimelineApi,
      getBrowserActivityEmployeeAuditGrantsApi,
      getBrowserActivityOnlinePresenceApi,
      getBrowserActivityOverviewApi,
      updateBrowserActivityEmployeeAuditGrantApi,
      searchBrowserActivityUrlsApi
    } = await import('./index')

    await getBrowserActivityOverviewApi({ period: 'LAST_1_DAY' })
    await getBrowserActivityOnlinePresenceApi({
      includeOfflineWithinMinutes: 1440,
      status: 'ALL'
    })
    await getBrowserActivityEmployeeTimelineApi('account-1', { period: 'LAST_1_HOUR' })
    await getBrowserActivityEmployeeAuditGrantsApi(['account-1', 'account-2'])
    await getBrowserActivityDomainAggregationApi({ period: 'LAST_1_WEEK', employeeAccountId: 'account-1' })
    await searchBrowserActivityUrlsApi({ keyword: 'supplier', period: 'LAST_1_MONTH' })
    await updateBrowserActivityEmployeeAuditGrantApi('account-1', { enabled: true })

    expect(get).toHaveBeenNthCalledWith(1, '/browser-activity/overview', {
      suppressErrorMessage: true,
      params: { period: 'LAST_1_DAY' }
    })
    expect(get).toHaveBeenNthCalledWith(2, '/browser-activity/online-presence', {
      suppressErrorMessage: true,
      params: { includeOfflineWithinMinutes: 1440, status: 'ALL' }
    })
    expect(get).toHaveBeenNthCalledWith(
      3,
      '/browser-activity/employees/account-1/timeline',
      {
        suppressErrorMessage: true,
        params: { period: 'LAST_1_HOUR' }
      }
    )
    expect(get).toHaveBeenNthCalledWith(4, '/browser-activity/employees/audit-grants', {
      suppressErrorMessage: true,
      params: { accountIds: 'account-1,account-2' }
    })
    expect(get).toHaveBeenNthCalledWith(5, '/browser-activity/domains', {
      suppressErrorMessage: true,
      params: { employeeAccountId: 'account-1', period: 'LAST_1_WEEK' }
    })
    expect(get).toHaveBeenNthCalledWith(6, '/browser-activity/url-search', {
      suppressErrorMessage: true,
      params: { keyword: 'supplier', period: 'LAST_1_MONTH' }
    })
    expect(put).toHaveBeenCalledWith('/browser-activity/employees/account-1/audit-grant', {
      enabled: true
    })
  })

  it('reads and updates the tenant browser activity audit policy', async () => {
    const { getBrowserActivityPolicyApi, updateBrowserActivityPolicyApi } = await import('./index')

    await getBrowserActivityPolicyApi()
    await updateBrowserActivityPolicyApi({
      aggregateRetentionDays: 365,
      enabled: true,
      rawRetentionDays: 90
    })

    expect(get).toHaveBeenCalledWith('/browser-activity/policy', {
      suppressErrorMessage: true
    })
    expect(put).toHaveBeenCalledWith('/browser-activity/policy', {
      aggregateRetentionDays: 365,
      enabled: true,
      rawRetentionDays: 90
    })
  })
})
