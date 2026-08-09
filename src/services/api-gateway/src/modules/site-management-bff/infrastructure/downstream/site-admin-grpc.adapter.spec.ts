import { of } from 'rxjs'
import { SiteAdminGrpcAdapter } from './site-admin-grpc.adapter'

/** Verifies Admin requests contain business fields only and use trusted target metadata. */
describe('SiteAdminGrpcAdapter', () => {
  it('uses trusted producer metadata and strips identity fields from list/create', async () => {
    const service: any = { listSiteCards: jest.fn().mockReturnValue(of({ cards: [] })), createSite: jest.fn().mockReturnValue(of({ siteId: 's-1' })) }
    const producer: any = { forBusinessCall: jest.fn().mockResolvedValue({}) }
    const adapter = new SiteAdminGrpcAdapter({ getService: () => service } as any, producer)
    adapter.onModuleInit()
    const source: any = { requestId: 'r-1', traceId: 't-1', user: { holderId: 'op-1', tenantId: 'tenant-1' } }
    await adapter.listSiteCards({ tenantId: 'tenant-1', operatorId: 'op-1' } as any, source)
    await adapter.createSite({ tenantId: 'tenant-1', operatorId: 'op-1', siteName: 'Site', siteType: 'brand', defaultLocale: 'en-US' } as any, source)
    expect(producer.forBusinessCall).toHaveBeenNthCalledWith(
      1,
      source,
      'urn:oes:service:site-service',
      ['site.management.read']
    )
    expect(producer.forBusinessCall).toHaveBeenNthCalledWith(
      2,
      source,
      'urn:oes:service:site-service',
      ['site.management.manage']
    )
    expect(service.listSiteCards).toHaveBeenCalledWith({}, expect.anything())
    expect(service.createSite).toHaveBeenCalledWith(expect.objectContaining({ siteName: 'Site' }), expect.anything())
    expect(service.createSite.mock.calls[0][0]).not.toEqual(expect.objectContaining({ tenantId: expect.anything(), operatorId: expect.anything(), traceId: expect.anything(), orgId: expect.anything(), requestId: expect.anything() }))
  })
})
