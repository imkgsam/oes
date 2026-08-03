import { ResolveAssetPublicUrlHandler } from '../../src/application/queries/avatar/resolve-asset-public-url.handler'
import { ResolveAssetPublicUrlQuery } from '../../src/application/queries/avatar/resolve-asset-public-url.query'

/** Verifies URL projection is constrained by Asset-owned scope and tenant facts. */
describe('ResolveAssetPublicUrlHandler trusted scope', () => {
  const tenantAsset = {
    id: 'asset-1',
    scopeLevel: 'TENANT',
    tenantId: 'tenant-1',
    publicUrl: 'https://assets/1',
    status: 'ACTIVE'
  }

  it('returns only an asset inside the trusted tenant scope', async () => {
    const handler = new ResolveAssetPublicUrlHandler({
      findById: jest.fn().mockResolvedValue(tenantAsset)
    } as never)

    await expect(
      handler.execute(new ResolveAssetPublicUrlQuery('asset-1', 'TENANT', 'tenant-1'))
    ).resolves.toEqual({ assetId: 'asset-1', publicUrl: 'https://assets/1', status: 'ACTIVE' })
  })

  it.each([
    ['another tenant', new ResolveAssetPublicUrlQuery('asset-1', 'TENANT', 'tenant-2')],
    ['system context', new ResolveAssetPublicUrlQuery('asset-1', 'SYSTEM')]
  ])('rejects %s before exposing the URL', async (_label, query) => {
    const handler = new ResolveAssetPublicUrlHandler({
      findById: jest.fn().mockResolvedValue(tenantAsset)
    } as never)

    await expect(handler.execute(query)).rejects.toThrow('Request validation failed')
  })
})
