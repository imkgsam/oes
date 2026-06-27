import { describe, expect, it, vi } from 'vitest'

import { ExtensionCrmApi } from './crm-api'

describe('ExtensionCrmApi', () => {
  it('calls extension CRM endpoints with bearer auth', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { status: 'UNKNOWN' }, success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    )
    const api = new ExtensionCrmApi({
      accessTokenProvider: async () => 'access-token-1',
      baseUrl: 'http://localhost:9101/api/v1',
      fetchImpl,
      workspaceEnabledProvider: async () => true
    })

    await expect(
      api.resolvePageContext({
        page: {
          capturedAt: '2026-06-23T00:00:00.000Z',
          domain: 'serrano.example',
          pageKind: 'OFFICIAL_SITE',
          title: 'Serrano',
          url: 'https://serrano.example'
        }
      })
    ).resolves.toEqual({ status: 'UNKNOWN' })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/crm/page-context/resolve',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-1'
        }),
        method: 'POST'
      })
    )
  })

  it('refuses CRM calls while the local workspace is disabled', async () => {
    const fetchImpl = vi.fn()
    const api = new ExtensionCrmApi({
      accessTokenProvider: async () => 'access-token-1',
      fetchImpl,
      workspaceEnabledProvider: async () => false
    })

    await expect(api.getAccountSummary('crm-1')).rejects.toThrow('CRM workspace is disabled')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('refreshes an expired access token once and retries the CRM request', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Authorization token is invalid or expired' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 401,
          statusText: 'Unauthorized'
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { status: 'UNKNOWN' }, success: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        })
      )
    const refreshAccessTokenProvider = vi.fn().mockResolvedValue('fresh-token-1')
    const api = new ExtensionCrmApi({
      accessTokenProvider: async () => 'expired-token-1',
      baseUrl: 'http://localhost:9101/api/v1',
      fetchImpl,
      refreshAccessTokenProvider,
      workspaceEnabledProvider: async () => true
    })

    await expect(
      api.checkDuplicate({ displayName: 'Serrano Fixtures', leadDomain: 'serrano.example' })
    ).resolves.toEqual({ status: 'UNKNOWN' })

    expect(refreshAccessTokenProvider).toHaveBeenCalledOnce()
    expect(fetchImpl.mock.calls.map(([, init]) => (init.headers as Record<string, string>).Authorization)).toEqual([
      'Bearer expired-token-1',
      'Bearer fresh-token-1'
    ])
  })

  it('maps every CRM P1 capability to the extension BFF endpoint', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ data: { ok: true }, success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    ))
    const api = new ExtensionCrmApi({
      accessTokenProvider: async () => 'access-token-1',
      baseUrl: 'http://localhost:9101/api/v1',
      fetchImpl,
      workspaceEnabledProvider: async () => true
    })
    const page = {
      capturedAt: '2026-06-23T00:00:00.000Z',
      domain: 'serrano.example',
      pageKind: 'OFFICIAL_SITE' as const,
      title: 'Serrano',
      url: 'https://serrano.example'
    }

    await api.resolvePageContext({ page })
    await api.resolveSearchResults({
      capturedAt: page.capturedAt,
      query: 'serrano',
      results: [{ domain: page.domain, title: page.title, url: page.url }],
      searchEngine: 'GOOGLE'
    })
    await api.checkDuplicate({ displayName: 'Serrano', page })
    await api.createDraftLead({ displayName: 'Serrano', page })
    await api.listDraftLeads({ accountId: 'account-1', tenantId: 'tenant-1' })
    await api.updateDraftLead('tenant-1', 'draft-1', { displayName: 'Serrano', leadDomain: 'serrano.example' })
    await api.submitDraftLead('tenant-1', 'draft-1', { assignmentIntent: 'OWNED_BY_OPERATOR' })
    await api.deleteDraftLead('tenant-1', 'draft-1')
    await api.createActiveLead({ displayName: 'Serrano', page })
    await api.claimPoolLead('crm-pool-1')
    await api.getAccountSummary('crm-owned-1')

    expect(fetchImpl.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['http://localhost:9101/api/v1/extension/crm/page-context/resolve', 'POST'],
      ['http://localhost:9101/api/v1/extension/crm/search-results/resolve', 'POST'],
      ['http://localhost:9101/api/v1/extension/crm/leads/check-duplicate', 'POST'],
      ['http://localhost:9101/api/v1/extension/crm/draft-leads', 'POST'],
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/crm-accounts?createdBy=account-1&page=1&pageSize=50&recordStatus=DRAFT', 'GET'],
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/draft-leads/draft-1', 'PATCH'],
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/draft-leads/draft-1/submit', 'POST'],
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/draft-leads/draft-1', 'DELETE'],
      ['http://localhost:9101/api/v1/extension/crm/leads', 'POST'],
      ['http://localhost:9101/api/v1/extension/crm/accounts/crm-pool-1/claim', 'POST'],
      ['http://localhost:9101/api/v1/extension/crm/accounts/crm-owned-1', 'GET']
    ])
  })
})
