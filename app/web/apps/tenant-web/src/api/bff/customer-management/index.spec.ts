import { beforeEach, describe, expect, it, vi } from 'vitest'

const deleteRequest = vi.fn()
const get = vi.fn()
const post = vi.fn()
const request = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    delete: deleteRequest,
    get,
    post,
    request
  }
}))

// Verifies the tenant-web customer-management API client stays aligned with the CRM P1 BFF account surface.
describe('tenant-web customer management api', () => {
  beforeEach(() => {
    deleteRequest.mockReset()
    get.mockReset()
    post.mockReset()
    request.mockReset()
  })

  it('runs CRM P1 lead workflow actions through the tenant-scoped BFF endpoints', async () => {
    const {
      checkLeadDuplicateApi,
      claimCrmAccountApi,
      convertLeadToProspectCustomerApi,
      createCrmLeadApi,
      createDraftLeadApi,
      deleteDraftLeadApi,
      releaseCrmAccountApi,
      submitDraftLeadApi,
      updateDraftLeadApi
    } = await import('./index')

    const payload = {
      displayName: 'Northline Bathworks',
      partyTypeHint: 'ORGANIZATION' as const,
      leadCompanyName: 'Northline Bathworks LLC',
      leadDomain: 'northline.example',
      leadEmail: 'sourcing@northline.example',
      leadCountry: 'US',
      priority: 'A' as const,
      sourceType: 'WEB_RESEARCH' as const,
      sourceRawPayload: { url: 'https://northline.example' }
    }

    await checkLeadDuplicateApi('tenant-1', { leadEmail: payload.leadEmail })
    await createDraftLeadApi('tenant-1', payload)
    await updateDraftLeadApi('tenant-1', 'draft-1', payload)
    await submitDraftLeadApi('tenant-1', 'draft-1', { assignmentIntent: 'POOL' })
    await deleteDraftLeadApi('tenant-1', 'draft-1')
    await createCrmLeadApi('tenant-1', { ...payload, assignmentIntent: 'POOL' })
    await createCrmLeadApi('tenant-1', { ...payload, sourceType: 'BROWSER_EXTENSION' })
    await claimCrmAccountApi('tenant-1', 'crm-account-1')
    await releaseCrmAccountApi('tenant-1', 'crm-account-1')
    await convertLeadToProspectCustomerApi('tenant-1', 'crm-account-1')

    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/leads/check-duplicate',
      { leadEmail: 'sourcing@northline.example' }
    )
    expect(post).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/draft-leads', payload)
    expect(request).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/draft-leads/draft-1',
      { data: payload, method: 'PATCH' }
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/draft-leads/draft-1/submit',
      { assignmentIntent: 'POOL' }
    )
    expect(deleteRequest).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/draft-leads/draft-1'
    )
    expect(post).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/leads', {
      ...payload,
      assignmentIntent: 'POOL'
    })
    expect(post).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/leads', {
      ...payload,
      sourceType: 'BROWSER_EXTENSION'
    })
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/crm-accounts/crm-account-1/claim',
      {}
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/crm-accounts/crm-account-1/release',
      {}
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/leads/crm-account-1/convert-to-prospect-customer',
      {}
    )
  })

  it('lists and reads CRM P1 accounts through the account workspace BFF endpoints', async () => {
    const {
      getCrmAccountApi,
      listCrmAccountsApi
    } = await import('./index')

    await listCrmAccountsApi('tenant-1', {
      keyword: 'northline',
      lifecycleStages: ['LEAD', 'PROSPECT_CUSTOMER'],
      ownerless: true,
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })
    await getCrmAccountApi('tenant-1', 'crm-account-1')

    expect(get).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/crm-accounts', {
      params: {
        keyword: 'northline',
        lifecycleStages: ['LEAD', 'PROSPECT_CUSTOMER'],
        ownerless: true,
        page: 1,
        pageSize: 20,
        recordStatus: 'ACTIVE'
      },
      paramsSerializer: 'repeat'
    })
    expect(get).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/crm-accounts/crm-account-1'
    )
  })
})
