import { Metadata } from '@grpc/grpc-js'
import { SiteTrustedAssetGrpcAdapter } from '../../src/infrastructure/grpc/site-trusted-asset.grpc.adapter'
import { of } from 'rxjs'

/** Verifies Site→Asset multi-hop calls use fixed audience/codes and private source scope. */
describe('SiteTrustedAssetGrpcAdapter', () => {
  it('uses exact next-hop audience/code and never places identity in request body', async () => {
    const calls: any[] = []; const client: any = { resolveSiteMediaForPublication: jest.fn().mockReturnValue(of({ resolved: {} })), protectSitePublicationReferences: jest.fn().mockReturnValue(of({})), releaseSitePublicationReferences: jest.fn().mockReturnValue(of({})) }
    const adapter = new SiteTrustedAssetGrpcAdapter({ getService: () => client } as any, { forInternalCall: jest.fn(async (audience, codes) => { calls.push({ audience, codes }); return new Metadata() }) } as any, {} as any, { run: (_h: any, cb: any) => cb() } as any)
    await adapter.resolve({ siteId: 'site-1', assetId: 'asset-1', requiredMediaKind: 'image' })
    await adapter.protect({ idempotencyKey: 'i-1', siteId: 'site-1', publishVersion: '2', assetIds: ['asset-1'] })
    await adapter.release({ idempotencyKey: 'i-2', siteId: 'site-1', publishVersion: '2' })
    expect(calls).toEqual([{ audience: 'urn:oes:service:asset-service', codes: ['asset.internal.site_media.resolve'] }, { audience: 'urn:oes:service:asset-service', codes: ['asset.internal.site_media.publication.protect'] }, { audience: 'urn:oes:service:asset-service', codes: ['asset.internal.site_media.publication.release'] }])
    expect(client.resolveSiteMediaForPublication).toHaveBeenCalledWith({ siteId: 'site-1', assetId: 'asset-1', requiredMediaKind: 'image' }, expect.any(Metadata))
  })
})
