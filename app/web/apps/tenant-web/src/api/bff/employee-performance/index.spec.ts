import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get
  }
}))

// Verifies the employee performance API client stays on the API Gateway read facade.
describe('tenant-web employee performance api', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('loads the admin CRM performance overview through the gateway aggregation endpoint', async () => {
    const { getEmployeePerformanceOverviewApi } = await import('./index')

    await getEmployeePerformanceOverviewApi({
      employeeAccountId: 'sales-1',
      period: 'LAST_30_DAYS',
      sourceType: 'BROWSER_EXTENSION'
    })

    expect(get).toHaveBeenCalledWith('/admin/crm/performance/overview', {
      params: {
        employeeAccountId: 'sales-1',
        period: 'LAST_30_DAYS',
        sourceType: 'BROWSER_EXTENSION'
      }
    })
  })
})
