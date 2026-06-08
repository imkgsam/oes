import {
  PublicRedirectResultType,
  ShortLinkStatus,
  ShortLinkTargetKind
} from '@oes/common/generated/public_entry_service'
import { PublicEntryShortLinkService } from './public-entry-short-link.service'

// Verifies the public-entry BFF service preserves tenant, operator, and target semantics for ShortLink RPCs.
describe('PublicEntryShortLinkService', () => {
  const adapter = {
    changeShortLinkStatus: jest.fn(),
    createShortLink: jest.fn(),
    generateShortLinkQr: jest.fn(),
    getShortLink: jest.fn(),
    getShortLinkStats: jest.fn(),
    listShortLinksByTarget: jest.fn(),
    resolvePublicRedirect: jest.fn(),
    updateShortLinkMetadata: jest.fn(),
    updateShortLinkTarget: jest.fn()
  }
  const service = new PublicEntryShortLinkService(adapter as never)
  const source = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: {
      aid: 'account-1',
      orgId: 'org-1',
      scopeLevel: 'TENANT',
      tid: 'tenant-1'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps EXTERNAL_URL creation into a tenant-scoped RPC command with operator context', async () => {
    adapter.createShortLink.mockResolvedValue({ shortLink: { id: 'short-link-1' } })

    await expect(
      service.createShortLink(
        'tenant-1',
        {
          displayName: 'Customer portal entry',
          target: {
            targetKind: 'EXTERNAL_URL',
            targetUrl: 'https://portal.example.com/welcome'
          },
          entryPurpose: 'BUSINESS_CARD',
          sourcePlacement: 'ADMIN',
          campaignRef: 'launch-2026',
          expiresAt: '2026-08-01T00:00:00.000Z'
        },
        source as never
      )
    ).resolves.toEqual({ shortLink: { id: 'short-link-1' } })

    expect(adapter.createShortLink).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        displayName: 'Customer portal entry',
        target: {
          targetKind: ShortLinkTargetKind.SHORT_LINK_TARGET_KIND_EXTERNAL_URL,
          targetType: undefined,
          targetResourceId: undefined,
          targetUrl: 'https://portal.example.com/welcome'
        },
        entryPurpose: 'BUSINESS_CARD',
        sourcePlacement: 'ADMIN',
        campaignRef: 'launch-2026',
        expiresAt: '2026-08-01T00:00:00.000Z',
        operatorContext: {
          operatorAccountId: 'account-1',
          operatorOrgId: 'org-1',
          traceId: 'trace-1'
        }
      },
      source
    )
  })

  it('maps target migration, metadata, status, stats, and QR operations without changing tenant boundary', async () => {
    adapter.updateShortLinkTarget.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    adapter.updateShortLinkMetadata.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    adapter.changeShortLinkStatus.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    adapter.getShortLinkStats.mockResolvedValue({ totalVisits: 3 })
    adapter.generateShortLinkQr.mockResolvedValue({ imageBase64: 'abc' })

    await service.updateTarget(
      'tenant-1',
      'short-link-1',
      {
        target: {
          targetKind: 'INTERNAL_REF',
          targetType: 'BUSINESS_CARD',
          targetResourceId: 'card-1'
        },
        reason: 'move to governed internal target'
      },
      source as never
    )
    await service.updateMetadata(
      'tenant-1',
      'short-link-1',
      {
        displayName: 'Updated link',
        entryPurpose: 'BUSINESS_CARD',
        sourcePlacement: 'ADMIN',
        campaignRef: '',
        expiresAt: undefined
      },
      source as never
    )
    await service.changeStatus(
      'tenant-1',
      'short-link-1',
      { targetStatus: 'DISABLED', reason: 'manual review' },
      source as never
    )
    await service.getStats(
      'tenant-1',
      'short-link-1',
      { from: '2026-07-01T00:00:00.000Z', to: '2026-07-31T00:00:00.000Z' },
      source as never
    )
    await service.generateQr('tenant-1', 'short-link-1', source as never)

    expect(adapter.updateShortLinkTarget).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        shortLinkId: 'short-link-1',
        reason: 'move to governed internal target',
        target: {
          targetKind: ShortLinkTargetKind.SHORT_LINK_TARGET_KIND_INTERNAL_REF,
          targetType: 'BUSINESS_CARD',
          targetResourceId: 'card-1',
          targetUrl: undefined
        }
      }),
      source
    )
    expect(adapter.updateShortLinkMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        shortLinkId: 'short-link-1',
        displayName: 'Updated link'
      }),
      source
    )
    expect(adapter.changeShortLinkStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        shortLinkId: 'short-link-1',
        targetStatus: ShortLinkStatus.SHORT_LINK_STATUS_DISABLED
      }),
      source
    )
    expect(adapter.getShortLinkStats).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        shortLinkId: 'short-link-1',
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z'
      },
      source
    )
    expect(adapter.generateShortLinkQr).toHaveBeenCalledWith(
      { tenantId: 'tenant-1', shortLinkId: 'short-link-1' },
      source
    )
  })

  it('normalizes list pagination and public redirect result types for the web BFF', async () => {
    adapter.listShortLinksByTarget.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 })
    adapter.resolvePublicRedirect
      .mockResolvedValueOnce({
        resultType: PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT,
        location: 'https://example.com/entry'
      })
      .mockResolvedValueOnce({
        resultType: PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_NOT_FOUND
      })
      .mockResolvedValueOnce({
        resultType: PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_UNAVAILABLE
      })

    await service.listByTarget(
      'tenant-1',
      { targetType: 'BUSINESS_CARD', targetResourceId: 'card-1', page: '-1', pageSize: 'bad' },
      source as never
    )

    await expect(
      service.resolvePublicRedirect('abc1234', {
        userAgent: 'Mozilla/5.0',
        ipAddress: '203.0.113.8',
        acceptLanguage: 'zh-CN',
        referrer: 'https://example.com',
        requestId: 'req-public',
        traceId: 'trace-public'
      })
    ).resolves.toEqual({ type: 'REDIRECT', location: 'https://example.com/entry' })
    await expect(service.resolvePublicRedirect('missing', {})).resolves.toEqual({
      type: 'NOT_FOUND',
      location: ''
    })
    await expect(service.resolvePublicRedirect('disabled', {})).resolves.toEqual({
      type: 'UNAVAILABLE',
      location: ''
    })

    expect(adapter.listShortLinksByTarget).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        targetType: 'BUSINESS_CARD',
        targetResourceId: 'card-1',
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(adapter.resolvePublicRedirect).toHaveBeenCalledWith(
      {
        shortCode: 'abc1234',
        userAgent: 'Mozilla/5.0',
        ipAddress: '203.0.113.8',
        acceptLanguage: 'zh-CN',
        referrer: 'https://example.com',
        traceId: 'trace-public'
      },
      { requestId: 'req-public', traceId: 'trace-public' }
    )
  })
})
