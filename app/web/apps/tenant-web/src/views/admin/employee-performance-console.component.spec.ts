/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getEmployeePerformanceOverviewApi = vi.fn()
const renderEcharts = vi.fn()

const authContextState: any = {
  accessSummary: {
    actionCodes: ['crm.account.read']
  },
  actionCodes: ['crm.account.read'],
  sessionContext: {
    account: {
      accountId: 'admin-1'
    },
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['admin.employee-performance-console']
}

vi.mock('#/api', () => ({
  getEmployeePerformanceOverviewApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/common-ui', () => ({
  AnalysisChartCard: {
    name: 'AnalysisChartCard',
    props: ['title'],
    template: '<section class="analysis-chart-card"><h3>{{ title }}</h3><slot /></section>'
  },
  Page: {
    name: 'Page',
    template: '<main><slot /></main>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

vi.mock('@vben/plugins/echarts', () => ({
  EchartsUI: {
    name: 'EchartsUI',
    template: '<div data-testid="echarts-ui" />'
  },
  useEcharts: () => ({
    renderEcharts
  })
}))

// Verifies the employee performance console uses the gateway overview as a switchable manager dashboard.
describe('employee performance console page', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    getEmployeePerformanceOverviewApi.mockReset()
    renderEcharts.mockReset()
    getEmployeePerformanceOverviewApi.mockResolvedValue(buildOverview())
  })

  it('loads the console, switches employees, and filters plugin-source activity', async () => {
    const page = (await import('./employee-performance-console.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(getEmployeePerformanceOverviewApi).toHaveBeenCalledWith({
      period: 'LAST_7_DAYS'
    })
    expect(wrapper.get('[data-testid="employee-performance-console"]').text()).toContain(
      'Employee Performance Console'
    )
    expect(wrapper.text()).toContain('Mira Tan')
    expect(wrapper.text()).toContain('新增 Lead')
    expect(wrapper.text()).toContain('插件识别')
    expect(wrapper.text()).toContain('当前契约暂不可用')
    expect(renderEcharts).toHaveBeenCalled()

    await wrapper.get('[data-testid="employee-switch-sales-2"]').trigger('click')
    await flushPromises()

    expect(getEmployeePerformanceOverviewApi).toHaveBeenLastCalledWith({
      employeeAccountId: 'sales-2',
      period: 'LAST_7_DAYS'
    })

    await wrapper.get('[data-testid="source-filter-browser-extension"]').trigger('click')
    await flushPromises()

    expect(getEmployeePerformanceOverviewApi).toHaveBeenLastCalledWith({
      employeeAccountId: 'sales-2',
      period: 'LAST_7_DAYS',
      sourceType: 'BROWSER_EXTENSION'
    })
  })

  it('renders an inline error state when the overview cannot be loaded', async () => {
    getEmployeePerformanceOverviewApi.mockRejectedValueOnce(new Error('gateway unavailable'))

    const page = (await import('./employee-performance-console.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.text()).toContain('gateway unavailable')
    expect(wrapper.find('[data-testid="employee-performance-retry"]').exists()).toBe(true)
  })
})

function buildOverview(overrides: Record<string, unknown> = {}) {
  return {
    employees: [
      { accountId: 'sales-1', displayName: 'Mira Tan', newLeadCount: 7 },
      { accountId: 'sales-2', displayName: 'Daniel Ibarra', newLeadCount: 4 }
    ],
    overview: [
      { key: 'newLeads', label: '新增 Lead', unavailable: false, value: 7 },
      { key: 'browserExtensionRecognitions', label: '插件识别', unavailable: false, value: 3 },
      { key: 'duplicateBlocks', label: '重复阻止', unavailable: true, value: null },
      { key: 'followUpCompletionRate', label: '有效跟进率', unavailable: true, value: null }
    ],
    period: 'LAST_7_DAYS',
    recentActivities: [
      {
        activityId: 'source-1',
        actorAccountId: 'sales-1',
        actorDisplayName: 'Mira Tan',
        crmAccountId: 'crm-1',
        displayName: 'Serrano Fixtures',
        externalReference: 'https://serrano.example',
        happenedAt: '2026-06-24T08:10:00.000Z',
        sourceType: 'BROWSER_EXTENSION'
      }
    ],
    selectedEmployee: { accountId: 'sales-1', displayName: 'Mira Tan', newLeadCount: 7 },
    sourceBreakdown: [
      { count: 3, sourceType: 'BROWSER_EXTENSION' },
      { count: 2, sourceType: 'WEB_RESEARCH' }
    ],
    sourceType: 'ALL',
    trend: [
      { BROWSER_EXTENSION: 2, WEB_RESEARCH: 1, day: '2026-06-23' },
      { BROWSER_EXTENSION: 1, WEB_RESEARCH: 1, day: '2026-06-24' }
    ],
    unavailableMetrics: [
      {
        key: 'duplicateBlocks',
        reason: 'CRM duplicate-block audit aggregation is not exposed by the current read contract.'
      },
      {
        key: 'followUpCompletionRate',
        reason: 'CRM activity completion facts are not exposed by the current read contract.'
      }
    ],
    ...overrides
  }
}
