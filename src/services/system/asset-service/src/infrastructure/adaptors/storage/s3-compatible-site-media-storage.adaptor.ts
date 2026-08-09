import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import { SiteMediaStoragePort } from '../../../domain/ports/site-media-storage.port'

/** S3CompatibleSiteMediaStorageAdaptor writes bounded media bytes to the configured S3-compatible bucket. */
export class S3CompatibleSiteMediaStorageAdaptor implements SiteMediaStoragePort {
  private readonly client: S3Client

  constructor(client?: S3Client) {
    const endpoint = process.env.SITE_MEDIA_S3_ENDPOINT?.trim()
    this.client = client ?? new S3Client({
      endpoint,
      region: process.env.SITE_MEDIA_S3_REGION?.trim() || 'auto',
      forcePathStyle: true,
      credentials: process.env.SITE_MEDIA_S3_ACCESS_KEY_ID && process.env.SITE_MEDIA_S3_SECRET_ACCESS_KEY
        ? { accessKeyId: process.env.SITE_MEDIA_S3_ACCESS_KEY_ID, secretAccessKey: process.env.SITE_MEDIA_S3_SECRET_ACCESS_KEY }
        : undefined
    })
  }

  async put(input: { key: string; body: AsyncIterable<Uint8Array>; size: number; checksum: string; contentType: string }): Promise<{ checksum: string; size: number }> {
    const endpoint = process.env.SITE_MEDIA_S3_ENDPOINT?.trim()
    const bucket = process.env.SITE_MEDIA_S3_BUCKET?.trim()
    if (!endpoint || !bucket) throw new Error('SITE_MEDIA_STORAGE_PROVIDER_NOT_CONFIGURED')
    if (!input.size || !/^[0-9a-f]{64}$/u.test(input.checksum) || !input.key.trim() || !input.contentType.trim()) throw new Error('ASSET_MEDIA_VALIDATION_FAILED')
    const checksumBase64 = Buffer.from(input.checksum, 'hex').toString('base64')
    const body = input.body instanceof Readable ? input.body : Readable.from(input.body)
    const result = await this.client.send(new PutObjectCommand({ Bucket: bucket, Key: input.key, Body: body, ContentType: input.contentType, ContentLength: input.size, ChecksumSHA256: checksumBase64 }))
    if (result.ChecksumSHA256 && result.ChecksumSHA256 !== checksumBase64) throw new Error('SITE_MEDIA_STORAGE_CHECKSUM_MISMATCH')
    return { checksum: input.checksum, size: input.size }
  }
}
