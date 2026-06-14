/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const convertLeadToProspectCustomerApi = vi.fn()
const createCrmLeadApi = vi.fn()
const getCrmAccountApi = vi.fn()
const listCrmAccountsApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'crm.customer_account.bind_tenant_party',
    'crm.customer_account.create',
    'crm.customer_account.get_by_id',
    'crm.customer_account.list'
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
  convertLeadToProspectCustomerApi,
  createCrmLeadApi,
  getCrmAccountApi,
  listCrmAccountsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute()
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

// Verifies the CRM P1 workspace uses the tenant-scoped account BFF and keeps lead creation/formalization inside the sales flow.
describe('customer management CRM P1 workspace', () => {
  beforeEach(() => {
    convertLeadToProspectCustomerApi.mockReset()
    createCrmLeadApi.mockReset()
    getCrmAccountApi.mockReset()
    listCrmAccountsApi.mockReset()
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
  })

  it('loads, filters, creates, inspects, and formalizes CRM P1 accounts', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page)

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
    await wrapper.get('[data-testid="crm-lead-display-name"]').setValue('Serrano Fixtures')
    await wrapper.get('[data-testid="crm-lead-domain"]').setValue('serrano.example')
    await wrapper.get('[data-testid="crm-lead-email"]').setValue('imports@serrano.example')
    await wrapper.get('[data-testid="crm-lead-country"]').setValue('ES')
    await wrapper.get('[data-testid="crm-lead-source-type"]').setValue('WEB_RESEARCH')
    await wrapper.get('[data-testid="crm-lead-submit"]').trigger('click')
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
    expect(wrapper.text()).toContain('sourcing@northline.example')

    await wrapper.get('[data-testid="crm-account-convert-crm-account-1"]').trigger('click')
    await flushPromises()

    expect(convertLeadToProspectCustomerApi).toHaveBeenCalledWith('tenant-1', 'crm-account-1')
    expect(wrapper.text()).toContain('CONVERTED')
  }, 20_000)
})
