import { createHash } from 'node:crypto'
import { of } from 'rxjs'
import { SiteMediaApplicationService, SiteMediaExecutionAuthority } from '../../src/application/services/site-media-application.service'
import { SiteMediaRepository, SiteMediaRecord } from '../../src/domain/repositories/site-media.repository'

/** Verifies Site Media use cases consume only guard-derived authority and typed persistence seams. */
describe('SiteMediaApplicationService', () => {
  const authority: SiteMediaExecutionAuthority = { subject: 'operator-1', principalType: 'HUMAN', tenantId: 'tenant-1', workload: 'spiffe://oes/asset' }
  const record = (overrides: Partial<SiteMediaRecord> = {}): SiteMediaRecord => ({
    assetId: 'asset-real-1', tenantId: 'tenant-1', siteId: 'site-1', ownerSubject: 'operator-1', mediaKind: 'IMAGE', lifecycleStatus: 'ACTIVE', deliveryStatus: 'LOCAL_ONLY', storageKey: 'site-media/key', immutablePublicUrl: null, checksum: 'checksum', requestHash: 'request-hash', size: 4, contentType: 'image/png', availabilityVersion: '1', protectedReferenceCount: 0, createdAt: new Date('2026-08-09T00:00:00.000Z'), ...overrides
  })

  function repository(overrides: Partial<Record<keyof SiteMediaRepository, unknown>> = {}): SiteMediaRepository {
    return {
      findSiteMediaByUploadIdentity: jest.fn().mockResolvedValue(null),
      createSiteMediaAsset: jest.fn().mockResolvedValue(record()),
      listAuthorizedMedia: jest.fn().mockResolvedValue({ assets: [record()], nextPageToken: '' }),
      resolveSiteMedia: jest.fn().mockResolvedValue(record({ deliveryStatus: 'REMOTE_ACTIVE', immutablePublicUrl: 'https://media.example/site-media/key' })),
      protectPublicationReferences: jest.fn().mockResolvedValue(['asset-real-1']),
      releasePublicationReferences: jest.fn().mockResolvedValue(['asset-real-1']),
      archiveSiteMedia: jest.fn().mockResolvedValue(record({ lifecycleStatus: 'ARCHIVED' })),
      getImmutableDeliveryUrl: jest.fn().mockResolvedValue('https://media.example/site-media/key'),
      getSiteMediaDeliveryStatus: jest.fn().mockResolvedValue({ assetId: 'asset-real-1', lifecycleStatus: 'ACTIVE', deliveryStatus: 'LOCAL_ONLY', availabilityVersion: '1', lastOperationId: '' }),
      deleteSiteMedia: jest.fn().mockResolvedValue({ operationId: 'operation-1', deletionStatus: 'DELETED' }),
      findBinding: jest.fn().mockResolvedValue(null),
      saveBinding: jest.fn().mockResolvedValue(undefined),
      findOperation: jest.fn().mockResolvedValue(null),
      saveOperation: jest.fn().mockResolvedValue(undefined),
      claimDuePurgeOperations: jest.fn().mockResolvedValue([]),
      acknowledgePurge: jest.fn().mockResolvedValue(undefined),
      schedulePurgeRetry: jest.fn().mockResolvedValue(undefined),
      ...overrides
    } as SiteMediaRepository
  }

  it('uploads under authority tenant and uses repository-generated asset identity', async () => {
    const repo = repository({ createSiteMediaAsset: jest.fn().mockResolvedValue(record({ assetId: 'asset-generated' })) })
    const storage = { put: jest.fn().mockResolvedValue({ checksum: 'checksum', size: 4 }) }
    const service = new SiteMediaApplicationService(repo, storage)
    const stream = of({ start: { idempotencyKey: 'upload-1', siteId: 'site-1', requestedMediaKind: 'IMAGE', declaredContentType: 'image/png' } }, { contentChunk: Buffer.from('data') })

    const result = await service.uploadSiteMedia(stream, authority)

    expect(repo.createSiteMediaAsset).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', siteId: 'site-1', ownerSubject: 'operator-1', idempotencyKey: 'upload-1' }))
    expect(result).toEqual(expect.objectContaining({ asset: expect.objectContaining({ assetId: 'asset-generated' }) }))
    expect((result as { asset: { assetId: string } }).asset.assetId).not.toBe('site-1')
  })

  it('rejects upload before reading frames when verified tenant authority is absent', async () => {
    const repo = repository()
    const storage = { put: jest.fn() }
    const service = new SiteMediaApplicationService(repo, storage)

    await expect(service.uploadSiteMedia(of({ start: { idempotencyKey: 'upload-1', siteId: 'site-1' } }), { subject: 'operator-1', principalType: 'HUMAN', workload: 'spiffe://oes/asset' })).rejects.toThrow('ASSET_SCOPE_FORBIDDEN')
    expect(storage.put).not.toHaveBeenCalled()
    expect(repo.createSiteMediaAsset).not.toHaveBeenCalled()
  })

  it('rejects upload when the verified subject is missing even if tenant is present', async () => {
    const repo = repository()
    const service = new SiteMediaApplicationService(repo, { put: jest.fn() })
    await expect(service.uploadSiteMedia(of({ start: { idempotencyKey: 'upload-1', siteId: 'site-1' } }), { subject: '', principalType: 'HUMAN', tenantId: 'tenant-1', workload: 'spiffe://oes/asset' })).rejects.toThrow('ASSET_SCOPE_FORBIDDEN')
  })

  it('uses typed list/resolve/protect/release repository calls with authority scope', async () => {
    const repo = repository()
    const service = new SiteMediaApplicationService(repo, { put: jest.fn() })

    await service.listAuthorizedSiteMedia({ siteId: 'site-1' }, authority)
    await service.resolveSiteMediaForPublication({ siteId: 'site-1', assetId: 'asset-real-1', requiredMediaKind: 'IMAGE' }, authority)
    await service.protectSitePublicationReferences({ siteId: 'site-1', publishVersion: '7', assetIds: ['asset-real-1'], idempotencyKey: 'protect-1' }, authority)
    await service.releaseSitePublicationReferences({ siteId: 'site-1', publishVersion: '7', idempotencyKey: 'release-1' }, authority)

    expect(repo.listAuthorizedMedia).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', siteId: 'site-1', ownerSubject: 'operator-1' }))
    expect(repo.resolveSiteMedia).toHaveBeenCalledWith({ tenantId: 'tenant-1', siteId: 'site-1', assetId: 'asset-real-1' })
    expect(repo.protectPublicationReferences).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', publishVersion: '7' }))
    expect(repo.releasePublicationReferences).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', publishVersion: '7' }))
  })

  it('reuses upload idempotency record without storing a second object', async () => {
    const checksum = createHash('sha256').update(Buffer.from('data')).digest('hex')
    const requestHash = createHash('sha256').update(JSON.stringify({ siteId: 'site-1', mediaKind: 'IMAGE', contentType: 'image/png', checksum })).digest('hex')
    const existing = record({ requestHash })
    const find = jest.fn().mockResolvedValue(existing)
    const repo = repository({ findSiteMediaByUploadIdentity: find })
    const storage = { put: jest.fn() }
    const service = new SiteMediaApplicationService(repo, storage)
    const stream = of({ start: { idempotencyKey: 'upload-1', siteId: 'site-1', requestedMediaKind: 'IMAGE', declaredContentType: 'image/png' } }, { contentChunk: Buffer.from('data') })

    await expect(service.uploadSiteMedia(stream, authority)).resolves.toEqual(expect.objectContaining({ asset: expect.objectContaining({ assetId: 'asset-real-1' }) }))
    expect(storage.put).not.toHaveBeenCalled()
  })

  it('keeps takedown PURGE_PENDING until the worker confirms precise purge', async () => {
    const repo = repository()
    const service = new SiteMediaApplicationService(repo, { put: jest.fn() }, { purge: jest.fn() })

    await expect(service.takeDownSiteMedia({ assetId: 'asset-real-1', idempotencyKey: 'take-1' }, authority)).resolves.toEqual({ operationId: expect.any(String), deliveryStatus: 'PURGE_PENDING' })
    expect(repo.saveOperation).toHaveBeenCalledWith(expect.objectContaining({ immutableTargetUrl: 'https://media.example/site-media/key' }))
  })
})
