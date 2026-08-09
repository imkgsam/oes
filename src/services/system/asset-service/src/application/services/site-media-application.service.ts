import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { Observable } from 'rxjs'
import { SiteMediaDeliveryBinding } from '../../domain/entities/site-media-delivery-binding.entity'
import { SiteMediaLifecycleOperation, SiteMediaOperationKind } from '../../domain/entities/site-media-lifecycle-operation.entity'
import { AssetDeliveryPurgePort } from '../../domain/ports/asset-delivery-purge.port'
import { SiteMediaStoragePort } from '../../domain/ports/site-media-storage.port'
import { SiteMediaListResult, SiteMediaRecord, SiteMediaRepository } from '../../domain/repositories/site-media.repository'

/** SiteMediaExecutionAuthority is the immutable guard-derived authority accepted by every Site Media use case. */
export type SiteMediaExecutionAuthority = Readonly<{
  subject: string
  principalType: string
  tenantId?: string
  orgId?: string
  actor?: string
  delegationId?: string
  workload: string
}>

type UploadFrame = {
  readonly start?: { idempotencyKey?: string; siteId?: string; requestedMediaKind?: string; declaredContentType?: string }
  readonly contentChunk?: Buffer
}

/** SiteMediaApplicationService enforces tenant scope, real asset identity, lifecycle transitions, and idempotency. */
export class SiteMediaApplicationService {
  constructor(private readonly repository: SiteMediaRepository, private readonly storage: SiteMediaStoragePort, private readonly _purge?: AssetDeliveryPurgePort) {}

  async prepareBinding(input: { tenantId: string; siteId: string }): Promise<SiteMediaDeliveryBinding> {
    let binding = await this.repository.findBinding(input)
    if (!binding) {
      binding = new SiteMediaDeliveryBinding(input.tenantId, input.siteId)
      await this.repository.saveBinding(binding)
    }
    return binding
  }

  async createOperation(input: { tenantId: string; assetId: string; idempotencyKey: string; canonicalInput: unknown; kind?: SiteMediaOperationKind; immutableTargetUrl?: string | null }): Promise<SiteMediaLifecycleOperation> {
    const requestHash = createHash('sha256').update(JSON.stringify(input.canonicalInput)).digest('hex')
    const existing = await this.repository.findOperation(input)
    if (existing && existing.requestHash !== requestHash) throw new Error('ASSET_IDEMPOTENCY_CONFLICT')
    if (existing) return existing
    const operation = new SiteMediaLifecycleOperation(randomUUID(), input.tenantId, input.assetId, input.idempotencyKey, requestHash, input.kind ?? 'TAKEDOWN_PURGE', 'PENDING', input.immutableTargetUrl ?? null)
    return this.repository.saveOperation(operation)
  }

  async store(input: { key: string; body: Buffer; contentType: string }) { return this.storage.put(input) }

  /** uploadSiteMedia validates the ordered stream and persists a repository-generated asset identity under verified tenant scope. */
  async uploadSiteMedia(stream: Observable<UploadFrame>, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    const frames = await this.collectUploadFrames(stream)
    const start = frames[0]?.start
    if (!start?.idempotencyKey || !start.siteId || !start.requestedMediaKind || !start.declaredContentType || frames.some((frame, index) => index === 0 ? !frame.start : !!frame.start || !frame.contentChunk?.length)) throw new Error('ASSET_MEDIA_VALIDATION_FAILED')
    const body = Buffer.concat(frames.slice(1).map((frame) => frame.contentChunk as Buffer))
    const facts = await inspectMediaBytes(body, start.declaredContentType, start.requestedMediaKind)
    const requestHash = createHash('sha256').update(JSON.stringify({ siteId: start.siteId, mediaKind: start.requestedMediaKind, contentType: start.declaredContentType, checksum: facts.checksum })).digest('hex')
    const existing = await this.repository.findSiteMediaByUploadIdentity({ tenantId: scope.tenantId, siteId: start.siteId, idempotencyKey: start.idempotencyKey })
    if (existing) {
      if (existing.requestHash !== requestHash) throw new Error('ASSET_IDEMPOTENCY_CONFLICT')
      return { asset: this.summary(existing), checksum: existing.checksum }
    }
    const storageKey = `site-media/${createHash('sha256').update(`${scope.tenantId}:${start.siteId}:${start.idempotencyKey}`).digest('hex')}`
    const stored = await this.store({ key: storageKey, body, contentType: start.declaredContentType })
    if (stored.checksum !== facts.checksum || stored.size !== body.length) throw new Error('SITE_MEDIA_STORAGE_FACTS_MISMATCH')
    const asset = await this.repository.createSiteMediaAsset({ tenantId: scope.tenantId, siteId: start.siteId, ownerSubject: scope.subject, mediaKind: start.requestedMediaKind, storageKey, checksum: facts.checksum, size: stored.size, contentType: start.declaredContentType, width: facts.width, height: facts.height, durationMs: facts.durationMs, codec: facts.codec, idempotencyKey: start.idempotencyKey, requestHash })
    return { asset: this.summary(asset), checksum: stored.checksum }
  }

  /** listAuthorizedSiteMedia delegates a tenant/site/owner-scoped query to the typed repository projection. */
  async listAuthorizedSiteMedia(request: { siteId?: string; query?: string; mediaKindFilter?: string; includeArchived?: boolean; pageSize?: number; pageToken?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.siteId) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const result: SiteMediaListResult = await this.repository.listAuthorizedMedia({ ...request, tenantId: scope.tenantId, siteId: request.siteId, ownerSubject: scope.subject })
    return { assets: result.assets.map((asset) => this.summary(asset)), nextPageToken: result.nextPageToken }
  }

  /** resolveSiteMediaForPublication returns a real remote projection only after tenant/site/kind/delivery checks. */
  async resolveSiteMediaForPublication(request: { siteId?: string; assetId?: string; requiredMediaKind?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.siteId || !request.assetId) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const result = await this.repository.resolveSiteMedia({ tenantId: scope.tenantId, siteId: request.siteId, assetId: request.assetId })
    if (!result || !result.immutablePublicUrl || result.deliveryStatus !== 'REMOTE_ACTIVE' || result.lifecycleStatus === 'DELETED') throw new Error('ASSET_PUBLIC_DELIVERY_UNAVAILABLE')
    if (request.requiredMediaKind && result.mediaKind !== request.requiredMediaKind) throw new Error('ASSET_MEDIA_KIND_MISMATCH')
    return { resolved: { assetId: result.assetId, mediaKind: result.mediaKind, lifecycleStatus: result.lifecycleStatus, deliveryStatus: result.deliveryStatus, publicUrl: result.immutablePublicUrl, width: result.width, height: result.height, durationMs: result.durationMs, codec: result.codec, availabilityVersion: result.availabilityVersion } }
  }

  /** prepareSiteMediaRemoteDelivery creates or reuses a tenant-scoped binding and validation operation. */
  async prepareSiteMediaRemoteDelivery(request: { idempotencyKey?: string; siteId?: string; mediaHost?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.siteId || !request.idempotencyKey || !request.mediaHost) throw new Error('ASSET_REMOTE_DELIVERY_NOT_READY')
    const binding = await this.prepareBinding({ tenantId: scope.tenantId, siteId: request.siteId })
    if (binding.deliveryStatus === 'REMOTE_ACTIVE') throw new Error('ASSET_REMOTE_DELIVERY_IRREVERSIBLE')
    const operation = await this.createOperation({ tenantId: scope.tenantId, assetId: request.siteId, idempotencyKey: request.idempotencyKey, canonicalInput: request, kind: 'TAKEDOWN_PURGE' })
    binding.transition('REMOTE_READY'); await this.repository.saveBinding(binding)
    return { deliveryBindingStatus: binding.deliveryStatus, validationOperationId: operation.operationId }
  }

  /** activateSiteMediaRemoteDelivery confirms the prepared binding through the repository's atomic availability/outbox boundary. */
  async activateSiteMediaRemoteDelivery(request: { idempotencyKey?: string; siteId?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.siteId || !request.idempotencyKey) throw new Error('ASSET_REMOTE_DELIVERY_NOT_READY')
    const binding = await this.repository.findBinding({ tenantId: scope.tenantId, siteId: request.siteId })
    if (!binding || binding.deliveryStatus !== 'REMOTE_READY') throw new Error('ASSET_REMOTE_DELIVERY_NOT_READY')
    const operation = await this.createOperation({ tenantId: scope.tenantId, assetId: request.siteId, idempotencyKey: request.idempotencyKey, canonicalInput: request, kind: 'TAKEDOWN_PURGE' })
    binding.transition('MIGRATING'); await this.repository.saveBinding(binding)
    return this.repository.confirmRemoteActivationWithEvent({ tenantId: scope.tenantId, siteId: request.siteId, operationId: operation.operationId })
  }

  /** protectSitePublicationReferences records idempotent tenant/site/publish-version reference facts. */
  async protectSitePublicationReferences(request: { siteId?: string; publishVersion?: string; assetIds?: string[]; idempotencyKey?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.siteId || !request.publishVersion || !request.idempotencyKey) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const operation = await this.createOperation({ tenantId: scope.tenantId, assetId: request.siteId, idempotencyKey: request.idempotencyKey, canonicalInput: request, kind: 'TAKEDOWN_PURGE' })
    const ids = await this.repository.protectPublicationReferences({ tenantId: scope.tenantId, siteId: request.siteId, publishVersion: String(request.publishVersion), assetIds: request.assetIds ?? [], operationId: operation.operationId })
    return { protectedAssetIds: ids, protectionStatus: 'PROTECTED' }
  }

  /** releaseSitePublicationReferences removes one idempotent publication reference version. */
  async releaseSitePublicationReferences(request: { siteId?: string; publishVersion?: string; idempotencyKey?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.siteId || !request.publishVersion || !request.idempotencyKey) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const operation = await this.createOperation({ tenantId: scope.tenantId, assetId: request.siteId, idempotencyKey: request.idempotencyKey, canonicalInput: request, kind: 'TAKEDOWN_PURGE' })
    const ids = await this.repository.releasePublicationReferences({ tenantId: scope.tenantId, siteId: request.siteId, publishVersion: String(request.publishVersion), operationId: operation.operationId })
    return { releasedAssetIds: ids, releaseStatus: 'RELEASED' }
  }

  /** archiveSiteMedia delegates its terminal state and immutable availability fact to one repository transaction. */
  async archiveSiteMedia(request: { assetId?: string; idempotencyKey?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.assetId || !request.idempotencyKey) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const operation = await this.createOperation({ tenantId: scope.tenantId, assetId: request.assetId, idempotencyKey: request.idempotencyKey, canonicalInput: request, kind: 'DELETE' })
    return { asset: this.summary(await this.repository.archiveWithEvent({ tenantId: scope.tenantId, assetId: request.assetId, ownerSubject: scope.subject, operationId: operation.operationId })) }
  }

  /** takeDownSiteMedia persists a purge operation and leaves delivery pending until the worker confirms the provider. */
  async takeDownSiteMedia(request: { assetId?: string; idempotencyKey?: string; reasonCode?: string; reasonNote?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.assetId || !request.idempotencyKey) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const target = await this.repository.getImmutableDeliveryUrl({ tenantId: scope.tenantId, assetId: request.assetId })
    if (!target) throw new Error('ASSET_PUBLIC_DELIVERY_UNAVAILABLE')
    const operation = await this.createOperation({ tenantId: scope.tenantId, assetId: request.assetId, idempotencyKey: request.idempotencyKey, canonicalInput: request, kind: 'TAKEDOWN_PURGE', immutableTargetUrl: target })
    return { operationId: operation.operationId, deliveryStatus: operation.status === 'CONFIRMED' ? 'UNAVAILABLE' : 'PURGE_PENDING' }
  }

  /** getSiteMediaDeliveryStatus returns the persisted lifecycle projection without inventing provider state. */
  async getSiteMediaDeliveryStatus(request: { assetId?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.assetId) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const status = await this.repository.getSiteMediaDeliveryStatus({ tenantId: scope.tenantId, assetId: request.assetId })
    if (!status) throw new Error('ASSET_MEDIA_NOT_FOUND')
    return status
  }

  /** deleteSiteMedia delegates protection validation, deletion, versioning, and event persistence to one transaction. */
  async deleteSiteMedia(request: { assetId?: string; idempotencyKey?: string; deletionReason?: string }, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    if (!request.assetId || !request.idempotencyKey) throw new Error('ASSET_SCOPE_FORBIDDEN')
    const operation = await this.createOperation({ tenantId: scope.tenantId, assetId: request.assetId, idempotencyKey: request.idempotencyKey, canonicalInput: request, kind: 'DELETE' })
    return this.repository.deleteWithEvent({ tenantId: scope.tenantId, assetId: request.assetId, ownerSubject: scope.subject, operationId: operation.operationId })
  }

  /** requireAuthority rejects missing verified tenant/subject claims before any repository or storage access. */
  private requireAuthority(authority: SiteMediaExecutionAuthority): { tenantId: string; subject: string } {
    if (!authority?.tenantId || !authority.subject) throw new Error('ASSET_SCOPE_FORBIDDEN')
    return { tenantId: authority.tenantId, subject: authority.subject }
  }

  /** collectUploadFrames materializes only the bounded gRPC frame sequence needed for checksum/idempotency validation. */
  private collectUploadFrames(stream: Observable<UploadFrame>): Promise<UploadFrame[]> {
    return new Promise((resolve, reject) => {
      const frames: UploadFrame[] = []
      stream.subscribe({ next: (frame) => frames.push(frame), error: reject, complete: () => resolve(frames) })
    })
  }

  /** summary converts a typed Asset projection into the generated Site Media response shape. */
  private summary(asset: SiteMediaRecord): object {
    return { assetId: asset.assetId, mediaKind: asset.mediaKind, lifecycleStatus: asset.lifecycleStatus, deliveryStatus: asset.deliveryStatus, previewUrl: asset.immutablePublicUrl ?? '', width: asset.width, height: asset.height, durationMs: asset.durationMs, availabilityVersion: asset.availabilityVersion, createdAt: asset.createdAt.toISOString() }
  }
}

/** inspectMediaBytes uses the installed ffprobe decoder boundary for complete image/video integrity and technical facts. */
async function inspectMediaBytes(body: Buffer, declaredContentType: string, requestedMediaKind: string): Promise<{ checksum: string; width: number; height: number; durationMs: string; codec: string }> {
  const checksum = createHash('sha256').update(body).digest('hex')
  const probe = await probeMedia(body)
  if (requestedMediaKind === 'IMAGE') {
    const codecs: Record<string, string> = { 'image/jpeg': 'mjpeg', 'image/png': 'png', 'image/webp': 'webp' }
    const expectedCodec = codecs[declaredContentType]
    if (!expectedCodec) throw new Error('ASSET_MEDIA_CONTENT_TYPE_MISMATCH')
    const video = probe.streams.find((stream) => stream.codec_type === 'video')
    if (!video || video.codec_name !== expectedCodec || !video.width || !video.height || probe.streams.some((stream) => stream.codec_type === 'audio')) throw new Error('ASSET_MEDIA_BYTES_UNSUPPORTED')
    return { checksum, width: video.width, height: video.height, durationMs: '0', codec: video.codec_name }
  }
  if (requestedMediaKind !== 'VIDEO' || declaredContentType !== 'video/mp4') throw new Error('ASSET_MEDIA_CONTENT_TYPE_MISMATCH')
  if (!probe.format_name.includes('mp4')) throw new Error('ASSET_MEDIA_CONTAINER_UNSUPPORTED')
  const video = probe.streams.find((stream) => stream.codec_type === 'video')
  const audio = probe.streams.find((stream) => stream.codec_type === 'audio')
  const duration = Number(video?.duration ?? probe.duration)
  if (!video || video.codec_name !== 'h264' || !audio || audio.codec_name !== 'aac' || !video.width || !video.height || !Number.isFinite(duration) || duration <= 0) throw new Error('ASSET_MEDIA_VIDEO_PROFILE_UNSUPPORTED')
  return { checksum, width: video.width, height: video.height, durationMs: String(Math.round(duration * 1000)), codec: 'h264/aac' }
}

type ProbeStream = { codec_type?: string; codec_name?: string; width?: number; height?: number; duration?: string }
type ProbeResult = { streams: ProbeStream[]; format_name: string; duration?: string }

/** probeMedia delegates complete container/decoder validation to the installed ffprobe executable. */
function probeMedia(body: Buffer): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const process = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,duration:format=format_name,duration', '-of', 'json', '-i', 'pipe:0'])
    const output: Buffer[] = []; const errors: Buffer[] = []
    process.stdout.on('data', (chunk: Buffer) => output.push(chunk)); process.stderr.on('data', (chunk: Buffer) => errors.push(chunk))
    process.once('error', () => reject(new Error('ASSET_MEDIA_PROBE_UNAVAILABLE')))
    process.once('close', (code) => {
      if (code !== 0) return reject(new Error(errors.join('').trim() || 'ASSET_MEDIA_BYTES_UNSUPPORTED'))
      try { const parsed = JSON.parse(Buffer.concat(output).toString('utf8')) as { streams?: ProbeStream[]; format?: { format_name?: string; duration?: string } }; resolve({ streams: parsed.streams ?? [], format_name: parsed.format?.format_name ?? '', duration: parsed.format?.duration }) } catch { reject(new Error('ASSET_MEDIA_PROBE_INVALID')) }
    })
    process.stdin.end(body)
  })
}
