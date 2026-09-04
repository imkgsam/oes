import { createHash } from 'node:crypto'
import { of } from 'rxjs'
import { SiteMediaApplicationService, SiteMediaExecutionAuthority } from '../application/services/site-media-application.service'
import { SiteMediaLifecycleOperation } from '../domain/entities/site-media-lifecycle-operation.entity'
import { SiteMediaRepository, SiteMediaRecord } from '../domain/repositories/site-media.repository'

/** Verifies Site Media use cases consume only guard-derived authority and typed persistence seams. */
describe('SiteMediaApplicationService', () => {
  const authority: SiteMediaExecutionAuthority = { subject: 'operator-1', principalType: 'HUMAN', tenantId: 'tenant-1', workload: 'spiffe://oes/asset' }
  const mediaBody = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  const otherMediaBody = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JzN0AAAAASUVORK5CYII=', 'base64')
  const record = (overrides: Partial<SiteMediaRecord> = {}): SiteMediaRecord => ({
    assetId: 'asset-real-1', tenantId: 'tenant-1', siteId: 'site-1', ownerSubject: 'operator-1', mediaKind: 'IMAGE', lifecycleStatus: 'ACTIVE', deliveryStatus: 'LOCAL_ONLY', storageKey: 'site-media/key', immutablePublicUrl: null, checksum: 'checksum', requestHash: 'request-hash', size: mediaBody.length, contentType: 'image/png', width: 1, height: 1, durationMs: '0', codec: 'png', availabilityVersion: '1', protectedReferenceCount: 0, createdAt: new Date('2026-08-09T00:00:00.000Z'), ...overrides
  })

  function repository(overrides: Partial<Record<keyof SiteMediaRepository, unknown>> = {}): SiteMediaRepository {
    return {
      findSiteMediaByUploadIdentity: jest.fn().mockResolvedValue(null),
      reserveSiteMediaAsset: jest.fn().mockImplementation(async (input) => record({ assetId: input.assetId, lifecycleStatus: 'UPLOADING', checksum: input.checksum, size: input.size, requestHash: input.requestHash, storageKey: input.storageKey })),
      completeSiteMediaAsset: jest.fn().mockImplementation(async (input) => record({ assetId: input.assetId, checksum: input.checksum, size: input.size, lifecycleStatus: 'ACTIVE' })),
      createSiteMediaAsset: jest.fn().mockResolvedValue(record()),
      listAuthorizedMedia: jest.fn().mockResolvedValue({ assets: [record()], nextPageToken: '' }),
      resolveSiteMedia: jest.fn().mockResolvedValue(record({ deliveryStatus: 'REMOTE_ACTIVE', immutablePublicUrl: 'https://media.example/site-media/key' })),
      protectPublicationReferences: jest.fn().mockResolvedValue(['asset-real-1']),
      releasePublicationReferences: jest.fn().mockResolvedValue(['asset-real-1']),
      confirmRemoteActivationWithEvent: jest.fn().mockResolvedValue({ deliveryBindingStatus: 'REMOTE_ACTIVE', migrationOperationId: 'operation-1' }),
      archiveWithEvent: jest.fn().mockResolvedValue(record({ lifecycleStatus: 'ARCHIVED' })),
      getImmutableDeliveryUrl: jest.fn().mockResolvedValue('https://media.example/site-media/key'),
      getSiteMediaDeliveryStatus: jest.fn().mockResolvedValue({ assetId: 'asset-real-1', siteId: 'site-1', lifecycleStatus: 'ACTIVE', deliveryStatus: 'LOCAL_ONLY', availabilityVersion: '1', lastOperationId: '' }),
      deleteWithEvent: jest.fn().mockResolvedValue({ operationId: 'operation-1', deletionStatus: 'DELETED' }),
      findBinding: jest.fn().mockResolvedValue(null),
      saveBinding: jest.fn().mockResolvedValue(undefined),
      findOperation: jest.fn().mockResolvedValue(null),
      saveOperation: jest.fn().mockImplementation((operation) => Promise.resolve(operation)),
      claimDuePurgeOperations: jest.fn().mockResolvedValue([]),
      confirmTakedownWithEvent: jest.fn().mockResolvedValue(undefined),
      schedulePurgeRetry: jest.fn().mockResolvedValue(undefined),
      ...overrides
    } as SiteMediaRepository
  }

  it('uploads through a checksum-bound reserved asset identity', async () => {
    const repo = repository({ completeSiteMediaAsset: jest.fn().mockImplementation(async (input) => record({ assetId: input.assetId, lifecycleStatus: 'ACTIVE' })) })
    const storage = { put: jest.fn().mockResolvedValue({ checksum: createHash('sha256').update(mediaBody).digest('hex'), size: mediaBody.length }) }
    const service = new SiteMediaApplicationService(repo, storage)
    const stream = of({ start: { idempotencyKey: 'upload-1', siteId: 'site-1', requestedMediaKind: 'IMAGE', declaredContentType: 'image/png' } }, { contentChunk: mediaBody })

    const result = await service.uploadSiteMedia(stream, authority)

    expect(repo.reserveSiteMediaAsset).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', siteId: 'site-1', ownerSubject: 'operator-1', idempotencyKey: 'upload-1', storageKey: expect.stringMatching(/^site-media\/[0-9a-f-]+\/[0-9a-f]{64}$/u) }))
    expect(result).toEqual(expect.objectContaining({ asset: expect.objectContaining({ assetId: expect.any(String) }) }))
    expect((result as { asset: { assetId: string } }).asset.assetId).not.toBe('site-1')
  })

  it('rejects upload before reading frames when verified tenant authority is absent', async () => {
    const repo = repository()
    const storage = { put: jest.fn() }
    const service = new SiteMediaApplicationService(repo, storage)

    await expect(service.uploadSiteMedia(of({ start: { idempotencyKey: 'upload-1', siteId: 'site-1' } }), { subject: 'operator-1', principalType: 'HUMAN', workload: 'spiffe://oes/asset' })).rejects.toThrow('ASSET_SCOPE_FORBIDDEN')
    expect(storage.put).not.toHaveBeenCalled()
    expect(repo.reserveSiteMediaAsset).not.toHaveBeenCalled()
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
    const checksum = createHash('sha256').update(mediaBody).digest('hex')
    const requestHash = createHash('sha256').update(JSON.stringify({ siteId: 'site-1', mediaKind: 'IMAGE', contentType: 'image/png', checksum })).digest('hex')
    const existing = record({ requestHash })
    const find = jest.fn().mockResolvedValue(existing)
    const repo = repository({ findSiteMediaByUploadIdentity: find })
    const storage = { put: jest.fn() }
    const service = new SiteMediaApplicationService(repo, storage)
    const stream = of({ start: { idempotencyKey: 'upload-1', siteId: 'site-1', requestedMediaKind: 'IMAGE', declaredContentType: 'image/png' } }, { contentChunk: mediaBody })

    await expect(service.uploadSiteMedia(stream, authority)).resolves.toEqual(expect.objectContaining({ asset: expect.objectContaining({ assetId: 'asset-real-1' }) }))
    expect(storage.put).not.toHaveBeenCalled()
  })

  it('prevents a concurrent different-body retry from overwriting the checksum-bound storage winner', async () => {
    let reserved: SiteMediaRecord | undefined
    const repo = repository({
      reserveSiteMediaAsset: jest.fn(async (input) => {
        if (reserved && reserved.requestHash !== input.requestHash) throw new Error('ASSET_IDEMPOTENCY_CONFLICT')
        return reserved ?? (reserved = record({ assetId: input.assetId, lifecycleStatus: 'UPLOADING', requestHash: input.requestHash, checksum: input.checksum, size: input.size, storageKey: input.storageKey }))
      }),
      completeSiteMediaAsset: jest.fn(async (input) => record({ assetId: input.assetId, lifecycleStatus: 'ACTIVE', checksum: input.checksum, size: input.size }))
    })
    const storage = { put: jest.fn(async (input) => ({ checksum: input.checksum, size: input.size })) }
    const service = new SiteMediaApplicationService(repo, storage)
    const start = { idempotencyKey: 'upload-race', siteId: 'site-1', requestedMediaKind: 'IMAGE', declaredContentType: 'image/png' }
    const results = await Promise.allSettled([service.uploadSiteMedia(of({ start }, { contentChunk: mediaBody }), authority), service.uploadSiteMedia(of({ start }, { contentChunk: otherMediaBody }), authority)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(storage.put).toHaveBeenCalledTimes(1)
  })

  it('keeps takedown PURGE_PENDING until the worker confirms precise purge', async () => {
    const repo = repository()
    const service = new SiteMediaApplicationService(repo, { put: jest.fn() }, { purge: jest.fn() })

    await expect(service.takeDownSiteMedia({ assetId: 'asset-real-1', idempotencyKey: 'take-1' }, authority)).resolves.toEqual({ operationId: expect.any(String), deliveryStatus: 'PURGE_PENDING' })
    expect(repo.saveOperation).toHaveBeenCalledWith(expect.objectContaining({ immutableTargetUrl: 'https://media.example/site-media/key' }))
  })

  it('returns the one persisted operation winner under concurrent idempotent commands', async () => {
    let persisted: SiteMediaLifecycleOperation | undefined
    const repo = repository({
      saveOperation: jest.fn(async (candidate: SiteMediaLifecycleOperation) => persisted ?? (persisted = candidate)),
      findOperation: jest.fn(async () => persisted ?? null)
    })
    const service = new SiteMediaApplicationService(repo, { put: jest.fn() })
    const results = await Promise.all(Array.from({ length: 8 }, () => service.createOperation({ tenantId: 'tenant-1', assetId: 'asset-real-1', idempotencyKey: 'same-key', canonicalInput: { assetId: 'asset-real-1' }, kind: 'DELETE' })))
    expect(new Set(results.map((result) => result.operationId)).size).toBe(1)
    expect(repo.saveOperation).toHaveBeenCalled()
  })
})
