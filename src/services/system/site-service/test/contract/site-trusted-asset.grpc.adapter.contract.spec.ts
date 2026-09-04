import { Metadata } from '@grpc/grpc-js'
import { getAuthenticatedGrpcRequestContext, getGrpcAuthorizationBearer, RPC_OPERATOR_CONTEXT_KEY } from '@oes/common/authorization'
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

  it('creates a private inbound scope and exchanges a different next-hop credential', async () => {
    const inbound = new Metadata(); inbound.set('authorization', 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJpbiJ9.sig'); inbound.set('x-request-id', 'request-1'); inbound.set('traceparent', '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')
    const nextHop = new Metadata(); nextHop.set('authorization', 'Bearer next-hop-token')
    const client: any = { resolveSiteMediaForPublication: jest.fn().mockReturnValue(of({ resolved: {} })) }
    const provider = { forInternalCall: jest.fn().mockResolvedValue(nextHop) }
    const context = { run: (_context: unknown, callback: () => unknown) => callback() }
    const source = { run: (_handle: unknown, callback: () => unknown) => callback() }
    const adapter = new SiteTrustedAssetGrpcAdapter({ getService: () => client } as any, provider as any, context as any, source as any)
    const request: Record<string, unknown> = {}
    request[RPC_OPERATOR_CONTEXT_KEY] = { verifiedExecutionToken: { subject: 'operator-1', principalType: 'HUMAN', tenantId: 'tenant-1', orgId: 'org-1' }, verifiedWorkloadIdentity: { spiffeId: 'spiffe://oes/site', certificateThumbprint: 'a'.repeat(43) } }
    expect(getAuthenticatedGrpcRequestContext(request)).toEqual(expect.objectContaining({ verifiedExecutionToken: expect.objectContaining({ subject: 'operator-1' }) }))
    expect(getGrpcAuthorizationBearer(inbound)).toBeDefined()
    await adapter.runWithInboundScope(request, inbound, () => adapter.resolve({ siteId: 'site-1', assetId: 'asset-1', requiredMediaKind: 'image' }))
    expect(client.resolveSiteMediaForPublication.mock.calls[0][1].get('authorization')).toEqual(['Bearer next-hop-token'])
    expect(client.resolveSiteMediaForPublication.mock.calls[0][1].get('authorization')).not.toEqual(inbound.get('authorization'))
    expect(() => adapter.runWithInboundScope({}, inbound, () => adapter.resolve({ siteId: 'site-1', assetId: 'asset-1', requiredMediaKind: 'image' }))).toThrow('SITE_INBOUND_EXECUTION_CONTEXT_REQUIRED')
  })
})
