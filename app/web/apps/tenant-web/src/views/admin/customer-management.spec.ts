/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const archiveCrmAccountApi = vi.fn()
const convertLeadToProspectCustomerApi = vi.fn()
const createCrmLeadApi = vi.fn()
const getCrmAccountApi = vi.fn()
const listCrmAccountsApi = vi.fn()
const restoreCrmAccountApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'crm.account.convert',
    'crm.account.create',
    'crm.account.archive',
    'crm.account.read'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.customer-management']
}

vi.mock('#/api', () => ({
  archiveCrmAccountApi,
  convertLeadToProspectCustomerApi,
  createCrmLeadApi,
  getCrmAccountApi,
  listCrmAccountsApi,
  restoreCrmAccountApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('#/locales', () => ({
  $t: (key: string) => key
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute()
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

// Verifies the CRM P1 workspace uses the tenant-scoped account BFF and keeps lead creation/formalization inside the sales flow.
describe('customer management CRM P1 workspace', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    archiveCrmAccountApi.mockReset()
    convertLeadToProspectCustomerApi.mockReset()
    createCrmLeadApi.mockReset()
    getCrmAccountApi.mockReset()
    listCrmAccountsApi.mockReset()
    restoreCrmAccountApi.mockReset()
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'master-data.customer-management'
      }
    })
    listCrmAccountsApi.mockResolvedValue({
      crmAccounts: [
        {
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
          priority: 'A',
          lastActivityAt: '',
          nextFollowUpAt: '2026-07-01T00:00:00.000Z',
          createdBy: 'account-1',
          createdAt: '2026-06-10T00:00:00.000Z',
          updatedAt: '2026-06-10T00:00:00.000Z',
          archivedAt: ''
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    getCrmAccountApi.mockResolvedValue({
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
      priority: 'A',
      lastActivityAt: '',
      nextFollowUpAt: '2026-07-01T00:00:00.000Z',
      createdBy: 'account-1',
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z',
      archivedAt: ''
    })
    createCrmLeadApi.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: { crmAccountId: 'crm-account-2', displayName: 'Serrano Fixtures' },
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    convertLeadToProspectCustomerApi.mockResolvedValue({
      resultType: 'CONVERTED',
      crmAccount: {
        crmAccountId: 'crm-account-1',
        displayName: 'Northline Bathworks',
        tenantPartyId: 'tenant-party-1'
      },
      candidates: [],
      existingCrmAccountId: ''
    })
    archiveCrmAccountApi.mockResolvedValue({
      crmAccountId: 'crm-account-1',
      recordStatus: 'ARCHIVED',
      lifecycleStage: 'LEAD'
    })
    restoreCrmAccountApi.mockResolvedValue({
      crmAccountId: 'crm-account-1',
      recordStatus: 'ACTIVE',
      lifecycleStage: 'LEAD'
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loads, filters, creates, inspects, and formalizes CRM P1 accounts', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStage: 'LEAD',
      ownerAccountId: undefined,
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })
    expect(wrapper.text()).toContain('Northline Bathworks')

    await wrapper.get('[data-testid="crm-filter-keyword"]').setValue('northline')
    await wrapper.get('[data-testid="crm-filter-owner"]').setValue('account-1')
    await wrapper.get('[data-testid="crm-stage-prospect"]').trigger('click')
    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: 'northline',
      lifecycleStage: 'PROSPECT_CUSTOMER',
      ownerAccountId: 'account-1',
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })

    await wrapper.get('[data-testid="crm-filter-search"]').trigger('click')

    expect(listCrmAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: 'northline',
      lifecycleStage: 'PROSPECT_CUSTOMER',
      ownerAccountId: 'account-1',
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })

    await wrapper.get('[data-testid="crm-create-lead-open"]').trigger('click')
    await flushPromises()
    await setDocumentInputValue('crm-lead-display-name', 'Serrano Fixtures')
    await setDocumentInputValue('crm-lead-domain', 'serrano.example')
    await setDocumentInputValue('crm-lead-email', 'imports@serrano.example')
    wrapper.findComponent({ name: 'CountryRegionSelect' }).vm.$emit('update:value', 'ES')
    ;(wrapper.findComponent('[data-testid="crm-lead-party-type"]') as any).vm.$emit('update:value', 'ORGANIZATION')
    await flushPromises()
    ;(document.querySelector('[data-testid="crm-lead-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(createCrmLeadApi).toHaveBeenCalledWith('tenant-1', {
      displayName: 'Serrano Fixtures',
      leadCompanyName: undefined,
      leadCountry: 'ES',
      leadDomain: 'serrano.example',
      leadEmail: 'imports@serrano.example',
      leadPersonName: undefined,
      leadPhone: undefined,
      leadWhatsapp: undefined,
      nextFollowUpAt: undefined,
      partyTypeHint: 'ORGANIZATION',
      priority: 'B',
      sourceName: undefined,
      sourceNote: undefined,
      sourceType: 'WEB_RESEARCH'
    })

    await wrapper.get('[data-testid="crm-account-detail-crm-account-1"]').trigger('click')
    await flushPromises()

    expect(getCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(document.body.textContent).toContain('sourcing@northline.example')

    await wrapper.get('[data-testid="crm-account-convert-crm-account-1"]').trigger('click')
    await flushPromises()

    expect(convertLeadToProspectCustomerApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(document.body.textContent).toContain('CONVERTED')

    await wrapper.get('[data-testid="crm-account-archive-crm-account-1"]').trigger('click')
    await flushPromises()

    expect(archiveCrmAccountApi).not.toHaveBeenCalled()
    expect(document.querySelector('[data-testid="crm-archive-confirm"]')).toBeTruthy()
    ;(document.querySelector('[data-testid="crm-archive-confirm-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(archiveCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
  }, 20_000)

  it('loads archived CRM accounts and restores them through a confirmed action', async () => {
    listCrmAccountsApi
      .mockResolvedValueOnce({
        crmAccounts: [],
        page: 1,
        pageSize: 20,
        total: 0
      })
      .mockResolvedValueOnce({
        crmAccounts: [
          {
            crmAccountId: 'crm-account-archived-1',
            tenantId: 'tenant-1',
            tenantPartyId: '',
            recordStatus: 'ARCHIVED',
            lifecycleStage: 'LEAD',
            partyTypeHint: 'ORGANIZATION',
            displayName: 'Archived Northline',
            leadCompanyName: 'Archived Northline LLC',
            leadDomain: 'archived-northline.example',
            leadEmail: 'archived@northline.example',
            leadPhone: '',
            leadWhatsapp: '',
            leadCountry: 'US',
            leadIdentifiers: [],
            ownerAccountId: 'account-1',
            priority: 'B',
            lastActivityAt: '',
            nextFollowUpAt: '',
            createdBy: 'account-1',
            createdAt: '2026-06-10T00:00:00.000Z',
            updatedAt: '2026-06-14T00:00:00.000Z',
            archivedAt: '2026-06-14T00:00:00.000Z'
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      })

    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page, { attachTo: document.body })

    await flushPromises()
    await wrapper.get('[data-testid="crm-stage-archived"]').trigger('click')
    await flushPromises()

    expect(listCrmAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: undefined,
      lifecycleStage: undefined,
      ownerAccountId: undefined,
      page: 1,
      pageSize: 20,
      recordStatus: 'ARCHIVED'
    })
    expect(document.body.textContent).toContain('Archived Northline')

    await wrapper.get('[data-testid="crm-account-restore-crm-account-archived-1"]').trigger('click')
    await flushPromises()

    expect(restoreCrmAccountApi).not.toHaveBeenCalled()
    expect(document.querySelector('[data-testid="crm-restore-confirm"]')).toBeTruthy()
    ;(document.querySelector('[data-testid="crm-restore-confirm-submit"]') as HTMLButtonElement).click()
    await flushPromises()

    expect(restoreCrmAccountApi).toHaveBeenCalledWith('tenant-1', 'crm-account-archived-1')
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

    expect(createCrmLeadApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        displayName: 'Northline Bathworks',
        leadCountry: 'US',
        leadDomain: 'northline.example',
        partyTypeHint: 'ORGANIZATION'
      })
    )
    expect(document.querySelector('[data-testid="crm-lead-duplicate-alert"]')).toBeTruthy()
    expect(document.body.textContent).toContain('已存在你负责的重复 Lead')
    expect(document.body.textContent).toContain('Northline Bathworks')
    expect(document.body.textContent).toContain('leadDomain')
    expect(document.querySelector('[data-testid="crm-lead-submit"]')).toBeTruthy()
  }, 20_000)
})
