/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const claimCrmAccountApi = vi.fn()
const convertLeadToProspectCustomerApi = vi.fn()
const createCrmLeadApi = vi.fn()
const createDraftLeadApi = vi.fn()
const deleteDraftLeadApi = vi.fn()
const getCrmAccountApi = vi.fn()
const listCrmAccountsApi = vi.fn()
const releaseCrmAccountApi = vi.fn()
const submitDraftLeadApi = vi.fn()
const createCollaborationAnnotationApi = vi.fn()
const deleteCollaborationAnnotationApi = vi.fn()
const listCollaborationAnnotationsApi = vi.fn()
const setCollaborationAnnotationPinnedApi = vi.fn()
const updateCollaborationAnnotationApi = vi.fn()
const useRoute = vi.fn()
const routerPush = vi.fn()

const authContextState: any = {
  actionCodes: [
    'crm.account.claim',
    'crm.account.convert',
    'crm.account.create',
    'crm.account.manage',
    'crm.account.read',
    'crm.account.update'
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
  visibleEntries: ['crm.accounts']
}

vi.mock('#/api', () => ({
  claimCrmAccountApi,
  convertLeadToProspectCustomerApi,
  createCollaborationAnnotationApi,
  createCrmLeadApi,
  createDraftLeadApi,
  deleteCollaborationAnnotationApi,
  deleteDraftLeadApi,
  getCrmAccountApi,
  listCollaborationAnnotationsApi,
  listCrmAccountsApi,
  releaseCrmAccountApi,
  setCollaborationAnnotationPinnedApi,
  submitDraftLeadApi,
  updateCollaborationAnnotationApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('#/locales', () => ({
  $t: (key: string) => key
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute(),
  useRouter: () => ({
    push: routerPush
  })
}))

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      locale: 'zh-CN'
    }
  }
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
    template: '<span />'
  }
}))

// Updates Ant Design teleported form inputs through the real document DOM.
async function setDocumentInputValue(testId: string, value: string) {
  const input = document.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement | null
  expect(input).toBeTruthy()
  input!.value = value
  input!.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

// Opens the native Ant Design dropdown and dispatches one CRM row menu action from the teleported overlay.
async function clickCrmRowAction(wrapper: any, crmAccountId: string, actionTestId: string) {
  await wrapper.get(`[data-testid="crm-account-actions-${crmAccountId}"]`).trigger('click')
  await flushPromises()
  const action = document.querySelector(`[data-testid="${actionTestId}"]`) as HTMLElement | null
  expect(action).toBeTruthy()
  action!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await flushPromises()
}

// Verifies the CRM P1 workspace uses the tenant-scoped account BFF and exposes no Archive runtime.
describe('customer management CRM P1 workspace', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    claimCrmAccountApi.mockReset()
    convertLeadToProspectCustomerApi.mockReset()
    createCrmLeadApi.mockReset()
    createDraftLeadApi.mockReset()
    deleteDraftLeadApi.mockReset()
    getCrmAccountApi.mockReset()
    createCollaborationAnnotationApi.mockReset()
    deleteCollaborationAnnotationApi.mockReset()
    listCollaborationAnnotationsApi.mockReset()
    listCrmAccountsApi.mockReset()
    releaseCrmAccountApi.mockReset()
    setCollaborationAnnotationPinnedApi.mockReset()
    submitDraftLeadApi.mockReset()
    updateCollaborationAnnotationApi.mockReset()
    routerPush.mockReset()
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'crm.accounts'
      }
    })
    listCrmAccountsApi.mockResolvedValue({
      crmAccounts: [buildCrmAccount()],
      page: 1,
      pageSize: 20,
      total: 1
    })
    getCrmAccountApi.mockResolvedValue(buildCrmAccount())
    listCollaborationAnnotationsApi.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 50,
      total: 0
    })
    createCrmLeadApi.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount({ crmAccountId: 'crm-account-2', displayName: 'Serrano Fixtures' }),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    createDraftLeadApi.mockResolvedValue(buildCrmAccount({ crmAccountId: 'draft-1', recordStatus: 'DRAFT' }))
    submitDraftLeadApi.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount(),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    claimCrmAccountApi.mockResolvedValue(buildCrmAccount({ ownerAccountId: 'account-1' }))
    releaseCrmAccountApi.mockResolvedValue(buildCrmAccount({ ownerAccountId: '' }))
    convertLeadToProspectCustomerApi.mockResolvedValue({
      resultType: 'CONVERTED',
      crmAccount: buildCrmAccount({
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      }),
      candidates: [],
      existingCrmAccountId: ''
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loads the CRM account workspace and creates active leads or drafts', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenCalledWith('tenant-1', {
      createdBy: 'account-1',
      keyword: undefined,
      ownerAccountId: undefined,
      page: 1,
      pageSize: 20,
      recordStatus: 'DRAFT'
    })
    expect(wrapper.text()).toContain('Northline Bathworks')
    expect(document.querySelector('.ant-table-tbody')?.textContent).toContain('陈双鹏')
    expect(document.querySelector('.ant-table-tbody')?.textContent).not.toContain('account-1')
    expect(wrapper.find('[data-testid="crm-stage-pool"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="crm-pool-block"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="crm-pool-leads"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="crm-pool-prospects"]').exists()).toBe(false)
    expect(document.querySelector('.ant-table-thead')?.textContent).not.toContain('TenantParty')

    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()
    await setDocumentInputValue('crm-lead-display-name', 'Serrano Fixtures')
    await setDocumentInputValue('crm-lead-domain', 'serrano.example')
    await setDocumentInputValue('crm-lead-email', 'imports@serrano.example')
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'ES')
    ;(wrapper.findComponent('[data-testid="crm-lead-party-type"]') as any).vm.$emit('update:value', 'ORGANIZATION')
    await flushPromises()

    ;(document.querySelector('[data-testid="crm-draft-save"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createDraftLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        displayName: 'Serrano Fixtures',
        leadCountry: 'ES',
        sourceType: 'WEB_RESEARCH'
      })
    )

    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()
    await setDocumentInputValue('crm-lead-display-name', 'Serrano Fixtures')
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'ES')
    ;(wrapper.findComponent('[data-testid="crm-lead-party-type"]') as any).vm.$emit('update:value', 'ORGANIZATION')
    await flushPromises()
    ;(document.querySelector('[data-testid="crm-lead-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createCrmLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        displayName: 'Serrano Fixtures',
        leadCountry: 'ES',
        partyTypeHint: 'ORGANIZATION',
        sourceType: 'WEB_RESEARCH'
      })
    )

    await wrapper.get('[data-testid="crm-stage-pool"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'TenantCrmPool'
    })
  }, 20_000)

  it('uses dropdown row actions for detail, draft submit, conversion, and release to Pool', async () => {
    listCrmAccountsApi.mockResolvedValueOnce({
      crmAccounts: [buildCrmAccount({ recordStatus: 'DRAFT', ownerAccountId: '' })],
      page: 1,
      pageSize: 20,
      total: 1
    })
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-submit-draft-crm-account-1')
    await flushPromises()

    expect(submitDraftLeadApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1', {})

    listCrmAccountsApi.mockResolvedValue({
      crmAccounts: [buildCrmAccount({ ownerAccountId: 'account-1' })],
      page: 1,
      pageSize: 20,
      total: 1
    })
    await wrapper.get('[data-testid="crm-filter-search"]').trigger('click')
    await flushPromises()

    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-detail-crm-account-1')
    await flushPromises()

    expect(getCrmAccountApi).not.toHaveBeenCalled()
    expect(routerPush).toHaveBeenCalledWith({
      name: 'TenantCrmAccountDetail',
      params: { crmAccountId: 'crm-account-1' }
    })

    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-convert-crm-account-1')
    await flushPromises()

    expect(convertLeadToProspectCustomerApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')

    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-release-crm-account-1')
    await flushPromises()

    expect(releaseCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
  }, 20_000)

  it('keeps my active lead lane scoped to the current owner when owner filter is blank', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    const myLeadTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text().includes('我的 Lead'))
    expect(myLeadTab).toBeTruthy()
    await myLeadTab!.trigger('click')
    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStage: 'LEAD',
      ownerAccountId: 'account-1',
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })
  }, 20_000)

  it('exposes priority and country column sorting in the account table', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    const table = wrapper.findComponent({ name: 'ATable' })
    const columns = table.props('columns') as Array<{
      key?: string
      sorter?: (left: unknown, right: unknown) => number
    }>
    const priorityColumn = columns.find((column) => column.key === 'priority')
    const countryColumn = columns.find((column) => column.key === 'leadCountry')

    expect(priorityColumn?.sorter).toEqual(expect.any(Function))
    expect(
      priorityColumn!.sorter!(
        buildCrmAccount({ priority: 'A' }),
        buildCrmAccount({ priority: 'D' })
      )
    ).toBeLessThan(0)
    expect(
      priorityColumn!.sorter!(
        buildCrmAccount({ priority: 'D' }),
        buildCrmAccount({ priority: 'A' })
      )
    ).toBeGreaterThan(0)
    expect(countryColumn?.sorter).toEqual(expect.any(Function))
    expect(
      countryColumn!.sorter!(
        buildCrmAccount({ leadCountry: 'CN' }),
        buildCrmAccount({ leadCountry: 'US' })
      )
    ).toBeLessThan(0)
    expect(
      countryColumn!.sorter!(
        buildCrmAccount({ leadCountry: 'US' }),
        buildCrmAccount({ leadCountry: 'CN' })
      )
    ).toBeGreaterThan(0)
  }, 20_000)

  it('keeps the create modal open and shows an alert when the lead is blocked by an owned duplicate', async () => {
    createCrmLeadApi.mockResolvedValueOnce({
      resultType: 'BLOCKED_BY_OWNED_DUPLICATE',
      crmAccount: null,
      duplicateResult: {
        resultType: 'OWNED_DUPLICATE',
        candidates: [
          {
            crmAccountId: 'crm-account-1',
            tenantId: 'tenant-1',
            displayName: 'Northline Bathworks',
            ownerAccountId: 'account-1',
            recordStatus: 'ACTIVE',
            lifecycleStage: 'LEAD',
            matchedFields: ['leadDomain'],
            confidence: 'HIGH'
          }
        ]
      }
    })
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()
    await setDocumentInputValue('crm-lead-display-name', 'Northline Bathworks')
    await setDocumentInputValue('crm-lead-domain', 'northline.example')
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'US')
    ;(wrapper.findComponent('[data-testid="crm-lead-party-type"]') as any).vm.$emit('update:value', 'ORGANIZATION')
    await flushPromises()
    ;(document.querySelector('[data-testid="crm-lead-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(document.querySelector('[data-testid="crm-lead-duplicate-alert"]')).toBeTruthy()
    expect(document.body.textContent).toContain('已存在你负责的重复 Lead')
    expect(document.body.textContent).toContain('Northline Bathworks')
    expect(document.body.textContent).toContain('leadDomain')
    expect(document.querySelector('[data-testid="crm-lead-submit"]')).toBeTruthy()
  }, 20_000)

  it('imports leads into the current operator account from the owned workspace', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-import-leads-open"]').trigger('click')
    await flushPromises()
    await setDocumentInputValue(
      'crm-import-leads-input',
      'Serrano Fixtures,ES,serrano.example,imports@serrano.example\nCaldera Surface Studio,US,caldera.example,hello@caldera.example'
    )
    ;(document.querySelector('[data-testid="crm-import-leads-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createCrmLeadApi).toHaveBeenCalledTimes(2)
    expect(createCrmLeadApi).toHaveBeenNthCalledWith(
      1,
      'tenant-1',
      expect.objectContaining({
        displayName: 'Serrano Fixtures',
        leadCountry: 'ES',
        leadDomain: 'serrano.example',
        leadEmail: 'imports@serrano.example',
        partyTypeHint: 'ORGANIZATION',
        priority: 'C',
        sourceType: 'IMPORTED_LIST'
      })
    )
    const firstImportPayload = createCrmLeadApi.mock.calls[0]![1]
    const secondImportPayload = createCrmLeadApi.mock.calls[1]![1]
    expect(firstImportPayload).not.toEqual(expect.objectContaining({
      assignmentIntent: 'POOL'
    }))
    expect(secondImportPayload).not.toEqual(expect.objectContaining({
      assignmentIntent: 'POOL'
    }))
  }, 20_000)
})

/** buildCrmAccount creates one CRM account fixture with generated-BFF field names. */
function buildCrmAccount(overrides: Record<string, unknown> = {}) {
  return {
    crmAccountId: 'crm-account-1',
    tenantId: 'tenant-1',
    tenantPartyId: '',
    recordStatus: 'ACTIVE',
    lifecycleStage: 'LEAD',
    partyTypeHint: 'ORGANIZATION',
    displayName: 'Northline Bathworks',
    leadCompanyName: 'Northline Bathworks LLC',
    leadDomain: 'northline.example',
    leadEmail: 'sourcing@northline.example',
    leadPhone: '',
    leadWhatsapp: '',
    leadCountry: 'US',
    leadIdentifiers: [],
    ownerAccountId: 'account-1',
    ownerDisplayName: '陈双鹏',
    priority: 'A',
    lastActivityAt: '',
    nextFollowUpAt: '2026-07-01T00:00:00.000Z',
    createdBy: 'account-1',
    createdAt: '2026-06-10T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
    archivedAt: '',
    ...overrides
  }
}
