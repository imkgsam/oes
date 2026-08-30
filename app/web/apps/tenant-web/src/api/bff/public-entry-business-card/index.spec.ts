import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post
  }
}))

// Verifies the tenant-web BusinessCard API client stays aligned with the Public Entry BFF contracts.
describe('tenant-web public entry business card api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    vi.unstubAllGlobals()
  })

  it('calls admin and self-view BFF endpoints without sending contact values as BusinessCard truth', async () => {
    const {
      bindBusinessCardPublicEntryApi,
      disableBusinessCardApi,
      enableBusinessCardApi,
      ensurePrimaryBusinessCardApi,
      getBusinessCardDetailApi,
      getBusinessCardVisitSummaryApi,
      getOwnBusinessCardPreviewApi,
      listBusinessCardContactAssetCandidatesApi,
      listBusinessCardsApi,
      updateBusinessCardContactActionsApi
    } = await import('./index')

    await ensurePrimaryBusinessCardApi('tenant_001', 'emp_001')
    await listBusinessCardsApi('tenant_001', { employeeId: 'emp_001', page: 2, pageSize: 10 })
    await getBusinessCardDetailApi('tenant_001', 'card_001')
    await listBusinessCardContactAssetCandidatesApi('tenant_001', 'emp_001')
    await updateBusinessCardContactActionsApi('tenant_001', 'card_001', {
      contactActionConfigs: [
        {
          contactActionType: 'SEND_EMAIL',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true,
          targetRefId: 'asset_email_001',
          targetRefType: 'CONTACT_ASSET',
          visibility: 'PUBLIC'
        }
      ]
    })
    await enableBusinessCardApi('tenant_001', 'card_001')
    await disableBusinessCardApi('tenant_001', 'card_001')
    await bindBusinessCardPublicEntryApi('tenant_001', 'card_001')
    await getBusinessCardVisitSummaryApi('tenant_001', 'card_001')
    await getOwnBusinessCardPreviewApi('tenant_001')

    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/ensure-primary', {
      employeeId: 'emp_001'
    })
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards', {
      params: { employeeId: 'emp_001', page: 2, pageSize: 10 }
    })
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/card_001')
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/contact-assets', {
      params: { employeeId: 'emp_001' }
    })
    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/card_001/contact-actions', {
      contactActionConfigs: [
        {
          contactActionType: 'SEND_EMAIL',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true,
          targetRefId: 'asset_email_001',
          targetRefType: 'CONTACT_ASSET',
          visibility: 'PUBLIC'
        }
      ]
    })
    expect(JSON.stringify(post.mock.calls)).not.toContain('alex.chen@example.com')
    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/card_001/enable')
    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/card_001/disable')
    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/card_001/public-entry')
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/card_001/visits')
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/business-cards/self/preview')
  })

  it('uses anonymous public API paths and maps bad responses to generic unavailable', async () => {
    const { renderPublicBusinessCardApi, resolveBusinessCardVCardUrl } = await import('./index')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    fetchMock.mockResolvedValueOnce({
      headers: { get: () => 'application/json; charset=utf-8' },
      json: async () => ({
        code: 'SYS_000000',
        data: {
          state: 'AVAILABLE',
          view: {
            businessCardId: 'card_001',
            company: { companyDisplayName: 'OES Manufacturing', privateRegistrationId: 'hidden' },
            contactActions: [{
              actionUrl: 'mailto:public@example.com',
              contactActionType: 'SEND_EMAIL',
              displayOrder: 10,
              sourceCredential: 'hidden'
            }],
            draftNotes: 'hidden',
            person: { accountAvatarUrl: 'hidden', displayName: 'Alex Chen' },
            publicUrl: 'https://go.oes.local/c/ABC1234',
            templateKey: 'TENANT_STANDARD',
            tenantId: 'hidden'
          }
        },
        message: 'Success'
      }),
      ok: true
    })
    await expect(renderPublicBusinessCardApi('card_001')).resolves.toEqual({
      state: 'AVAILABLE',
      view: {
        businessCardId: 'card_001',
        company: { companyDisplayName: 'OES Manufacturing' },
        contactActions: [{
          actionUrl: 'mailto:public@example.com',
          contactActionType: 'SEND_EMAIL',
          displayOrder: 10
        }],
        person: { displayName: 'Alex Chen' },
        publicUrl: 'https://go.oes.local/c/ABC1234',
        templateKey: 'TENANT_STANDARD'
      }
    })

    fetchMock.mockResolvedValueOnce({
      headers: { get: () => 'application/json; charset=utf-8' },
      json: async () => ({ state: 'PUBLIC_CARD_NOT_FOUND', internalReason: 'tenant mismatch' }),
      ok: false,
      status: 404
    })
    await expect(renderPublicBusinessCardApi('card_001')).resolves.toEqual({
      state: 'PUBLIC_CARD_NOT_FOUND'
    })

    fetchMock.mockResolvedValueOnce({
      headers: { get: () => 'application/json; charset=utf-8' },
      json: async () => ({ state: 'PUBLIC_CARD_UNAVAILABLE', reasons: ['CARD_DISABLED'] }),
      ok: true
    })
    await expect(renderPublicBusinessCardApi('card_001')).resolves.toEqual({
      state: 'PUBLIC_CARD_UNAVAILABLE'
    })
    expect(fetchMock).toHaveBeenCalledWith('/public-entry/public/business-cards/card_001', {
      headers: { Accept: 'application/json' }
    })

    fetchMock.mockResolvedValueOnce({
      headers: { get: () => 'text/html' },
      ok: true
    })
    await expect(renderPublicBusinessCardApi('card_001')).resolves.toEqual({
      state: 'PUBLIC_CARD_UNAVAILABLE'
    })

    fetchMock.mockRejectedValueOnce(new Error('internal detail'))
    await expect(renderPublicBusinessCardApi('card_001')).resolves.toEqual({
      state: 'PUBLIC_CARD_UNAVAILABLE'
    })
    expect(resolveBusinessCardVCardUrl('card_001')).toBe('/public-entry/public/business-cards/card_001.vcf')
  })
})
