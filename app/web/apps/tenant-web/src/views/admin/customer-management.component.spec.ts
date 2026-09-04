/* @vitest-environment happy-dom */


import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const archiveCrmAccountApi = vi.fn()
const claimCrmAccountApi = vi.fn()
const convertLeadToProspectCustomerApi = vi.fn()
const createCrmLeadApi = vi.fn()
const createDraftLeadApi = vi.fn()
const deleteDraftLeadApi = vi.fn()
const getCrmAccountApi = vi.fn()
const listCrmAccountsApi = vi.fn()
const releaseCrmAccountApi = vi.fn()
const submitDraftLeadApi = vi.fn()
const updateDraftLeadApi = vi.fn()
const createCollaborationAnnotationApi = vi.fn()
const deleteCollaborationAnnotationApi = vi.fn()
const listCollaborationAnnotationsApi = vi.fn()
const setCollaborationAnnotationPinnedApi = vi.fn()
const updateCollaborationAnnotationApi = vi.fn()
const useRoute = vi.fn()
const routerPush = vi.fn()
const routerReplace = vi.fn()

const authContextState: any = {
  actionCodes: [
    'crm.account.claim',
    'crm.account.convert',
    'crm.account.create',
    'crm.account.manage',
    'crm.account.read',
    'crm.account.release',
    'crm.account.update',
    'collaboration.annotation.create'
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
  archiveCrmAccountApi,
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
  updateDraftLeadApi,
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
    push: routerPush,
    replace: routerReplace
  })
}))

function createStorageMock(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, String(value)))
  } as Storage
}

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
    archiveCrmAccountApi.mockReset()
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
    updateDraftLeadApi.mockReset()
    updateCollaborationAnnotationApi.mockReset()
    routerPush.mockReset()
    routerReplace.mockReset()
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'crm.accounts'
      },
      query: {}
    })
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorageMock()
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
    createCollaborationAnnotationApi.mockResolvedValue({
      annotation: {
        annotationId: 'annotation-1'
      }
    })
    updateDraftLeadApi.mockResolvedValue(buildCrmAccount({ crmAccountId: 'crm-account-1', recordStatus: 'DRAFT' }))
    submitDraftLeadApi.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount(),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    claimCrmAccountApi.mockResolvedValue(buildCrmAccount({ ownerAccountId: 'account-1' }))
    archiveCrmAccountApi.mockResolvedValue(
      buildCrmAccount({
        archiveReason: 'NON_TARGET_ACCOUNT',
        archivedAt: '2026-06-23T00:00:00.000Z',
        recordStatus: 'ARCHIVED'
      })
    )
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

  it('uses business-language help text and country-specific identifier entry in the Lead modal', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('登记/证件信息')
    expect(document.body.textContent).toContain('联系与网络信息')
    expect(document.body.textContent).not.toContain('强 Identifier')
    expect(document.body.textContent).not.toContain('Profile 信息')
    expect(document.querySelector('[aria-label*="主体身份"]')).toBeTruthy()
    expect(document.querySelector('[aria-label*="联系方式"]')).toBeTruthy()

    ;(document.querySelector('[data-testid="crm-identifier-add"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(wrapper.findAllComponents({ name: 'CountryRegionSelect' })).toHaveLength(2)
    expect((wrapper.findComponent('[data-testid="crm-identifier-type-0"]') as any).props('value')).toBe('')
    expect(document.querySelector('[data-testid="crm-identifier-value-0"]')?.getAttribute('placeholder')).toBe(
      '填写对应号码'
    )

    ;(wrapper.findComponent('[data-testid="crm-identifier-country-0"]') as any).vm.$emit('update:value', 'CN')
    await flushPromises()
    const cnIdentifierLabels = (
      (wrapper.findComponent('[data-testid="crm-identifier-type-0"]') as any).props('options') as Array<{
        label: string
      }>
    ).map((option) => option.label)
    expect(cnIdentifierLabels).toContain('统一社会信用代码')
    expect(cnIdentifierLabels).not.toContain('D-U-N-S')

    ;(wrapper.findComponent('[data-testid="crm-identifier-country-0"]') as any).vm.$emit('update:value', 'US')
    await flushPromises()
    const usIdentifierLabels = (
      (wrapper.findComponent('[data-testid="crm-identifier-type-0"]') as any).props('options') as Array<{
        label: string
      }>
    ).map((option) => option.label)
    expect(usIdentifierLabels).toContain('EIN')

    ;(document.querySelector('[data-testid="crm-profile-add"]') as HTMLButtonElement).click()
    await flushPromises()
    expect((wrapper.findComponent('[data-testid="crm-profile-type-0"]') as any).props('value')).toBe('')
    expect(document.querySelector('[data-testid="crm-profile-value-0"]')?.getAttribute('placeholder')).toBe(
      '填写域名、邮箱、电话等内容'
    )
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
    expect(document.querySelector('.ant-table-tbody')?.textContent).not.toContain('陈双鹏')
    expect(document.querySelector('.ant-table-tbody')?.textContent).not.toContain('account-1')
    expect(wrapper.find('[data-testid="crm-stage-pool"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="crm-pool-block"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="crm-pool-leads"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="crm-pool-prospects"]').exists()).toBe(false)
    expect(document.querySelector('.ant-table-thead')?.textContent).not.toContain('TenantParty')

    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('主体基础')
    expect(document.body.textContent).toContain('法定/登记名称')
    expect(document.body.textContent).toContain('来源说明')
    expect(document.body.textContent).not.toContain('下次跟进')
    expect(document.body.textContent).not.toContain('来源名称')
    expect(document.querySelector('[data-testid="crm-lead-company-name"]')).toBeNull()
    expect(document.querySelector('[data-testid="crm-lead-person-name"]')).toBeNull()
    await setDocumentInputValue('crm-lead-display-name', 'Serrano Fixtures')
    expect(document.querySelector('[data-testid="crm-lead-domain"]')).toBeNull()
    expect(document.querySelector('[data-testid="crm-identifier-empty"]')).toBeTruthy()
    const addIdentifierRow = document.querySelector('[data-testid="crm-identifier-add"]') as HTMLButtonElement
    expect(addIdentifierRow?.tagName).toBe('BUTTON')
    addIdentifierRow.click()
    await flushPromises()
    expect(document.querySelector('[data-testid="crm-identifier-value-0"]')).toBeTruthy()
    ;(wrapper.findComponent('[data-testid="crm-identifier-country-0"]') as any).vm.$emit('update:value', 'ES')
    ;(wrapper.findComponent('[data-testid="crm-identifier-type-0"]') as any).vm.$emit('update:value', 'VAT_NO')
    await setDocumentInputValue('crm-identifier-value-0', 'ES-A12345678')
    expect(document.querySelector('[data-testid="crm-profile-empty"]')).toBeTruthy()
    expect(document.querySelector('[data-testid="crm-profile-value-0"]')).toBeNull()
    const addProfileRow = document.querySelector('[data-testid="crm-profile-add"]') as HTMLButtonElement
    expect(addProfileRow?.tagName).toBe('BUTTON')
    expect(addProfileRow.classList.contains('crm-profile-editor__add-row')).toBe(true)
    addProfileRow.click()
    await flushPromises()
    expect(document.querySelector('[data-testid="crm-profile-empty"]')).toBeNull()
    expect(document.querySelector('[data-testid="crm-profile-value-0"]')).toBeTruthy()
    ;(wrapper.findComponent('[data-testid="crm-profile-type-0"]') as any).vm.$emit('update:value', 'DOMAIN')
    await setDocumentInputValue('crm-profile-value-0', 'serrano.example')
    ;(document.querySelector('[data-testid="crm-profile-add"]') as HTMLButtonElement).click()
    await flushPromises()
    ;(wrapper.findComponent('[data-testid="crm-profile-type-1"]') as any).vm.$emit('update:value', 'DOMAIN')
    await setDocumentInputValue('crm-profile-value-1', 'serrano.es')
    ;(document.querySelector('[data-testid="crm-profile-add"]') as HTMLButtonElement).click()
    await flushPromises()
    ;(wrapper.findComponent('[data-testid="crm-profile-type-2"]') as any).vm.$emit('update:value', 'EMAIL')
    await setDocumentInputValue('crm-profile-value-2', 'imports@serrano.example')
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'ES')
    ;(wrapper.findComponent('[data-testid="crm-lead-party-type"]') as any).vm.$emit('update:value', 'ORGANIZATION')
    await flushPromises()

    ;(document.querySelector('[data-testid="crm-draft-save"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createDraftLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        displayName: 'Serrano Fixtures',
        leadLegalName: undefined,
        leadCountry: 'ES',
        leadCompanyName: undefined,
        leadDomain: 'serrano.example',
        leadIdentifiers: [
          {
            identifierType: 'VAT_NO',
            issuerCountryOrRegion: 'ES',
            normalizedValue: 'ES-A12345678',
            rawValue: 'ES-A12345678'
          }
        ],
        profileItems: [
          {
            itemType: 'DOMAIN',
            normalizedValue: 'serrano.example',
            rawValue: 'serrano.example'
          },
          {
            itemType: 'DOMAIN',
            normalizedValue: 'serrano.es',
            rawValue: 'serrano.es'
          },
          {
            itemType: 'EMAIL',
            normalizedValue: 'imports@serrano.example',
            rawValue: 'imports@serrano.example'
          }
        ],
        sourceType: 'WEB_RESEARCH'
      })
    )

    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()
    await setDocumentInputValue('crm-lead-display-name', 'Serrano Fixtures')
    await setDocumentInputValue('crm-lead-source-note', 'Website supplier list row 42')
    await setDocumentInputValue('crm-lead-initial-note', 'Looks like a regional distributor with OEM pages.')
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'ES')
    ;(wrapper.findComponent('[data-testid="crm-lead-party-type"]') as any).vm.$emit('update:value', 'ORGANIZATION')
    await flushPromises()
    ;(document.querySelector('[data-testid="crm-lead-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createCrmLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        displayName: 'Serrano Fixtures',
        leadLegalName: undefined,
        leadCountry: 'ES',
        leadCompanyName: undefined,
        leadIdentifiers: [],
        partyTypeHint: 'ORGANIZATION',
        profileItems: [],
        sourceNote: 'Website supplier list row 42',
        sourceType: 'WEB_RESEARCH'
      })
    )
    expect(createCrmLeadApi.mock.calls.at(-1)?.[1]).not.toHaveProperty('nextFollowUpAt')
    expect(createCollaborationAnnotationApi).toHaveBeenCalledWith(
      {
        objectId: 'crm-account-2',
        objectOwnerService: 'crm-service',
        objectType: 'CrmAccount'
      },
      {
        bodyText: 'Looks like a regional distributor with OEM pages.',
        visibility: 'OBJECT_VISIBLE'
      }
    )

    await wrapper.get('[data-testid="crm-stage-pool"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'TenantCrmPool'
    })
  }, 20_000)

  it('switches the Lead modal field set for personal Leads', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()
    ;(wrapper.findComponent('[data-testid="crm-lead-party-type"]') as any).vm.$emit('update:value', 'PERSON')
    await flushPromises()

    expect(document.body.textContent).toContain('姓名')
    expect(document.body.textContent).toContain('后续确认其属于某家公司')
    expect(document.querySelector('[data-testid="crm-lead-company-name"]')).toBeNull()
    expect(document.querySelector('[data-testid="crm-lead-person-name"]')).toBeNull()

    await setDocumentInputValue('crm-lead-display-name', 'Mateo Ruiz')
    await setDocumentInputValue('crm-lead-legal-name', 'Mateo Ruiz García')
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'ES')
    ;(document.querySelector('[data-testid="crm-lead-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createCrmLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        displayName: 'Mateo Ruiz',
        leadLegalName: 'Mateo Ruiz García',
        leadCompanyName: undefined,
        leadPersonName: undefined,
        partyTypeHint: 'PERSON'
      })
    )
  }, 20_000)

  it('keeps the CRM account table pinned to the workspace body without forcing an inner y-scroll', async () => {
    listCrmAccountsApi.mockResolvedValue({
      crmAccounts: [buildCrmAccount()],
      page: 1,
      pageSize: 20,
      total: 1
    })
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.get('[data-testid="crm-account-table-shell"]').classes()).toContain('crm-workspace__table-shell')
    const table = wrapper.findComponent({ name: 'ATable' })
    expect(table.exists()).toBe(true)
    expect(table.props('scroll')).toMatchObject({
      x: expect.any(Number)
    })
    expect(table.props('scroll')).not.toHaveProperty('y')
  }, 20_000)

  it('centers CRM account table content and lets non-action columns adapt to available width', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    const table = wrapper.findComponent({ name: 'ATable' })
    const columns = table.props('columns') as Array<{
      align?: string
      ellipsis?: boolean
      key?: string
      minWidth?: number
      width?: number
    }>
    const dataColumns = columns.filter((column) => column.key !== 'actions')

    expect(dataColumns.length).toBeGreaterThan(0)
    expect(dataColumns.every((column) => column.align === 'center')).toBe(true)
    expect(dataColumns.every((column) => column.ellipsis === true)).toBe(true)
    expect(dataColumns.every((column) => typeof column.minWidth === 'number')).toBe(true)
    expect(dataColumns.every((column) => column.width === undefined)).toBe(true)
    expect(columns.find((column) => column.key === 'actions')).toMatchObject({
      align: 'center',
      fixed: 'right'
    })
  }, 20_000)

  it('does not render owner columns in the CRM account list table', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    const table = wrapper.findComponent({ name: 'ATable' })
    const columns = table.props('columns') as Array<{
      key?: string
      title?: unknown
    }>

    expect(columns.map((column) => column.key)).not.toContain('ownerAccountId')
    expect(document.querySelector('.ant-table-thead')?.textContent).not.toContain('负责人')
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
    await setDocumentInputValue('crm-formalize-legal-name', 'Northline Bathworks LLC')
    ;(document.querySelector('[data-testid="crm-formalize-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(convertLeadToProspectCustomerApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1', {
      legalName: 'Northline Bathworks LLC'
    })

    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-release-crm-account-1')
    await flushPromises()

    expect(releaseCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(document.querySelector('.crm-alert.ant-alert-success')).toBeNull()
  }, 20_000)

  it('archives an active Lead from the customer resource list with a required CRM reason', async () => {
    listCrmAccountsApi.mockResolvedValue({
      crmAccounts: [buildCrmAccount({ ownerAccountId: 'account-1' })],
      page: 1,
      pageSize: 20,
      total: 1
    })
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-archive-crm-account-1')

    expect(document.body.textContent).toContain('归档原因')
    const reasonOption = document.querySelector(
      '[data-testid="crm-account-list-archive-reason-COMPETITOR"]'
    ) as HTMLElement | null
    expect(reasonOption).toBeTruthy()
    reasonOption!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushPromises()

    const submitButton = document.querySelector(
      '[data-testid="crm-account-list-archive-submit"]'
    ) as HTMLElement | null
    expect(submitButton).toBeTruthy()
    submitButton!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(archiveCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1', {
      archiveReason: 'COMPETITOR'
    })
    expect(listCrmAccountsApi).toHaveBeenCalled()
  }, 20_000)

  it('reuses the lead modal to edit draft lead fields without creating a new draft', async () => {
    listCrmAccountsApi.mockResolvedValueOnce({
      crmAccounts: [
        buildCrmAccount({
          displayName: 'Draft Northline',
          leadCompanyName: 'Draft Northline LLC',
          leadCountry: 'US',
          leadDomain: 'draft-northline.example',
          leadEmail: 'draft@northline.example',
          leadIdentifiers: [
            {
              identifierType: 'BUSINESS_REGISTRATION_NO',
              issuerCountryOrRegion: 'US',
              normalizedValue: 'US-778899',
              rawValue: 'US-778899'
            }
          ],
          nextFollowUpAt: '2026-07-15T00:00:00.000Z',
          ownerAccountId: '',
          profileItems: [
            {
              profileItemId: 'profile-domain-draft',
              itemType: 'DOMAIN',
              normalizedValue: 'draft-northline.example',
              rawValue: 'draft-northline.example',
              label: '',
              role: '',
              status: 'ACTIVE',
              sourceRecordId: '',
              promotedTargetType: '',
              promotedTargetId: '',
              promotedAt: '',
              createdAt: '2026-06-10T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z'
            },
            {
              profileItemId: 'profile-email-draft',
              itemType: 'EMAIL',
              normalizedValue: 'draft@northline.example',
              rawValue: 'draft@northline.example',
              label: '',
              role: '',
              status: 'ACTIVE',
              sourceRecordId: '',
              promotedTargetType: '',
              promotedTargetId: '',
              promotedAt: '',
              createdAt: '2026-06-10T00:00:00.000Z',
              updatedAt: '2026-06-10T00:00:00.000Z'
            }
          ],
          recordStatus: 'DRAFT'
        })
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-edit-draft-crm-account-1')
    await flushPromises()

    expect((document.querySelector('[data-testid="crm-lead-display-name"]') as HTMLInputElement).value).toBe(
      'Draft Northline'
    )
    expect((document.querySelector('[data-testid="crm-profile-value-0"]') as HTMLInputElement).value).toBe(
      'draft-northline.example'
    )
    expect((document.querySelector('[data-testid="crm-profile-value-1"]') as HTMLInputElement).value).toBe(
      'draft@northline.example'
    )
    expect((document.querySelector('[data-testid="crm-identifier-value-0"]') as HTMLInputElement).value).toBe(
      'US-778899'
    )
    await setDocumentInputValue('crm-lead-display-name', 'Draft Northline Updated')
    await setDocumentInputValue('crm-lead-legal-name', 'Draft Northline Legal Updated LLC')
    await setDocumentInputValue('crm-profile-value-0', 'updated-northline.example')
    await setDocumentInputValue('crm-identifier-value-0', 'US-778899-UPDATED')
    ;(document.querySelector('[data-testid="crm-draft-save"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(updateDraftLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      expect.objectContaining({
        displayName: 'Draft Northline Updated',
        leadLegalName: 'Draft Northline Legal Updated LLC',
        leadCountry: 'US',
        leadDomain: 'updated-northline.example',
        leadIdentifiers: [
          {
            identifierType: 'BUSINESS_REGISTRATION_NO',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-778899-UPDATED',
            rawValue: 'US-778899-UPDATED'
          }
        ],
        partyTypeHint: 'ORGANIZATION',
        profileItems: [
          {
            itemType: 'DOMAIN',
            normalizedValue: 'updated-northline.example',
            rawValue: 'updated-northline.example'
          },
          {
            itemType: 'EMAIL',
            normalizedValue: 'draft@northline.example',
            rawValue: 'draft@northline.example'
          }
        ],
        priority: 'A'
      })
    )
    expect(createDraftLeadApi).not.toHaveBeenCalled()
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

  it('clears CRM account list filters without leaving the active tab', async () => {
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'crm.accounts'
      },
      query: {
        view: 'PROSPECTS'
      }
    })
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await setDocumentInputValue('crm-filter-keyword', 'kingston')
    await setDocumentInputValue('crm-filter-owner', 'owner-2')
    await wrapper.get('[data-testid="crm-filter-clear"]').trigger('click')
    await flushPromises()

    expect((document.querySelector('[data-testid="crm-filter-keyword"]') as HTMLInputElement).value).toBe('')
    expect((document.querySelector('[data-testid="crm-filter-owner"]') as HTMLInputElement).value).toBe('')
    expect(listCrmAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStage: 'PROSPECT_CUSTOMER',
      ownerAccountId: 'account-1',
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })
  }, 20_000)

  it('shows my archived CRM accounts in a dedicated tab and keeps detail navigation available', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    listCrmAccountsApi.mockResolvedValueOnce({
      crmAccounts: [
        buildCrmAccount({
          displayName: 'Active Northline',
          recordStatus: 'ACTIVE'
        }),
        buildCrmAccount({
          archiveReason: 'NON_TARGET_ACCOUNT',
          archivedAt: '2026-06-23T00:00:00.000Z',
          displayName: 'Archived Northline',
          recordStatus: 'ARCHIVED'
        })
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    const archivedTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text().includes('我的归档'))
    expect(archivedTab).toBeTruthy()
    await archivedTab!.trigger('click')
    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: undefined,
      ownerAccountId: 'account-1',
      page: 1,
      pageSize: 20,
      recordStatus: 'ARCHIVED'
    })
    expect(document.querySelector('.ant-table-tbody')?.textContent).toContain('Archived Northline')
    expect(document.querySelector('.ant-table-tbody')?.textContent).not.toContain('Active Northline')
    expect(document.querySelector('.ant-table-tbody')?.textContent).toContain('归档')
    expect(document.querySelector('.ant-table-thead')?.textContent).toContain('归档原因')
    expect(document.querySelector('.ant-table-tbody')?.textContent).toContain('非目标')
    expect(document.querySelector('.ant-table-tbody')?.textContent).not.toContain('Lead')

    await clickCrmRowAction(wrapper, 'crm-account-1', 'crm-account-detail-crm-account-1')
    expect(routerPush).toHaveBeenCalledWith({
      name: 'TenantCrmAccountDetail',
      params: { crmAccountId: 'crm-account-1' }
    })
  }, 20_000)

  it('restores the active CRM account tab from the route query and persists tab changes for refresh', async () => {
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'crm.accounts'
      },
      query: {
        view: 'PROSPECTS'
      }
    })
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
      lifecycleStage: 'PROSPECT_CUSTOMER',
      ownerAccountId: 'account-1',
      recordStatus: 'ACTIVE'
    }))

    const archivedTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text().includes('我的归档'))
    expect(archivedTab).toBeTruthy()
    await archivedTab!.trigger('click')
    await flushPromises()

    expect(window.localStorage.setItem).toHaveBeenCalledWith('oes.crm.accounts.activeView', 'MY_ARCHIVED')
    expect(routerReplace).toHaveBeenCalledWith({
      query: {
        view: 'MY_ARCHIVED'
      }
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
    await setDocumentInputValue('crm-lead-legal-name', 'Northline Bathworks LLC')
    ;(document.querySelector('[data-testid="crm-profile-add"]') as HTMLButtonElement).click()
    await flushPromises()
    await setDocumentInputValue('crm-profile-value-0', 'northline.example')
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
        leadLegalName: 'Serrano Fixtures',
        leadCountry: 'ES',
        leadDomain: 'serrano.example',
        leadEmail: 'imports@serrano.example',
        partyTypeHint: 'ORGANIZATION',
        profileItems: [
          {
            itemType: 'DOMAIN',
            normalizedValue: 'serrano.example',
            rawValue: 'serrano.example'
          },
          {
            itemType: 'EMAIL',
            normalizedValue: 'imports@serrano.example',
            rawValue: 'imports@serrano.example'
          }
        ],
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
    leadLegalName: 'Northline Bathworks LLC',
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
    profileItems: [
      {
        profileItemId: 'profile-domain-1',
        itemType: 'DOMAIN',
        normalizedValue: 'northline.example',
        rawValue: 'northline.example',
        label: '',
        role: '',
        status: 'ACTIVE',
        sourceRecordId: '',
        promotedTargetType: '',
        promotedTargetId: '',
        promotedAt: '',
        createdAt: '2026-06-10T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z'
      }
    ],
    ...overrides
  }
}
