import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { SiteAdminGrpcAdapter } from './site-admin-grpc.adapter'

/** Verifies the Gateway BFF sends all Site Media admin calls with Asset-scoped BUSINESS authority. */
describe('SiteAdminGrpcAdapter Site Media calls', () => {
  it('uses exact Asset audience/codes and preserves upload streaming', async () => {
    const media = {
      uploadSiteMedia: jest.fn().mockReturnValue(of({ accepted: true })),
      listAuthorizedSiteMedia: jest.fn().mockReturnValue(of({ assets: [] })),
      prepareSiteMediaRemoteDelivery: jest.fn().mockReturnValue(of({ status: 'PREPARED' })),
      activateSiteMediaRemoteDelivery: jest.fn().mockReturnValue(of({ status: 'PENDING' })),
      archiveSiteMedia: jest.fn().mockReturnValue(of({ status: 'ARCHIVED' })),
      takeDownSiteMedia: jest.fn().mockReturnValue(of({ status: 'PURGE_PENDING' })),
      getSiteMediaDeliveryStatus: jest.fn().mockReturnValue(of({ status: 'ACTIVE' })),
      deleteSiteMedia: jest.fn().mockReturnValue(of({ status: 'DELETED' }))
    }
    const metadata = new Metadata()
    const producer = {
      forBusinessCall: jest.fn().mockResolvedValue(metadata)
    }
    const client = { getService: jest.fn().mockReturnValue({}) }
    const assetClient = { getSiteMediaService: jest.fn().mockReturnValue(media) }
    const adapter = new SiteAdminGrpcAdapter(client as never, producer as never, assetClient as never)
    adapter.onModuleInit()
    const source = { requestId: 'r-1', traceId: 't-1', user: { holderId: 'operator-1', tenantId: 'tenant-1' } } as any
    const stream = of({ start: { siteId: 'site-1', mediaKind: 'IMAGE' } }, { contentChunk: { sequence: 1 } })

    await adapter.uploadSiteMedia(stream as any, source)
    await adapter.listAuthorizedSiteMedia({ siteId: 'site-1' } as any, source)
    await adapter.prepareSiteMediaRemoteDelivery({ siteId: 'site-1', idempotencyKey: 'k', mediaHost: 'media.example' } as any, source)
    await adapter.activateSiteMediaRemoteDelivery({ siteId: 'site-1', idempotencyKey: 'k' } as any, source)
    await adapter.archiveSiteMedia({ assetId: 'asset-1', idempotencyKey: 'a' } as any, source)
    await adapter.takeDownSiteMedia({ assetId: 'asset-1', idempotencyKey: 'd', reasonCode: 'policy' } as any, source)
    await adapter.getSiteMediaDeliveryStatus({ assetId: 'asset-1' } as any, source)
    await adapter.deleteSiteMedia({ assetId: 'asset-1', idempotencyKey: 'x', deletionReason: 'retired' } as any, source)

    expect(producer.forBusinessCall.mock.calls.map((call) => call.slice(1))).toEqual([
      ['urn:oes:service:asset-service', ['asset.site_media.upload']],
      ['urn:oes:service:asset-service', ['asset.site_media.read']],
      ['urn:oes:service:asset-service', ['asset.site_media.delivery.manage']],
      ['urn:oes:service:asset-service', ['asset.site_media.delivery.manage']],
      ['urn:oes:service:asset-service', ['asset.site_media.archive']],
      ['urn:oes:service:asset-service', ['asset.site_media.takedown']],
      ['urn:oes:service:asset-service', ['asset.site_media.read']],
      ['urn:oes:service:asset-service', ['asset.site_media.delete']]
    ])
    expect(media.uploadSiteMedia).toHaveBeenCalledWith(stream, metadata)
    expect(media.listAuthorizedSiteMedia.mock.calls[0][0]).not.toEqual(
      expect.objectContaining({ tenantId: expect.anything(), operatorId: expect.anything(), context: expect.anything() })
    )
  })
})
