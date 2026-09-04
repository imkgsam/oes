/* @vitest-environment happy-dom */


import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const claimCrmAccountApi = vi.fn()
const archiveCrmAccountApi = vi.fn()
const convertLeadToProspectCustomerApi = vi.fn()
const deleteDraftLeadApi = vi.fn()
const getCrmAccountApi = vi.fn()
const listCrmSourceRecordsApi = vi.fn()
const submitDraftLeadApi = vi.fn()
const updateCrmAccountIdentifiersApi = vi.fn()
const routerPush = vi.fn()

const authContextState: any = {
  actionCodes: [
    'crm.account.claim',
    'crm.account.convert',
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
  }
}

vi.mock('#/api', () => ({
  archiveCrmAccountApi,
  claimCrmAccountApi,
  convertLeadToProspectCustomerApi,
  deleteDraftLeadApi,
  getCrmAccountApi,
  listCrmSourceRecordsApi,
  submitDraftLeadApi,
  updateCrmAccountIdentifiersApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      crmAccountId: 'crm-account-1'
    }
  }),
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
    template: '<span />'
  }
}))

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      locale: 'zh-CN'
    }
  }
}))

vi.mock('#/components/collaboration-panel/NotesTab.vue', () => ({
  default: {
    name: 'NotesTab',
    props: ['objectContext'],
    template: '<div data-testid="crm-detail-collaboration">{{ objectContext.archived ? "archived" : "active" }}</div>'
  }
}))

// Opens the detail page action dropdown and dispatches one teleported Menu action.
async function clickDetailDropdownAction(wrapper: any, actionTestId: string) {
  await wrapper.get('[data-testid="crm-account-detail-more-actions"]').trigger('click')
  await flushPromises()
  const action = document.querySelector(`[data-testid="${actionTestId}"]`) as HTMLElement | null
  expect(action).toBeTruthy()
  action!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await flushPromises()
}

// Updates Ant Design dialog inputs rendered in the detail page test DOM.
async function setDocumentInputValue(testId: string, value: string) {
  const input = document.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement | null
  expect(input).toBeTruthy()
  input!.value = value
  input!.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

// Activates one Ant Design tab by its visible label in the mounted detail page.
async function clickDetailTab(wrapper: any, label: string) {
  const tab = wrapper.findAll('.ant-tabs-tab-btn').find((candidate: any) => candidate.text() === label)
  expect(tab).toBeTruthy()
  await tab!.trigger('click')
  await flushPromises()
}

// Verifies the CRM account detail page owns detail loading instead of the list Drawer.
describe('customer management CRM account detail page', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    claimCrmAccountApi.mockReset()
    archiveCrmAccountApi.mockReset()
    convertLeadToProspectCustomerApi.mockReset()
    deleteDraftLeadApi.mockReset()
    getCrmAccountApi.mockReset()
    listCrmSourceRecordsApi.mockReset()
    routerPush.mockReset()
    submitDraftLeadApi.mockReset()
    updateCrmAccountIdentifiersApi.mockReset()
    authContextState.actionCodes = [
      'crm.account.claim',
      'crm.account.convert',
      'crm.account.manage',
      'crm.account.read',
      'crm.account.update'
    ]
    getCrmAccountApi.mockResolvedValue(buildCrmAccount())
    listCrmSourceRecordsApi.mockResolvedValue({
      sourceRecords: [
        {
          sourceRecordId: 'source-1',
          crmAccountId: 'crm-account-1',
          sourceType: 'WEB_RESEARCH',
          sourceName: 'Research page',
          capturedAt: '2026-06-24T08:00:00.000Z',
          capturedByAccountId: 'account-1',
          capturedByDisplayName: '陈双鹏',
          externalReference: 'https://northline.example',
          rawPayload: { url: 'https://northline.example' },
          note: 'Found through research',
          isPrimary: true,
          createdAt: '2026-06-24T08:01:00.000Z',
          updatedAt: '2026-06-24T08:02:00.000Z'
        }
      ]
    })
    claimCrmAccountApi.mockResolvedValue(buildCrmAccount({ ownerAccountId: 'account-1' }))
    archiveCrmAccountApi.mockResolvedValue(
      buildCrmAccount({
        archiveReason: 'COMPETITOR',
        archivedAt: '2026-06-23T00:00:00.000Z',
        recordStatus: 'ARCHIVED'
      })
    )
    convertLeadToProspectCustomerApi.mockResolvedValue({
      resultType: 'CONVERTED',
      crmAccount: buildCrmAccount({
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      }),
      candidates: [],
      existingCrmAccountId: ''
    })
    updateCrmAccountIdentifiersApi.mockResolvedValue(
      buildCrmAccount({
        leadIdentifiers: [
          {
            identifierType: 'VAT_NO',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-91-4432102',
            rawValue: '91-4432102'
          }
        ],
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      })
    )
  })

  it('loads CRM account detail from the route param and returns to the account workspace', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(getCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(listCrmSourceRecordsApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(wrapper.text()).toContain('Northline Bathworks')
    expect(wrapper.text()).toContain('northline.example / northline.us')
    expect(wrapper.text()).toContain('sourcing@northline.example / orders@northline.us')
    expect(wrapper.text()).toContain('陈双鹏')
    expect(wrapper.text()).not.toContain('刷新')

    await wrapper.get('[data-testid="crm-account-detail-back"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({ name: 'TenantCrmAccounts' })
  })

  it('renders real source records in the source tab', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await clickDetailTab(wrapper, '来源记录')

    expect(wrapper.text()).toContain('Research page')
    expect(wrapper.text()).toContain('主来源')
    expect(wrapper.text()).toContain('WEB_RESEARCH')
    expect(wrapper.text()).toContain('陈双鹏')
    expect(wrapper.text()).toContain('https://northline.example')
    expect(wrapper.text()).not.toContain('暂无来源记录')
  })

  it('shows source empty state only when the source API returns no records', async () => {
    listCrmSourceRecordsApi.mockResolvedValueOnce({ sourceRecords: [] })
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await clickDetailTab(wrapper, '来源记录')

    expect(wrapper.text()).toContain('暂无来源记录')
  })

  it('keeps the responsibility summary only in the overview content', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.text().match(/责任摘要/g)).toHaveLength(1)
    expect(wrapper.find('.crm-account-detail__owner').exists()).toBe(false)
    expect(wrapper.text()).toContain('跟进摘要')
  })

  it('renders notes as a tab-row action that opens the drawer without changing the active tab', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    const tabLabels = wrapper.findAll('.ant-tabs-tab-btn').map((tab) => tab.text())
    expect(tabLabels).not.toContain('协作')
    expect(tabLabels).toEqual(expect.arrayContaining(['概览', '来源记录', '联系方式', '跟进动态']))

    const headerActions = wrapper.get('.crm-account-detail__actions')
    expect(headerActions.find('[data-testid="collaboration-panel-open"]').exists()).toBe(false)

    const tabAction = wrapper.get('.crm-account-detail__tabs .ant-tabs-extra-content [data-testid="collaboration-panel-open"]')
    expect(tabAction.text()).toContain('备注')
    await tabAction.trigger('click')
    await flushPromises()

    expect(wrapper.find('.ant-tabs-tab-active').text()).toContain('概览')
    expect(document.body.textContent).toContain('Northline Bathworks')
    expect(document.querySelector('[data-testid="crm-detail-collaboration"]')?.textContent).toContain('active')
  })

  it('keeps active Lead actions on the independent detail page', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-account-detail-convert"]').trigger('click')
    await flushPromises()
    await setDocumentInputValue('crm-account-detail-convert-legal-name', 'Northline Bathworks LLC')
    ;(document.querySelector('[data-testid="crm-account-detail-convert-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(convertLeadToProspectCustomerApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1', {
      legalName: 'Northline Bathworks LLC'
    })
    expect(wrapper.text()).toContain('潜在客户')
  })

  it('renders identifier-bound Prospect Customer identifiers as locked read-only facts', async () => {
    getCrmAccountApi.mockResolvedValueOnce(
      buildCrmAccount({
        leadIdentifiers: [
          {
            identifierType: 'VAT_NO',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-91-4432102',
            rawValue: '91-4432102'
          }
        ],
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      })
    )
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.get('[data-testid="crm-account-identifier-lock"]').text()).toContain('已锁定')
    expect(wrapper.text()).toContain('US / VAT No / US-91-4432102')
    expect(wrapper.find('[data-testid="crm-account-identifiers-edit"]').exists()).toBe(false)
  })

  it('allows adding country-specific official identity rows on a Prospect Customer that is not identifier-locked', async () => {
    getCrmAccountApi.mockResolvedValueOnce(
      buildCrmAccount({
        leadIdentifiers: [],
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      })
    )
    updateCrmAccountIdentifiersApi.mockResolvedValueOnce(
      buildCrmAccount({
        leadIdentifiers: [
          {
            identifierType: 'TAX_ID',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-91-4432102',
            rawValue: 'US-91-4432102'
          }
        ],
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      })
    )
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-account-identifiers-edit"]').trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('编辑登记/证件')
    expect(document.body.textContent).not.toContain('Identifier')

    ;(document.querySelector('[data-testid="crm-identifier-add"]') as HTMLButtonElement).click()
    await flushPromises()
    expect(wrapper.findAllComponents({ name: 'CountryRegionSelect' })).toHaveLength(1)
    expect((wrapper.findComponent('[data-testid="crm-identifier-type-0"]') as any).props('value')).toBe('')

    const value = document.querySelector('[data-testid="crm-identifier-value-0"]') as HTMLInputElement
    ;(wrapper.findComponent('[data-testid="crm-identifier-country-0"]') as any).vm.$emit('update:value', 'US')
    await flushPromises()
    const usIdentifierLabels = (
      (wrapper.findComponent('[data-testid="crm-identifier-type-0"]') as any).props('options') as Array<{
        label: string
      }>
    ).map((option) => option.label)
    expect(usIdentifierLabels).toContain('EIN')
    expect(usIdentifierLabels).not.toContain('VAT No')
    ;(wrapper.findComponent('[data-testid="crm-identifier-type-0"]') as any).vm.$emit('update:value', 'TAX_ID')
    value.value = 'US-91-4432102'
    value.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    ;(document.querySelector('[data-testid="crm-account-identifiers-save"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(updateCrmAccountIdentifiersApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1', {
      leadIdentifiers: [
        {
          identifierType: 'TAX_ID',
          issuerCountryOrRegion: 'US',
          normalizedValue: 'US-91-4432102',
          rawValue: 'US-91-4432102'
        }
      ]
    })
    expect(wrapper.text()).toContain('US / EIN / US-91-4432102')
  })

  it('allows claiming ownerless Pool records from the detail page', async () => {
    getCrmAccountApi.mockResolvedValueOnce(buildCrmAccount({ ownerAccountId: '', ownerDisplayName: '' }))
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await clickDetailDropdownAction(wrapper, 'crm-account-detail-claim')

    expect(claimCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(wrapper.text()).toContain('陈双鹏')
  })

  it('archives an active Lead from the detail page with a required CRM reason', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-account-detail-more-actions"]').trigger('click')
    await flushPromises()
    const archiveAction = document.querySelector(
      '[data-testid="crm-account-detail-archive"]'
    ) as HTMLElement | null
    expect(archiveAction).toBeTruthy()
    archiveAction!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushPromises()

    const reasonOption = document.querySelector(
      '[data-testid="crm-account-detail-archive-reason-COMPETITOR"]'
    ) as HTMLElement | null
    expect(reasonOption).toBeTruthy()
    reasonOption!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushPromises()
    const submitButton = document.querySelector(
      '[data-testid="crm-account-detail-archive-submit"]'
    ) as HTMLElement | null
    expect(submitButton).toBeTruthy()
    submitButton!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(archiveCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1', {
      archiveReason: 'COMPETITOR'
    })
    expect(wrapper.text()).toContain('ARCHIVED')
    expect(wrapper.text()).toContain('同行')
  })

  it('does not expose the owner account id as a display name when identity has no name', async () => {
    getCrmAccountApi.mockResolvedValueOnce(
      buildCrmAccount({
        ownerAccountId: '00000000-0000-4000-8000-000000000911',
        ownerDisplayName: ''
      })
    )
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.text()).toContain('未命名负责人')
    expect(wrapper.text()).not.toContain('00000000-0000-4000-8000-000000000911')
  })

  it('shows the creator display name instead of the raw creator account id', async () => {
    getCrmAccountApi.mockResolvedValueOnce(
      buildCrmAccount({
        createdBy: '00000000-0000-4000-8000-000000000901',
        createdByDisplayName: '林晓雯'
      })
    )
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(wrapper.text()).toContain('林晓雯')
    expect(wrapper.text()).not.toContain('00000000-0000-4000-8000-000000000901')
  })

  it('passes archived state into the collaboration panel', async () => {
    getCrmAccountApi.mockResolvedValueOnce(
      buildCrmAccount({
        archivedAt: '2026-06-20T00:00:00.000Z',
        recordStatus: 'ARCHIVED'
      })
    )
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="collaboration-panel-open"]').trigger('click')
    await flushPromises()

    expect(document.querySelector('[data-testid="crm-detail-collaboration"]')?.textContent).toContain('archived')
  })
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
    leadPersonName: 'Mara Sinclair',
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
    createdByDisplayName: '陈双鹏',
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
      },
      {
        profileItemId: 'profile-domain-2',
        itemType: 'DOMAIN',
        normalizedValue: 'northline.us',
        rawValue: 'northline.us',
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
        profileItemId: 'profile-email-1',
        itemType: 'EMAIL',
        normalizedValue: 'sourcing@northline.example',
        rawValue: 'sourcing@northline.example',
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
        profileItemId: 'profile-email-2',
        itemType: 'EMAIL',
        normalizedValue: 'orders@northline.us',
        rawValue: 'orders@northline.us',
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
