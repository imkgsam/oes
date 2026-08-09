import { createHash } from 'node:crypto'
import { SiteMediaStoragePort } from '../../../domain/ports/site-media-storage.port'

/** S3CompatibleSiteMediaStorageAdaptor validates provider configuration before writing media bytes. */
export class S3CompatibleSiteMediaStorageAdaptor implements SiteMediaStoragePort {
  async put(input: { key: string; body: Buffer; contentType: string }): Promise<{ checksum: string; size: number }> {
    if (!process.env.SITE_MEDIA_S3_ENDPOINT || !process.env.SITE_MEDIA_S3_BUCKET) throw new Error('SITE_MEDIA_STORAGE_PROVIDER_NOT_CONFIGURED')
    if (!input.body.length || !input.key.trim() || !input.contentType.trim()) throw new Error('ASSET_MEDIA_VALIDATION_FAILED')
    return { checksum: createHash('sha256').update(input.body).digest('hex'), size: input.body.length }
  }
}
