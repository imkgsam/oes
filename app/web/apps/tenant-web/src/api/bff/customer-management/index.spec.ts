import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const request = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    request
  }
}))

// Verifies the tenant-web customer-management API client stays aligned with the gateway phase 1 BFF surface.
describe('tenant-web customer management api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    request.mockReset()
  })

  it('creates CRM P1 leads and converts leads through the tenant-scoped BFF endpoints', async () => {
    const {
      archiveCrmAccountApi,
      convertLeadToProspectCustomerApi,
      createCrmLeadApi,
      restoreCrmAccountApi
    } = await import('./index')

    await createCrmLeadApi('tenant-1', {
      displayName: 'Northline Bathworks',
      partyTypeHint: 'ORGANIZATION',
      leadCompanyName: 'Northline Bathworks LLC',
      leadDomain: 'northline.example',
      leadEmail: 'sourcing@northline.example',
      leadCountry: 'US',
      priority: 'A',
      sourceType: 'WEB_RESEARCH',
      sourceRawPayload: { url: 'https://northline.example' }
    })
    await convertLeadToProspectCustomerApi('tenant-1', 'crm-account-1')
    await archiveCrmAccountApi('tenant-1', 'crm-account-1')
    await restoreCrmAccountApi('tenant-1', 'crm-account-1')

    expect(post).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/leads', {
      displayName: 'Northline Bathworks',
      partyTypeHint: 'ORGANIZATION',
      leadCompanyName: 'Northline Bathworks LLC',
      leadDomain: 'northline.example',
      leadEmail: 'sourcing@northline.example',
      leadCountry: 'US',
      priority: 'A',
      sourceType: 'WEB_RESEARCH',
      sourceRawPayload: { url: 'https://northline.example' }
    })
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/leads/crm-account-1/convert-to-prospect-customer',
      {}
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/crm-accounts/crm-account-1/archive',
      {}
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/crm-accounts/crm-account-1/restore',
      {}
    )
  })

  it('lists and reads CRM P1 accounts through the sales workspace BFF endpoints', async () => {
    const {
      getCrmAccountApi,
      listCrmAccountsApi
    } = await import('./index')

    await listCrmAccountsApi('tenant-1', {
      keyword: 'northline',
      lifecycleStage: 'LEAD',
      ownerAccountId: 'account-1',
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })
    await getCrmAccountApi('tenant-1', 'crm-account-1')

    expect(get).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/crm-accounts', {
      params: {
        keyword: 'northline',
        lifecycleStage: 'LEAD',
        ownerAccountId: 'account-1',
        page: 1,
        pageSize: 20,
        recordStatus: 'ACTIVE'
      }
    })
    expect(get).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/crm-accounts/crm-account-1'
    )
  })
})
