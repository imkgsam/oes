/* @vitest-environment happy-dom */

import { readFileSync } from 'node:fs'

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const claimCrmAccountApi = vi.fn()
const archiveCrmAccountApi = vi.fn()
const convertLeadToProspectCustomerApi = vi.fn()
const deleteDraftLeadApi = vi.fn()
const getCrmAccountApi = vi.fn()
const listCrmSourceRecordsApi = vi.fn()
const submitDraftLeadApi = vi.fn()
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
  submitDraftLeadApi
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
  })

  it('loads CRM account detail from the route param and returns to the account workspace', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(getCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(listCrmSourceRecordsApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(wrapper.text()).toContain('Northline Bathworks')
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

  it('keeps detail header navigation compact and inline on medium-width screens', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page, { attachTo: document.body })
    const source = readFileSync('apps/tenant-web/src/views/admin/customer-management-detail.vue', 'utf8')
    const mediumBreakpointStart = source.indexOf('@media (max-width: 991px)')
    const narrowBreakpointStart = source.indexOf('@media (max-width: 560px)')
    const mediumBreakpointRules = source.slice(
      mediumBreakpointStart,
      narrowBreakpointStart === -1 ? undefined : narrowBreakpointStart
    )

    await flushPromises()

    expect(wrapper.get('[data-testid="crm-account-detail-back"]').classes()).toContain(
      'crm-account-detail__back-button'
    )
    expect(wrapper.get('[data-testid="crm-account-detail-more-actions"]').classes()).toContain(
      'crm-account-detail__more-button'
    )
    expect(mediumBreakpointStart).toBeGreaterThan(-1)
    expect(mediumBreakpointRules).not.toContain('.crm-account-detail__topbar')
    expect(mediumBreakpointRules).toMatch(
      /\.crm-account-detail__actions\s*\{[\s\S]*?justify-content:\s*flex-end/
    )
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

    expect(convertLeadToProspectCustomerApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(wrapper.text()).toContain('潜在客户')
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
    ...overrides
  }
}
