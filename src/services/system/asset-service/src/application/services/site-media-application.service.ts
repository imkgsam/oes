import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdtemp, rm, open } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

  /** uploadSiteMedia validates the ordered stream and persists a repository-generated asset identity under verified tenant scope. */
  async uploadSiteMedia(stream: Observable<UploadFrame>, authority: SiteMediaExecutionAuthority): Promise<object> {
    const scope = this.requireAuthority(authority)
    const upload = await writeUploadToTemp(stream)
    const { start, filePath, size, checksum } = upload
    if (!start?.idempotencyKey || !start.siteId || !start.requestedMediaKind || !start.declaredContentType) {
      await rm(upload.directory, { recursive: true, force: true }); throw new Error('ASSET_MEDIA_VALIDATION_FAILED')
    }
    try {
    const facts = await inspectMediaFile(filePath, start.declaredContentType, start.requestedMediaKind, checksum, size)
    const requestHash = createHash('sha256').update(JSON.stringify({ siteId: start.siteId, mediaKind: start.requestedMediaKind, contentType: start.declaredContentType, checksum: facts.checksum })).digest('hex')
    const existing = await this.repository.findSiteMediaByUploadIdentity({ tenantId: scope.tenantId, siteId: start.siteId, idempotencyKey: start.idempotencyKey })
    if (existing) {
      if (existing.requestHash !== requestHash) throw new Error('ASSET_IDEMPOTENCY_CONFLICT')
      if (existing.lifecycleStatus === 'UPLOADING') throw new Error('ASSET_UPLOAD_IN_PROGRESS')
      await rm(upload.directory, { recursive: true, force: true }); return { asset: this.summary(existing), checksum: existing.checksum }
    }
    const assetId = randomUUID()
    const storageKey = `site-media/${assetId}/${facts.checksum}`
      const winner = await this.repository.reserveSiteMediaAsset({ assetId, tenantId: scope.tenantId, siteId: start.siteId, ownerSubject: scope.subject, mediaKind: start.requestedMediaKind, storageKey, checksum: facts.checksum, size: facts.size, contentType: start.declaredContentType, width: facts.width, height: facts.height, durationMs: facts.durationMs, codec: facts.codec, idempotencyKey: start.idempotencyKey, requestHash })
      if (winner.assetId !== assetId || winner.lifecycleStatus !== 'UPLOADING') { await rm(upload.directory, { recursive: true, force: true }); return { asset: this.summary(winner), checksum: winner.checksum } }
      const stored = await this.storage.put({ key: storageKey, body: createReadStream(filePath), size: facts.size, checksum: facts.checksum, contentType: start.declaredContentType })
      if (stored.checksum !== facts.checksum || stored.size !== facts.size) throw new Error('SITE_MEDIA_STORAGE_FACTS_MISMATCH')
      const asset = await this.repository.completeSiteMediaAsset({ tenantId: scope.tenantId, assetId, checksum: facts.checksum, size: facts.size })
      return { asset: this.summary(asset), checksum: stored.checksum }
    } finally { await rm(upload.directory, { recursive: true, force: true }) }
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

  /** summary converts a typed Asset projection into the generated Site Media response shape. */
  private summary(asset: SiteMediaRecord): object {
    return { assetId: asset.assetId, mediaKind: asset.mediaKind, lifecycleStatus: asset.lifecycleStatus, deliveryStatus: asset.deliveryStatus, previewUrl: asset.immutablePublicUrl ?? '', width: asset.width, height: asset.height, durationMs: asset.durationMs, availabilityVersion: asset.availabilityVersion, createdAt: asset.createdAt.toISOString() }
  }
}

/** writeUploadToTemp consumes exactly one start frame and incrementally writes bounded chunks to an isolated temp file. */
async function writeUploadToTemp(stream: Observable<UploadFrame>): Promise<{ directory: string; filePath: string; start: NonNullable<UploadFrame['start']>; checksum: string; size: number }> {
  const directory = await mkdtemp(join(tmpdir(), 'oes-site-media-'))
  const filePath = join(directory, 'media')
  const handle = await open(filePath, 'wx', 0o600)
  const digest = createHash('sha256')
  let start: UploadFrame['start']
  let size = 0
  let seenStart = false
  let failed: Error | undefined
  let writeChain = Promise.resolve()
  try {
    await new Promise<void>((resolve, reject) => {
      stream.subscribe({
        next: (frame) => {
          if (failed) return
          if (frame.start) {
            if (seenStart || frame.contentChunk?.length) { failed = new Error('ASSET_MEDIA_VALIDATION_FAILED'); reject(failed); return }
            if (!frame.start.idempotencyKey || !frame.start.siteId || !frame.start.requestedMediaKind || !frame.start.declaredContentType) { failed = new Error('ASSET_MEDIA_VALIDATION_FAILED'); reject(failed); return }
            seenStart = true; start = frame.start; return
          }
          const chunk = frame.contentChunk
          if (!seenStart || !chunk?.length) { failed = new Error('ASSET_MEDIA_VALIDATION_FAILED'); reject(failed); return }
          size += chunk.byteLength
          if (size > 512 * 1024 * 1024) { failed = new Error('ASSET_MEDIA_UPLOAD_SIZE_EXCEEDED'); reject(failed); return }
          digest.update(chunk)
          writeChain = writeChain.then(() => handle.write(chunk).then(() => undefined))
        },
        error: reject,
        complete: () => writeChain.then(resolve, reject)
      })
    })
    if (!seenStart || !start || !size) throw new Error('ASSET_MEDIA_VALIDATION_FAILED')
    return { directory, filePath, start, checksum: digest.digest('hex'), size }
  } catch (error) {
    await handle.close(); await rm(directory, { recursive: true, force: true })
    throw error
  } finally { await handle.close().catch(() => undefined) }
}

/** inspectMediaFile uses full ffprobe and ffmpeg decoding over the bounded temporary file before object upload. */
async function inspectMediaFile(filePath: string, declaredContentType: string, requestedMediaKind: string, checksum: string, size: number): Promise<{ checksum: string; size: number; width: number; height: number; durationMs: string; codec: string }> {
  const probe = await probeMedia(filePath)
  if (requestedMediaKind === 'IMAGE') {
    const codecs: Record<string, string> = { 'image/jpeg': 'mjpeg', 'image/png': 'png', 'image/webp': 'webp' }
    const expectedCodec = codecs[declaredContentType]
    if (!expectedCodec) throw new Error('ASSET_MEDIA_CONTENT_TYPE_MISMATCH')
    const video = probe.streams.find((stream) => stream.codec_type === 'video')
    if (!video || video.codec_name !== expectedCodec || !video.width || !video.height || probe.streams.some((stream) => stream.codec_type === 'audio')) throw new Error('ASSET_MEDIA_BYTES_UNSUPPORTED')
    await decodeMediaFully(filePath)
    return { checksum, size, width: video.width, height: video.height, durationMs: '0', codec: video.codec_name }
  }
  if (requestedMediaKind !== 'VIDEO' || declaredContentType !== 'video/mp4') throw new Error('ASSET_MEDIA_CONTENT_TYPE_MISMATCH')
  if (!probe.format_name.includes('mp4')) throw new Error('ASSET_MEDIA_CONTAINER_UNSUPPORTED')
  const video = probe.streams.find((stream) => stream.codec_type === 'video')
  const audio = probe.streams.find((stream) => stream.codec_type === 'audio')
  const duration = Number(video?.duration ?? probe.duration)
  if (!video || video.codec_name !== 'h264' || !audio || audio.codec_name !== 'aac' || !video.width || !video.height || !Number.isFinite(duration) || duration <= 0) throw new Error('ASSET_MEDIA_VIDEO_PROFILE_UNSUPPORTED')
  await decodeMediaFully(filePath)
  return { checksum, size, width: video.width, height: video.height, durationMs: String(Math.round(duration * 1000)), codec: 'h264/aac' }
}

type ProbeStream = { codec_type?: string; codec_name?: string; width?: number; height?: number; duration?: string }
type ProbeResult = { streams: ProbeStream[]; format_name: string; duration?: string }

/** probeMedia extracts codec facts from the bounded temporary file without retaining upload bytes in memory. */
function probeMedia(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const process = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,duration:format=format_name,duration', '-of', 'json', '-i', filePath])
    let output = ''; let errors = ''
    process.stdout.on('data', (chunk: Buffer) => { output += chunk.toString('utf8'); if (output.length > 65536) process.kill('SIGKILL') }); process.stderr.on('data', (chunk: Buffer) => { errors += chunk.toString('utf8'); if (errors.length > 65536) process.kill('SIGKILL') })
    process.once('error', () => reject(new Error('ASSET_MEDIA_PROBE_UNAVAILABLE')))
    process.once('close', (code) => {
      if (code !== 0) return reject(new Error(errors.trim() || 'ASSET_MEDIA_BYTES_UNSUPPORTED'))
      try { const parsed = JSON.parse(output) as { streams?: ProbeStream[]; format?: { format_name?: string; duration?: string } }; resolve({ streams: parsed.streams ?? [], format_name: parsed.format?.format_name ?? '', duration: parsed.format?.duration }) } catch { reject(new Error('ASSET_MEDIA_PROBE_INVALID')) }
    })
  })
}

/** decodeMediaFully sends every decoded frame to null and bounds process lifetime and diagnostics. */
function decodeMediaFully(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', ['-v', 'error', '-xerror', '-i', filePath, '-map', '0', '-f', 'null', '-'])
    let errors = ''
    const timer = setTimeout(() => process.kill('SIGKILL'), 30_000)
    process.stderr.on('data', (chunk: Buffer) => { errors += chunk.toString('utf8'); if (errors.length > 65536) process.kill('SIGKILL') })
    process.once('error', () => { clearTimeout(timer); reject(new Error('ASSET_MEDIA_DECODER_UNAVAILABLE')) })
    process.once('close', (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(errors.trim() || 'ASSET_MEDIA_BYTES_UNSUPPORTED')) })
  })
}
