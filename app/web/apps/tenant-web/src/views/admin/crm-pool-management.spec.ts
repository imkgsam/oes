/* @vitest-environment happy-dom */

import { readFileSync } from 'node:fs'

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const claimCrmAccountApi = vi.fn()
const createCrmLeadApi = vi.fn()
const getCrmAccountApi = vi.fn()
const listCrmAccountsApi = vi.fn()
const routerPush = vi.fn()
const preferencesMock = vi.hoisted(() => ({
  app: {
    locale: 'zh-CN'
  }
}))

const authContextState: any = {
  actionCodes: [
    'crm.account.claim',
    'crm.account.manage',
    'crm.account.read'
  ],
  sessionContext: {
    account: {
      accountId: 'account-1'
    },
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['crm.pool']
}

vi.mock('#/api', () => ({
  claimCrmAccountApi,
  createCrmLeadApi,
  getCrmAccountApi,
  listCrmAccountsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('#/locales', () => ({
  $t: (key: string) => key
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

vi.mock('@vben/preferences', () => ({
  preferences: preferencesMock
}))

// Opens the CRM Pool row dropdown and dispatches one teleported menu action.
async function clickPoolRowDropdownAction(wrapper: any, crmAccountId: string, actionTestId: string) {
  await wrapper.get(`[data-testid="crm-pool-more-${crmAccountId}"]`).trigger('click')
  await flushPromises()
  const action = document.querySelector(`[data-testid="${actionTestId}"]`) as HTMLElement | null
  expect(action).toBeTruthy()
  action!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await flushPromises()
}

// Verifies the dedicated CRM Pool page presents ownerless resources as a claim queue.
describe('CRM pool management page', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    authContextState.actionCodes = [
      'crm.account.claim',
      'crm.account.manage',
      'crm.account.read'
    ]
    claimCrmAccountApi.mockReset()
    createCrmLeadApi.mockReset()
    getCrmAccountApi.mockReset()
    listCrmAccountsApi.mockReset()
    routerPush.mockReset()
    listCrmAccountsApi.mockImplementation((tenantId: string, query: any) => {
      if (tenantId !== 'tenant-1') {
        return Promise.reject(new Error('unexpected tenant'))
      }
      if (query.lifecycleStage === 'PROSPECT_CUSTOMER') {
        return Promise.resolve({
          crmAccounts: [buildCrmAccount({
            crmAccountId: 'crm-prospect-1',
            displayName: 'Prospect Surface Group',
            lifecycleStage: 'PROSPECT_CUSTOMER',
            leadCountry: 'US',
            leadDomain: 'prospect.example',
            priority: 'B'
          })],
          page: 1,
          pageSize: query.pageSize ?? 20,
          total: 1
        })
      }
      return Promise.resolve({
        crmAccounts: [
          buildCrmAccount(),
          buildCrmAccount({
            crmAccountId: 'crm-account-2',
            displayName: 'Caldera Surface Studio',
            leadCountry: 'ES',
            leadDomain: 'caldera.example',
            priority: 'B'
          })
        ],
        page: 1,
        pageSize: query.pageSize ?? 20,
        total: 2
      })
    })
    claimCrmAccountApi.mockResolvedValue(buildCrmAccount({ ownerAccountId: 'account-1' }))
    createCrmLeadApi.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount({ crmAccountId: 'crm-import-1', displayName: 'Serrano Fixtures' }),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loads ownerless Pool Lead records with metrics and claim actions in the row dropdown', async () => {
    const page = (await import('./crm-pool-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStage: 'LEAD',
      ownerless: true,
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })
    expect(wrapper.get('[data-testid="crm-pool-page"]').text()).toContain('CRM 公海')
    expect(wrapper.get('[data-testid="crm-pool-metrics"]').text()).toContain('公海 Lead')
    expect(wrapper.find('[data-testid="crm-pool-chart"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="crm-pool-refresh"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Meridian Tile Works')
    expect(wrapper.text()).toContain('未分配')
    expect(wrapper.find('[data-testid="crm-pool-claim-crm-account-1"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="crm-pool-more-crm-account-1"]').classes()).toContain(
      'crm-pool__more-button'
    )

    const countrySelect = wrapper.findComponent({ name: 'CountryRegionSelect' })
    expect(countrySelect.exists()).toBe(true)
    const prioritySelect = wrapper
      .findAllComponents({ name: 'ASelect' })
      .find((select) => select.props('placeholder') === '选择优先级')
    expect(prioritySelect).toBeTruthy()
    expect(prioritySelect!.props('placeholder')).toBe('选择优先级')
    expect(prioritySelect!.props('value')).toBeUndefined()
    countrySelect.vm.$emit('update:value', 'GB')
    await flushPromises()

    expect(wrapper.text()).toContain('Meridian Tile Works')
    expect(wrapper.text()).not.toContain('Caldera Surface Studio')

    await clickPoolRowDropdownAction(wrapper, 'crm-account-1', 'crm-pool-claim-crm-account-1')

    expect(claimCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(listCrmAccountsApi.mock.calls.length).toBeGreaterThan(2)
  }, 20_000)

  it('centers the CRM Pool row more icon inside its circular action button', () => {
    const source = readFileSync('apps/tenant-web/src/views/admin/crm-pool-management.vue', 'utf8')

    expect(source).not.toContain('.crm-pool__row-actions :deep(.ant-btn)')
    expect(source).toMatch(
      /\.crm-pool__more-button\s*\{[\s\S]*?display:\s*inline-grid[\s\S]*?place-items:\s*center/
    )
  })

  it('switches to ownerless Pool prospect customers and routes details to the CRM detail page', async () => {
    const page = (await import('./crm-pool-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-pool-stage-prospects"]').trigger('click')
    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStage: 'PROSPECT_CUSTOMER',
      ownerless: true,
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })

    await clickPoolRowDropdownAction(wrapper, 'crm-prospect-1', 'crm-pool-detail-crm-prospect-1')

    expect(getCrmAccountApi).not.toHaveBeenCalled()
    expect(routerPush).toHaveBeenCalledWith({
      name: 'TenantCrmAccountDetail',
      params: { crmAccountId: 'crm-prospect-1' }
    })
  }, 20_000)

  it('routes back to the owned CRM account workspace from Pool', async () => {
    const page = (await import('./crm-pool-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-pool-my-accounts"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'TenantCrmAccounts'
    })
  }, 20_000)

  it('keeps Pool claim actions disabled without the claim permission', async () => {
    authContextState.actionCodes = ['crm.account.read']
    const page = (await import('./crm-pool-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    await wrapper.get('[data-testid="crm-pool-more-crm-account-1"]').trigger('click')
    await flushPromises()

    const claimAction = document.querySelector('[data-testid="crm-pool-claim-crm-account-1"]') as HTMLElement | null
    expect(claimAction).toBeTruthy()
    expect(claimAction!.getAttribute('aria-disabled')).toBe('true')

    claimAction!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(claimCrmAccountApi).not.toHaveBeenCalled()
  }, 20_000)

  it('imports leads into the ownerless Pool when launched from the Pool workspace', async () => {
    const page = (await import('./crm-pool-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-pool-import-open"]').trigger('click')
    await flushPromises()
    const input = document.querySelector('[data-testid="crm-pool-import-input"]') as HTMLTextAreaElement | null
    expect(input).toBeTruthy()
    input!.value = 'Serrano Fixtures,ES,serrano.example,imports@serrano.example'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    ;(document.querySelector('[data-testid="crm-pool-import-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createCrmLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        assignmentIntent: 'POOL',
        displayName: 'Serrano Fixtures',
        leadCountry: 'ES',
        leadDomain: 'serrano.example',
        leadEmail: 'imports@serrano.example',
        partyTypeHint: 'ORGANIZATION',
        priority: 'C',
        sourceType: 'IMPORTED_LIST'
      })
    )
  }, 20_000)
})

/** buildCrmAccount creates one ownerless CRM Pool fixture with generated-BFF field names. */
function buildCrmAccount(overrides: Record<string, unknown> = {}) {
  return {
    crmAccountId: 'crm-account-1',
    tenantId: 'tenant-1',
    tenantPartyId: '',
    recordStatus: 'ACTIVE',
    lifecycleStage: 'LEAD',
    partyTypeHint: 'ORGANIZATION',
    displayName: 'Meridian Tile Works',
    leadCompanyName: 'Meridian Tile Works Ltd',
    leadDomain: 'meridian.example',
    leadEmail: 'sourcing@meridian.example',
    leadPhone: '',
    leadWhatsapp: '',
    leadCountry: 'UK',
    leadIdentifiers: [],
    ownerAccountId: '',
    ownerDisplayName: '',
    priority: 'A',
    lastActivityAt: '',
    nextFollowUpAt: '2026-07-01T00:00:00.000Z',
    createdBy: 'account-2',
    createdAt: '2026-06-10T00:00:00.000Z',
    updatedAt: '2026-06-20T07:42:00.000Z',
    archivedAt: '',
    ...overrides
  }
}
