/* @vitest-environment happy-dom */

import { readFileSync } from 'node:fs'

import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const componentSource = readFileSync(
  'apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue',
  'utf8'
)

const getBrowserActivityOverviewApi = vi.fn()
const getBrowserActivityOnlinePresenceApi = vi.fn()
const getBrowserActivityEmployeeTimelineApi = vi.fn()
const getBrowserActivityDomainAggregationApi = vi.fn()
const getBrowserActivityEmployeeAuditGrantsApi = vi.fn()
const searchBrowserActivityUrlsApi = vi.fn()
const updateBrowserActivityEmployeeAuditGrantApi = vi.fn()
const listAdminAccountsApi = vi.fn()
const routerReplace = vi.fn()
const windowOpen = vi.fn()
const renderEcharts = vi.fn()
const routeState: { query: Record<string, unknown> } = {
  query: {}
}

enableAutoUnmount(afterEach)

const authContextState: any = {
  actionCodes: [
    'browser_activity.policy.read',
    'browser_activity.policy.manage',
    'browser_activity.overview.read',
    'browser_activity.employee_detail.read',
    'browser_activity.url_detail.read'
  ],
  tenantName: '广东美隆陶瓷有限公司',
  visibleEntries: ['browser-activity.audit-workbench']
}

vi.mock('#/api', () => ({
  getBrowserActivityDomainAggregationApi,
  getBrowserActivityEmployeeAuditGrantsApi,
  getBrowserActivityEmployeeTimelineApi,
  getBrowserActivityOnlinePresenceApi,
  getBrowserActivityOverviewApi,
  searchBrowserActivityUrlsApi,
  updateBrowserActivityEmployeeAuditGrantApi,
  listAdminAccountsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    replace: routerReplace
  })
}))

vi.mock('@vben/common-ui', () => ({
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
    template: '<div data-testid="browser-activity-url-share-chart" />'
  },
  useEcharts: () => ({
    renderEcharts
  })
}))

vi.mock('ant-design-vue', () => ({
  Drawer: {
    emits: ['afterOpenChange', 'close', 'update:open'],
    name: 'Drawer',
    props: ['destroyOnClose', 'open', 'placement', 'title', 'width'],
    template:
      '<aside class="ant-drawer" v-bind="$attrs" :data-destroy-on-close="String(destroyOnClose)" :data-open="String(open)" :data-placement="placement" :data-title="title" :data-width="width"><header class="ant-drawer-header"><slot name="title">{{ title }}</slot><slot name="extra" /></header><section class="ant-drawer-body"><slot /></section><button data-testid="browser-activity-native-drawer-close" @click="$emit(\'close\'); $emit(\'update:open\', false)">native close</button><button data-testid="browser-activity-native-drawer-after-close" @click="$emit(\'afterOpenChange\', false)">after close</button></aside>'
  }
}))

// createDeferred lets period-switch tests observe the pending state before data promises settle.
function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, reject, resolve }
}

// setDocumentVisibility lets timer tests exercise browser tab visibility without a real browser window.
function setDocumentVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value
  })
}

// Verifies the browser activity workbench stays scoped to the selected employee.
describe('browser activity audit workbench page', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    getBrowserActivityOverviewApi.mockReset()
    getBrowserActivityOnlinePresenceApi.mockReset()
    getBrowserActivityEmployeeTimelineApi.mockReset()
    getBrowserActivityDomainAggregationApi.mockReset()
    getBrowserActivityEmployeeAuditGrantsApi.mockReset()
    searchBrowserActivityUrlsApi.mockReset()
    updateBrowserActivityEmployeeAuditGrantApi.mockReset()
    listAdminAccountsApi.mockReset()
    routerReplace.mockReset()
    windowOpen.mockReset()
    renderEcharts.mockReset()
    vi.stubGlobal('open', windowOpen)
    setDocumentVisibility('visible')
    routeState.query = {}
    getBrowserActivityOverviewApi.mockResolvedValue(buildOverview())
    getBrowserActivityOnlinePresenceApi.mockResolvedValue(buildOnlinePresence())
    getBrowserActivityEmployeeTimelineApi.mockResolvedValue(buildTimeline())
    getBrowserActivityDomainAggregationApi.mockResolvedValue(buildDomains())
    getBrowserActivityEmployeeAuditGrantsApi.mockResolvedValue(buildAuditGrants())
    searchBrowserActivityUrlsApi.mockResolvedValue(buildUrlSearch())
    listAdminAccountsApi.mockResolvedValue(buildAccountDirectory())
    updateBrowserActivityEmployeeAuditGrantApi.mockResolvedValue({ accountId: 'account-chen', enabled: false })
  })

  it('loads the single-user monitoring workbench and switches all panels by employee', async () => {
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(getBrowserActivityOverviewApi).toHaveBeenCalledWith({ period: 'LAST_1_DAY' })
    expect(getBrowserActivityOnlinePresenceApi).toHaveBeenCalledWith({
      includeOfflineWithinMinutes: 1440,
      status: 'ALL'
    })
    expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenCalledWith('account-chen', {
      period: 'LAST_1_DAY'
    })
    expect(wrapper.get('[data-testid="browser-activity-workbench"]').text()).toContain(
      '浏览器插件监控'
    )
    expect(wrapper.text()).toContain('仅展示当前用户的浏览器访问数据')
    expect(wrapper.text()).toContain('当前展示用户')
    expect(wrapper.text()).toContain('陈双鹏')
    expect(wrapper.text()).toContain('浏览器插件监控')
    expect(wrapper.text()).toContain('支持 BE 登录')
    expect(wrapper.text()).toContain('在线')
    expect(wrapper.get('[data-testid="browser-activity-online-status"]').classes()).toContain(
      'browser-monitor__status-value--online'
    )
    expect(wrapper.text()).toContain('最近心跳')
    expect(wrapper.text()).toContain('访问趋势')
    expect(wrapper.text()).toContain('Domain 柱状图')
    expect(wrapper.text()).toContain('访问时长排名')
    expect(wrapper.text()).toContain('Domain 排名')
    expect(wrapper.text()).toContain('URL 排名')
    expect(wrapper.get('[data-testid="browser-activity-control-summary"]').text()).toContain('用户级范围')
    expect(wrapper.find('[data-testid="browser-activity-period-segments"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('绩效')
    expect(wrapper.text()).not.toContain('摸鱼')
    expect(wrapper.text()).not.toContain('租户审计开关')
    expect(wrapper.text()).not.toContain('明细保留')
    expect(wrapper.text()).not.toContain('聚合保留')

    await wrapper.get('[data-testid="browser-activity-employee-selector"]').setValue('account-lin')
    await flushPromises()

    expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenLastCalledWith('account-lin', {
      period: 'LAST_1_DAY'
    })
    expect(getBrowserActivityDomainAggregationApi).toHaveBeenLastCalledWith({
      employeeAccountId: 'account-lin',
      period: 'LAST_1_DAY'
    })
    expect(routerReplace).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('未启用监控')
    expect(wrapper.get('[data-testid="browser-activity-online-status"]').classes()).toContain(
      'browser-monitor__status-value--muted'
    )
    expect(wrapper.text()).toContain('历史数据仍可查看')
    expect(wrapper.text()).toContain('访问时长排名')
  })

  it('toggles browser extension monitoring and blocks enablement when BE login is unavailable', async () => {
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="browser-activity-monitoring-toggle"]').trigger('click')
    await flushPromises()

    expect(updateBrowserActivityEmployeeAuditGrantApi).toHaveBeenCalledWith('account-chen', {
      enabled: false
    })
    expect(wrapper.text()).toContain('未启用监控')
    expect(wrapper.get('[data-testid="browser-activity-monitoring-toggle"]').find('.browser-monitor__toggle-track').exists()).toBe(true)
    expect(wrapper.get('[data-testid="browser-activity-monitoring-toggle"]').find('.browser-monitor__toggle-thumb').exists()).toBe(true)

    await wrapper.get('[data-testid="browser-activity-employee-selector"]').setValue('account-lin')
    await flushPromises()

    const toggle = wrapper.get('[data-testid="browser-activity-monitoring-toggle"]')
    expect((toggle.element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.text()).toContain('该账号尚未开通浏览器插件登录能力')
  })

  it('colors heartbeat status values by current online state', async () => {
    getBrowserActivityEmployeeAuditGrantsApi.mockResolvedValueOnce({
      grants: [
        {
          accountId: 'account-chen',
          browserExtensionLoginAllowed: true,
          enabled: true
        },
        {
          accountId: 'account-lin',
          browserExtensionLoginAllowed: true,
          enabled: true
        }
      ]
    })
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="browser-activity-employee-selector"]').setValue('account-lin')
    await flushPromises()

    expect(wrapper.get('[data-testid="browser-activity-online-status"]').text()).toContain('心跳延迟')
    expect(wrapper.get('[data-testid="browser-activity-online-status"]').classes()).toContain(
      'browser-monitor__status-value--stale'
    )
  })

  it('switches periods with the selected employee scope', async () => {
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    const timelineDeferred = createDeferred<ReturnType<typeof buildTimeline>>()
    const domainDeferred = createDeferred<ReturnType<typeof buildDomains>>()
    getBrowserActivityEmployeeTimelineApi.mockReturnValueOnce(timelineDeferred.promise)
    getBrowserActivityDomainAggregationApi.mockReturnValueOnce(domainDeferred.promise)
    const overviewCallCount = getBrowserActivityOverviewApi.mock.calls.length
    const axisLabelsBeforeSwitch = wrapper.findAll('.browser-monitor__trend-axis-label').map((label) => label.text())

    await wrapper.get('[data-testid="browser-activity-period-LAST_1_HOUR"]').trigger('click')

    expect(getBrowserActivityOverviewApi).toHaveBeenCalledTimes(overviewCallCount)
    expect(wrapper.get('[data-testid="browser-activity-fact-panels"]').classes()).not.toContain(
      'browser-monitor__fact-panels--updating'
    )
    expect(wrapper.findAll('.browser-monitor__trend-axis-label').map((label) => label.text())).toEqual(
      axisLabelsBeforeSwitch
    )
    expect(wrapper.text()).toContain('supplier-portal.example')

    timelineDeferred.resolve(buildTimeline())
    domainDeferred.resolve(buildDomains())
    await flushPromises()

    expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenLastCalledWith('account-chen', {
      period: 'LAST_1_HOUR'
    })
    expect(wrapper.get('[data-testid="browser-activity-fact-panels"]').classes()).not.toContain(
      'browser-monitor__fact-panels--updating'
    )
    expect(wrapper.findAll('.browser-monitor__trend-axis-label').map((label) => label.text())).not.toEqual(
      axisLabelsBeforeSwitch
    )
  })

  it('refreshes the selected employee manually and every 30 seconds with a compact loading button', async () => {
    vi.useFakeTimers()
    try {
      const page = (await import('./browser-activity-audit-workbench.vue')).default
      const wrapper = mount(page, { attachTo: document.body })

      await flushPromises()
      await wrapper.get('[data-testid="browser-activity-employee-selector"]').setValue('account-lin')
      await flushPromises()

      expect(wrapper.find('[data-testid="browser-activity-refresh-current"]').exists()).toBe(false)

      await wrapper.get('[data-testid="browser-activity-employee-selector"]').setValue('account-chen')
      await flushPromises()
      await wrapper.get('[data-testid="browser-activity-trend-mode-domain"]').trigger('click')
      await flushPromises()
      await wrapper.get('[data-testid="browser-activity-domain-supplier-portal-example"]').trigger('click')
      await flushPromises()
      renderEcharts.mockClear()

      const manualPresence = createDeferred<ReturnType<typeof buildOnlinePresence>>()
      const manualTimeline = createDeferred<ReturnType<typeof buildRefreshedTimeline>>()
      const manualDomains = createDeferred<ReturnType<typeof buildRefreshedDomains>>()
      getBrowserActivityOnlinePresenceApi.mockReturnValueOnce(manualPresence.promise)
      getBrowserActivityEmployeeTimelineApi.mockReturnValueOnce(manualTimeline.promise)
      getBrowserActivityDomainAggregationApi.mockReturnValueOnce(manualDomains.promise)

      const refreshButton = wrapper.get('[data-testid="browser-activity-refresh-current"]')
      expect(refreshButton.attributes('title')).toContain('刷新当前用户数据')
      expect(refreshButton.find('.browser-monitor__refresh-icon [data-icon="lucide:refresh-cw"]').exists()).toBe(true)

      await refreshButton.trigger('click')

      expect(refreshButton.classes()).toContain('browser-monitor__refresh--loading')
      expect((refreshButton.element as HTMLButtonElement).disabled).toBe(true)
      expect(getBrowserActivityOnlinePresenceApi).toHaveBeenLastCalledWith({
        includeOfflineWithinMinutes: 1440,
        status: 'ALL'
      })
      expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenLastCalledWith('account-chen', {
        period: 'LAST_1_DAY'
      })
      expect(getBrowserActivityDomainAggregationApi).toHaveBeenLastCalledWith({
        employeeAccountId: 'account-chen',
        period: 'LAST_1_DAY'
      })

      manualPresence.resolve(buildOnlinePresence())
      manualTimeline.resolve(buildRefreshedTimeline())
      manualDomains.resolve(buildRefreshedDomains())
      await flushPromises()

      expect(refreshButton.classes()).toContain('browser-monitor__refresh--loading')

      await vi.advanceTimersByTimeAsync(700)
      await flushPromises()

      expect(refreshButton.classes()).not.toContain('browser-monitor__refresh--loading')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('2m 15s')
      expect(wrapper.get('.browser-monitor__domain-bar-tip').text()).toContain('1m 30s')
      expect(wrapper.get('[data-testid="browser-activity-domain-supplier-portal-example"]').text()).toContain('1m 30s')
      await wrapper.get('[data-testid="browser-activity-trend-mode-time"]').trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.browser-monitor__trend-axis-label').map((label) => label.text())).toContain('19时')
      expect(renderEcharts).toHaveBeenCalled()
      const refreshedShareOptions = renderEcharts.mock.calls.at(-1)?.[0]
      expect(refreshedShareOptions.series[0].data[0]).toMatchObject({
        durationLabel: '1m 0s',
        name: 'Rank #1',
        value: 60
      })

      await wrapper.get('[data-testid="browser-activity-ranking-mode-url"]').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Refreshed Quotes')
      expect(wrapper.text()).toContain('1m 0s')

      const timelineCallCount = getBrowserActivityEmployeeTimelineApi.mock.calls.length
      getBrowserActivityOnlinePresenceApi.mockResolvedValueOnce(buildOnlinePresence())
      getBrowserActivityEmployeeTimelineApi.mockResolvedValueOnce(buildTimeline())
      getBrowserActivityDomainAggregationApi.mockResolvedValueOnce(buildDomains())

      await vi.advanceTimersByTimeAsync(30_000)
      await flushPromises()

      expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenCalledTimes(timelineCallCount + 1)
      expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenLastCalledWith('account-chen', {
        period: 'LAST_1_DAY'
      })

      wrapper.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('polls lightweight presence and treats missing presence rows as offline', async () => {
    vi.useFakeTimers()
    try {
      const page = (await import('./browser-activity-audit-workbench.vue')).default
      const wrapper = mount(page, { attachTo: document.body })

      await flushPromises()

      expect(wrapper.get('[data-testid="browser-activity-online-status"]').text()).toContain('在线')

      const timelineCallCount = getBrowserActivityEmployeeTimelineApi.mock.calls.length
      const domainCallCount = getBrowserActivityDomainAggregationApi.mock.calls.length
      const presenceCallCount = getBrowserActivityOnlinePresenceApi.mock.calls.length
      getBrowserActivityOnlinePresenceApi.mockResolvedValueOnce(buildDisconnectedPresence())

      await vi.advanceTimersByTimeAsync(5_000)
      await flushPromises()

      expect(getBrowserActivityOnlinePresenceApi).toHaveBeenCalledTimes(presenceCallCount)

      await vi.advanceTimersByTimeAsync(10_000)
      await flushPromises()

      expect(getBrowserActivityOnlinePresenceApi).toHaveBeenLastCalledWith({
        includeOfflineWithinMinutes: 1440,
        status: 'ALL'
      })
      expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenCalledTimes(timelineCallCount)
      expect(getBrowserActivityDomainAggregationApi).toHaveBeenCalledTimes(domainCallCount)
      expect(wrapper.get('[data-testid="browser-activity-online-status"]').text()).toContain('离线')
      expect(wrapper.text()).toContain(
        new Intl.DateTimeFormat('zh-CN', {
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          month: '2-digit'
        }).format(new Date('2026-06-25T09:30:10.000Z'))
      )

      wrapper.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops live presence polling when the selected employee monitoring is disabled', async () => {
    vi.useFakeTimers()
    try {
      const page = (await import('./browser-activity-audit-workbench.vue')).default
      const wrapper = mount(page, { attachTo: document.body })

      await flushPromises()

      const presenceCallCount = getBrowserActivityOnlinePresenceApi.mock.calls.length
      await wrapper.get('[data-testid="browser-activity-monitoring-toggle"]').trigger('click')
      await flushPromises()

      await vi.advanceTimersByTimeAsync(15_000)
      await flushPromises()

      expect(getBrowserActivityOnlinePresenceApi).toHaveBeenCalledTimes(presenceCallCount)

      wrapper.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses live presence polling while the page is hidden and refreshes when visible again', async () => {
    vi.useFakeTimers()
    try {
      const page = (await import('./browser-activity-audit-workbench.vue')).default
      const wrapper = mount(page, { attachTo: document.body })

      await flushPromises()

      const presenceCallCount = getBrowserActivityOnlinePresenceApi.mock.calls.length
      setDocumentVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(15_000)
      await flushPromises()

      expect(getBrowserActivityOnlinePresenceApi).toHaveBeenCalledTimes(presenceCallCount)

      setDocumentVisibility('visible')
      document.dispatchEvent(new Event('visibilitychange'))
      await flushPromises()

      expect(getBrowserActivityOnlinePresenceApi).toHaveBeenCalledTimes(presenceCallCount + 1)

      wrapper.unmount()
    } finally {
      vi.useRealTimers()
      setDocumentVisibility('visible')
    }
  })

  it('does not restore or persist selected employee through route query state', async () => {
    routeState.query = { accountId: 'account-lin' }
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenLastCalledWith('account-chen', {
      period: 'LAST_1_DAY'
    })
    expect((wrapper.get('[data-testid="browser-activity-employee-selector"]').element as HTMLSelectElement).value).toBe(
      'account-chen'
    )

    await wrapper.get('[data-testid="browser-activity-employee-selector"]').setValue('account-lin')
    await wrapper.get('[data-testid="browser-activity-period-LAST_1_HOUR"]').trigger('click')
    await flushPromises()

    expect(getBrowserActivityEmployeeTimelineApi).toHaveBeenLastCalledWith('account-lin', {
      period: 'LAST_1_HOUR'
    })
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('keeps historical browser facts visible after monitoring is disabled', async () => {
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="browser-activity-monitoring-toggle"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('未启用监控')
    expect(wrapper.text()).toContain('访问时长排名')
    expect(wrapper.text()).toContain('supplier-portal.example')
  })

  it('renders split trend and ranking blocks with switchable ranking modes and second-level durations', async () => {
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.text()).toContain('访问趋势')
    expect(wrapper.text()).toContain('时间趋势')
    expect(wrapper.text()).toContain('Domain 柱状图')
    expect(wrapper.text()).toContain('访问时长排名')
    expect(wrapper.text()).toContain('40m 0s')
    expect(wrapper.text()).not.toContain('Supplier Orders')

    await wrapper.get('[data-testid="browser-activity-ranking-mode-url"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Supplier Orders')
    expect(wrapper.text()).toContain('35m 0s')
  })

  it('switches the trend block between a line trend and fixed-width domain bars', async () => {
    getBrowserActivityDomainAggregationApi.mockResolvedValueOnce(buildSmallDurationDomains())
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.find('[data-testid="browser-activity-time-trend-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="browser-activity-domain-bar-chart"]').exists()).toBe(false)
    expect(wrapper.find('.browser-monitor__trend-axis-line').exists()).toBe(true)
    const axisLabels = wrapper.findAll('.browser-monitor__trend-axis-label')
    expect(axisLabels.length).toBeGreaterThan(0)
    expect(axisLabels.every((label) => label.text().trim().length > 0)).toBe(true)

    await wrapper.get('[data-testid="browser-activity-trend-mode-domain"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="browser-activity-time-trend-chart"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="browser-activity-domain-bar-chart"]').exists()).toBe(true)
    const domainBar = wrapper.get('.browser-monitor__domain-bar')
    expect(domainBar.classes()).toContain('browser-monitor__domain-bar')
    expect(domainBar.find('.browser-monitor__domain-bar-tip').text()).toContain('8s')
    expect(domainBar.find('.browser-monitor__domain-bar-tip').text()).toContain('3 次访问')
    expect(domainBar.find('.browser-monitor__domain-bar-slot > i').exists()).toBe(true)
    expect(domainBar.find('i .browser-monitor__domain-bar-tip').exists()).toBe(true)
    const barHeights = wrapper
      .findAll('.browser-monitor__domain-bar i')
      .map((bar) => bar.attributes('style'))
    expect(barHeights).toEqual(['height: 100%;', 'height: 56%;', 'height: 12%;'])
    expect(componentSource).not.toContain('min-height: 24px')
    expect(componentSource).toContain('.browser-monitor__domain-bar-slot')
    expect(componentSource).toMatch(
      /\.browser-monitor__domain-bar i \{[\s\S]*position: absolute;[\s\S]*bottom: 0;/
    )
    expect(componentSource).toContain('.browser-monitor__domain-bar:hover::before')
    expect(componentSource).toContain('.browser-monitor__domain-bar:hover span')
    expect(wrapper.find('[data-testid="browser-activity-domain-bar-chart"]').attributes('style')).toContain(
      '--domain-bar-width: 64px'
    )
  })

  it('animates trend and renders the drawer URL duration share with the analytics source pie pattern', async () => {
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.get('[data-testid="browser-activity-time-trend-chart"] svg').classes()).toContain(
      'browser-monitor__trend-svg--enter'
    )

    await wrapper.get('[data-testid="browser-activity-ranking-mode-url"]').trigger('click')
    await flushPromises()

    const urlRow = wrapper.get('[data-testid="browser-activity-url-https-supplier-portal-example-orders"]')
    await urlRow.trigger('click')
    expect(windowOpen).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="browser-activity-open-url-https-supplier-portal-example-orders"]').trigger('click')
    expect(windowOpen).toHaveBeenCalledWith('https://supplier-portal.example/orders', '_blank', 'noopener,noreferrer')

    await wrapper.get('[data-testid="browser-activity-ranking-mode-domain"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="browser-activity-domain-supplier-portal-example"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.browser-monitor__donut-wrap').exists()).toBe(false)
    expect(wrapper.find('[data-testid="browser-activity-url-share-chart"]').exists()).toBe(true)
    expect(renderEcharts).toHaveBeenCalled()
    const chartOptions = renderEcharts.mock.calls.at(-1)?.[0]
    expect(chartOptions.legend.show).toBe(false)
    expect(chartOptions.tooltip.confine).toBe(true)
    expect(chartOptions.tooltip.padding).toEqual([6, 8])
    expect(chartOptions.tooltip.textStyle).toMatchObject({
      fontSize: 12,
      lineHeight: 16
    })
    expect(chartOptions.tooltip.extraCssText).toContain('width: max-content')
    expect(chartOptions.tooltip.extraCssText).toContain('white-space: nowrap')
    expect(chartOptions.tooltip.trigger).toBe('item')
    expect(chartOptions.series[0]).toMatchObject({
      animationEasing: 'exponentialInOut',
      animationType: 'scale',
      name: 'URL 时长占比',
      radius: ['40%', '65%'],
      type: 'pie'
    })
    expect(chartOptions.series[0].emphasis.label.show).toBe(true)
    expect(chartOptions.series[0].data[0]).toMatchObject({
      durationLabel: '35m 0s',
      name: 'Rank #1',
      rankLabel: 'Rank #1',
      url: 'https://supplier-portal.example/orders',
      value: 2100
    })
    const tooltipHtml = chartOptions.tooltip.formatter({
      data: chartOptions.series[0].data[0],
      name: 'Rank #1',
      percent: 100,
      value: 2100
    })
    expect(tooltipHtml).toContain('Rank #1')
    expect(tooltipHtml).toContain('35m 0s')
    expect(tooltipHtml).toContain('100%')
    expect(tooltipHtml).not.toContain('<br/>')
    expect(tooltipHtml).not.toContain('2 次访问')
    expect(tooltipHtml).not.toContain('https://supplier-portal.example/orders')
    expect(tooltipHtml).not.toContain('/orders')
    const shareList = wrapper.get('.browser-monitor__share-list')
    expect(shareList.text()).toContain('Rank #1')
    expect(shareList.text()).toContain('100%')
    expect(shareList.text()).not.toContain('35m 0s')
    const swatches = shareList.findAll('.browser-monitor__share-swatch')
    expect(swatches).toHaveLength(1)
    expect(swatches[0]?.attributes('style')).toContain('--share-color: #5ab1ef')
    expect(swatches[0]?.attributes('aria-hidden')).toBe('true')
  })

  it('does not force ECharts tooltip divs to inherit the share chart height', () => {
    expect(componentSource).not.toContain('.browser-monitor__share-chart :deep(div)')
    expect(componentSource).toContain('.browser-monitor__share-chart :deep(.echarts-ui > div:first-child)')
  })

  it('opens a domain drilldown with URL duration distribution, URL ranking, navigation, and close action', async () => {
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    await wrapper.get('[data-testid="browser-activity-domain-supplier-portal-example"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('supplier-portal.example')
    expect(wrapper.text()).toContain('URL 时长分布')
    expect(wrapper.text()).toContain('同 Domain URL 排名')
    expect(wrapper.text()).toContain('#1')
    expect(wrapper.text()).toContain('Supplier Orders')
    expect(wrapper.text()).toContain('35m 0s')
    const drawer = wrapper.get('[data-testid="browser-activity-drilldown-drawer"]')
    expect(drawer.classes()).toContain('ant-drawer')
    expect(drawer.classes()).toContain('browser-monitor__drawer')
    expect(drawer.attributes('data-destroy-on-close')).toBe('false')
    expect(drawer.attributes('data-placement')).toBe('right')
    expect(drawer.attributes('data-width')).toBe('480')
    expect(drawer.element.parentElement?.className).not.toContain('browser-monitor__analysis')
    expect(wrapper.find('[data-testid="browser-activity-drilldown-close"]').exists()).toBe(false)
    expect(drawer.text()).not.toContain('打开域名')

    await wrapper.get('[data-testid="browser-activity-open-url-https-supplier-portal-example-orders"]').trigger('click')

    expect(windowOpen).toHaveBeenCalledWith('https://supplier-portal.example/orders', '_blank', 'noopener,noreferrer')

    await wrapper.get('[data-testid="browser-activity-native-drawer-close"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="browser-activity-drilldown-drawer"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="browser-activity-drilldown-drawer"]').attributes('data-open')).toBe('false')

    await wrapper.get('[data-testid="browser-activity-native-drawer-after-close"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="browser-activity-drilldown-drawer"]').exists()).toBe(false)
  })

  it('does not fall back to preview data when the BFF returns a service error', async () => {
    getBrowserActivityOverviewApi.mockRejectedValueOnce({
      response: {
        status: 500
      }
    })
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.text()).toContain('浏览器插件监控服务暂时不可用')
    expect(wrapper.text()).not.toContain('前端预览数据')
    expect(wrapper.text()).not.toContain('陈双鹏')
  })

  it('keeps the user selector from account directory when overview repeated fields are omitted', async () => {
    getBrowserActivityOverviewApi.mockResolvedValueOnce({
      metrics: {
        activeDurationSeconds: 0,
        employeeCount: 0,
        foregroundDurationSeconds: 0,
        idleDurationSeconds: 0,
        onlineDurationSeconds: 0,
        urlCount: 0
      },
      period: 'LAST_1_DAY',
      policy: {
        aggregateRetentionDays: 365,
        enabled: true,
        rawRetentionDays: 90
      }
    })
    getBrowserActivityOnlinePresenceApi.mockResolvedValueOnce({
      serverTime: '2026-06-25T09:31:00.000Z',
      summary: {
        offlineCount: 0,
        onlineCount: 0,
        staleCount: 0
      },
      thresholds: {
        heartbeatIntervalSeconds: 60,
        onlineWithinSeconds: 90,
        staleWithinSeconds: 180
      }
    })
    getBrowserActivityEmployeeAuditGrantsApi.mockResolvedValueOnce({
      grants: [
        {
          accountId: 'account-chen',
          browserExtensionLoginAllowed: true,
          enabled: false
        },
        {
          accountId: 'account-lin',
          browserExtensionLoginAllowed: false,
          enabled: false
        }
      ]
    })
    getBrowserActivityEmployeeTimelineApi.mockResolvedValueOnce({
      employeeAccountId: 'account-chen',
      visits: []
    })
    getBrowserActivityDomainAggregationApi.mockResolvedValueOnce({
      domains: []
    })
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(listAdminAccountsApi).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      scopeLevel: 'TENANT',
      status: 'ENABLED'
    })
    expect(getBrowserActivityEmployeeAuditGrantsApi).toHaveBeenCalledWith(['account-chen', 'account-lin'])
    expect(wrapper.text()).toContain('当前展示用户')
    expect(wrapper.text()).toContain('陈双鹏')
    expect(wrapper.text()).toContain('尚未启用浏览器插件监控')
    expect(wrapper.text()).not.toContain('浏览器插件监控服务暂时不可用')
  })

  it('uses explicit preview data only when the local BFF endpoint is unavailable', async () => {
    getBrowserActivityOverviewApi.mockRejectedValueOnce({
      response: {
        status: 404
      }
    })
    const page = (await import('./browser-activity-audit-workbench.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.text()).toContain('前端预览数据')
    expect(wrapper.text()).toContain('陈双鹏')
  })
})

function buildOverview() {
  return {
    employees: [
      {
        accountId: 'account-chen',
        activeDurationSeconds: 18_360,
        auditEnabled: true,
        browserExtensionLoginAllowed: true,
        displayName: '陈双鹏',
        foregroundDurationSeconds: 21_600,
        idleDurationSeconds: 3_240,
        lastHeartbeatAt: '2026-06-25T09:30:10.000Z',
        onlineStatus: 'ONLINE',
        onlineDurationSeconds: 28_800,
        pageViewCount: 46
      },
      {
        accountId: 'account-lin',
        activeDurationSeconds: 16_080,
        auditEnabled: false,
        browserExtensionLoginAllowed: false,
        displayName: '林晓雯',
        foregroundDurationSeconds: 19_200,
        idleDurationSeconds: 3_120,
        lastHeartbeatAt: '2026-06-25T09:28:59.000Z',
        onlineStatus: 'STALE',
        onlineDurationSeconds: 27_000,
        pageViewCount: 39
      }
    ],
    metrics: {
      activeDurationSeconds: 34_440,
      employeeCount: 2,
      foregroundDurationSeconds: 40_800,
      idleDurationSeconds: 6_360,
      onlineEmployeeCount: 1,
      onlineDurationSeconds: 55_800,
      staleEmployeeCount: 1,
      urlCount: 85
    },
    period: 'LAST_7_DAYS',
    policy: {
      aggregateRetentionDays: 365,
      enabled: true,
      rawRetentionDays: 90
    }
  }
}

function buildAccountDirectory() {
  return {
    items: [
      {
        accountDisplayName: '陈双鹏',
        accountId: 'account-chen',
        isEnabled: true,
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: '广东美隆陶瓷有限公司',
        userDisplayName: '陈双鹏',
        userId: 'user-chen'
      },
      {
        accountDisplayName: '林晓雯',
        accountId: 'account-lin',
        isEnabled: true,
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: '广东美隆陶瓷有限公司',
        userDisplayName: '林晓雯',
        userId: 'user-lin'
      }
    ],
    page: 1,
    pageSize: 100,
    total: 2
  }
}

function buildAuditGrants() {
  return {
    grants: [
      {
        accountId: 'account-chen',
        browserExtensionLoginAllowed: true,
        enabled: true
      },
      {
        accountId: 'account-lin',
        browserExtensionLoginAllowed: false,
        enabled: false
      }
    ]
  }
}

function buildOnlinePresence() {
  return {
    employees: [
      {
        accountId: 'account-chen',
        displayName: '陈双鹏',
        extensionSessionId: 'extension-session-1',
        lastHeartbeatAt: '2026-06-25T09:30:10.000Z',
        lastObservedDomain: 'supplier-portal.example',
        onlineStatus: 'ONLINE',
        sessionStartedAt: '2026-06-25T08:58:00.000Z'
      },
      {
        accountId: 'account-lin',
        displayName: '林晓雯',
        extensionSessionId: 'extension-session-2',
        lastHeartbeatAt: '2026-06-25T09:28:59.000Z',
        onlineStatus: 'STALE',
        sessionStartedAt: '2026-06-25T09:03:00.000Z'
      }
    ],
    serverTime: '2026-06-25T09:31:00.000Z',
    summary: {
      offlineCount: 0,
      onlineCount: 1,
      staleCount: 1
    },
    thresholds: {
      heartbeatIntervalSeconds: 60,
      onlineWithinSeconds: 90,
      staleWithinSeconds: 180
    }
  }
}

function buildDisconnectedPresence() {
  return {
    employees: [],
    serverTime: '2026-06-25T09:31:05.000Z',
    summary: {
      offlineCount: 0,
      onlineCount: 0,
      staleCount: 0
    },
    thresholds: {
      heartbeatIntervalSeconds: 60,
      onlineWithinSeconds: 90,
      staleWithinSeconds: 180
    }
  }
}

function buildTimeline() {
  return {
    employeeAccountId: 'account-chen',
    visits: [
      {
        activeDurationSeconds: 840,
        domain: 'supplier-portal.example',
        dwellDurationSeconds: 980,
        endedAt: '2026-06-25T09:28:00.000Z',
        foregroundDurationSeconds: 920,
        idleDurationSeconds: 80,
        pageTitle: 'Supplier Orders',
        startedAt: '2026-06-25T09:12:00.000Z',
        url: 'https://supplier-portal.example/orders',
        visitId: 'visit-1'
      },
      {
        activeDurationSeconds: 1260,
        domain: 'supplier-portal.example',
        dwellDurationSeconds: 1260,
        endedAt: '2026-06-25T10:04:00.000Z',
        foregroundDurationSeconds: 1260,
        idleDurationSeconds: 0,
        pageTitle: 'Supplier Orders',
        startedAt: '2026-06-25T09:43:00.000Z',
        url: 'https://supplier-portal.example/orders',
        visitId: 'visit-2'
      },
      {
        activeDurationSeconds: 780,
        domain: 'docs.oes.internal',
        dwellDurationSeconds: 1080,
        endedAt: '2026-06-25T10:41:00.000Z',
        foregroundDurationSeconds: 960,
        idleDurationSeconds: 180,
        pageTitle: 'Procurement Review Notes',
        startedAt: '2026-06-25T10:23:00.000Z',
        url: 'https://docs.oes.internal/reviews/procurement',
        visitId: 'visit-3'
      }
    ]
  }
}

function buildDomains() {
  return {
    domains: [
      {
        activeDurationSeconds: 2400,
        domain: 'supplier-portal.example',
        employeeCount: 2,
        foregroundDurationSeconds: 2900,
        idleDurationSeconds: 500,
        urlCount: 8,
        visitCount: 12
      }
    ]
  }
}

function buildSmallDurationDomains() {
  return {
    domains: [
      {
        activeDurationSeconds: 8,
        domain: 'www.google.com',
        employeeCount: 1,
        foregroundDurationSeconds: 8,
        idleDurationSeconds: 0,
        urlCount: 1,
        visitCount: 3
      },
      {
        activeDurationSeconds: 5,
        domain: 'www.modole.com',
        employeeCount: 1,
        foregroundDurationSeconds: 5,
        idleDurationSeconds: 0,
        urlCount: 1,
        visitCount: 2
      },
      {
        activeDurationSeconds: 2,
        domain: 'www.pinterest.com',
        employeeCount: 1,
        foregroundDurationSeconds: 2,
        idleDurationSeconds: 0,
        urlCount: 1,
        visitCount: 1
      }
    ]
  }
}

function buildRefreshedTimeline() {
  return {
    employeeAccountId: 'account-chen',
    visits: [
      {
        activeDurationSeconds: 60,
        domain: 'supplier-portal.example',
        dwellDurationSeconds: 70,
        endedAt: '2026-06-25T11:01:00.000Z',
        foregroundDurationSeconds: 65,
        idleDurationSeconds: 5,
        pageTitle: 'Refreshed Quotes',
        startedAt: '2026-06-25T11:00:00.000Z',
        url: 'https://supplier-portal.example/quotes',
        visitId: 'refresh-visit-1'
      },
      {
        activeDurationSeconds: 30,
        domain: 'supplier-portal.example',
        dwellDurationSeconds: 40,
        endedAt: '2026-06-25T11:02:00.000Z',
        foregroundDurationSeconds: 34,
        idleDurationSeconds: 6,
        pageTitle: 'Refreshed Orders',
        startedAt: '2026-06-25T11:01:30.000Z',
        url: 'https://supplier-portal.example/orders',
        visitId: 'refresh-visit-2'
      },
      {
        activeDurationSeconds: 45,
        domain: 'docs.oes.internal',
        dwellDurationSeconds: 55,
        endedAt: '2026-06-25T11:04:00.000Z',
        foregroundDurationSeconds: 50,
        idleDurationSeconds: 5,
        pageTitle: 'Refreshed Notes',
        startedAt: '2026-06-25T11:03:15.000Z',
        url: 'https://docs.oes.internal/refresh-notes',
        visitId: 'refresh-visit-3'
      }
    ]
  }
}

function buildRefreshedDomains() {
  return {
    domains: [
      {
        activeDurationSeconds: 90,
        domain: 'supplier-portal.example',
        employeeCount: 1,
        foregroundDurationSeconds: 99,
        idleDurationSeconds: 11,
        urlCount: 2,
        visitCount: 2
      },
      {
        activeDurationSeconds: 45,
        domain: 'docs.oes.internal',
        employeeCount: 1,
        foregroundDurationSeconds: 50,
        idleDurationSeconds: 5,
        urlCount: 1,
        visitCount: 1
      }
    ]
  }
}

function buildUrlSearch() {
  return {
    results: [
      {
        activeDurationSeconds: 840,
        domain: 'supplier-portal.example',
        employeeDisplayName: '陈双鹏',
        lastVisitedAt: '2026-06-25T09:28:00.000Z',
        pageTitle: 'Supplier Orders',
        url: 'https://supplier-portal.example/orders',
        visitCount: 3
      }
    ]
  }
}
