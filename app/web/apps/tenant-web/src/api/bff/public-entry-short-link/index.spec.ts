import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post
  }
}))

// Verifies the tenant-web ShortLink API client stays aligned with Public Entry BFF paths.
describe('tenant-web public entry short link api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('creates, reads, updates, changes status, reads stats, and previews QR', async () => {
    const {
      changePublicEntryShortLinkStatusApi,
      createPublicEntryShortLinkApi,
      getPublicEntryShortLinkApi,
      getPublicEntryShortLinkQrApi,
      getPublicEntryShortLinkStatsApi,
      listPublicEntryShortLinksByTargetApi,
      resolvePublicEntryShortLinkQrDownloadUrl,
      updatePublicEntryShortLinkMetadataApi,
      updatePublicEntryShortLinkTargetApi
    } = await import('./index')

    await createPublicEntryShortLinkApi('tenant_001', {
      displayName: 'Catalog QR',
      entryPurpose: 'CATALOG',
      sourcePlacement: 'SHOWROOM',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/catalog' }
    })
    await getPublicEntryShortLinkApi('tenant_001', 'sl_001')
    await listPublicEntryShortLinksByTargetApi('tenant_001', {
      page: 1,
      pageSize: 20,
      targetResourceId: 'card_001',
      targetType: 'BUSINESS_CARD'
    })
    await updatePublicEntryShortLinkTargetApi('tenant_001', 'sl_001', {
      reason: 'Move to owned page',
      target: { targetKind: 'INTERNAL_REF', targetResourceId: 'card_001', targetType: 'BUSINESS_CARD' }
    })
    await updatePublicEntryShortLinkMetadataApi('tenant_001', 'sl_001', { displayName: 'Main badge' })
    await changePublicEntryShortLinkStatusApi('tenant_001', 'sl_001', {
      reason: 'Pause',
      targetStatus: 'DISABLED'
    })
    await getPublicEntryShortLinkStatsApi('tenant_001', 'sl_001', { from: '2026-06-01T00:00:00Z' })
    await getPublicEntryShortLinkQrApi('tenant_001', 'sl_001')

    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links', {
      displayName: 'Catalog QR',
      entryPurpose: 'CATALOG',
      sourcePlacement: 'SHOWROOM',
      target: { targetKind: 'EXTERNAL_URL', targetUrl: 'https://example.com/catalog' }
    })
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links/sl_001')
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links/by-target', {
      params: {
        page: 1,
        pageSize: 20,
        targetResourceId: 'card_001',
        targetType: 'BUSINESS_CARD'
      }
    })
    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links/sl_001/target', {
      reason: 'Move to owned page',
      target: { targetKind: 'INTERNAL_REF', targetResourceId: 'card_001', targetType: 'BUSINESS_CARD' }
    })
    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links/sl_001/metadata', {
      displayName: 'Main badge'
    })
    expect(post).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links/sl_001/status', {
      reason: 'Pause',
      targetStatus: 'DISABLED'
    })
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links/sl_001/stats', {
      params: { from: '2026-06-01T00:00:00Z' }
    })
    expect(get).toHaveBeenCalledWith('/public-entry/tenants/tenant_001/short-links/sl_001/qr')
    expect(resolvePublicEntryShortLinkQrDownloadUrl('tenant_001', 'sl_001')).toBe(
      '/public-entry/tenants/tenant_001/short-links/sl_001/qr.png'
    )
  })
})
