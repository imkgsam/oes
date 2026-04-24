import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { ObjectStoragePort, PutObjectInput, PutObjectResult } from '../../../domain/ports/object-storage.port'

type S3CompatibleClient = Pick<S3Client, 'send'>

export interface S3CompatibleObjectStorageAdaptorOptions {
  bucket?: string
  client?: S3CompatibleClient
  endpoint?: string
  forcePathStyle?: boolean
  keyPrefix?: string
  publicBaseUrl?: string
  region?: string
}

// S3CompatibleObjectStorageAdaptor writes asset objects through a replaceable S3-compatible storage client.
@Injectable()
export class S3CompatibleObjectStorageAdaptor implements ObjectStoragePort {
  private readonly bucket: string
  private readonly client: S3CompatibleClient
  private readonly keyPrefix: string
  private readonly publicBaseUrl: string

  constructor(options: S3CompatibleObjectStorageAdaptorOptions = {}) {
    this.bucket = options.bucket || process.env.ASSET_S3_BUCKET || 'oes-assets'
    this.keyPrefix = trimSlashes(options.keyPrefix || process.env.ASSET_S3_KEY_PREFIX || 'avatar')
    this.publicBaseUrl = trimTrailingSlash(
      options.publicBaseUrl || process.env.ASSET_PUBLIC_BASE_URL || `http://localhost:9000/${this.bucket}`
    )
    this.client = options.client || this.buildClient(options)
  }

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    const storageKey = this.buildStorageKey(input)
    await this.client.send(
      new PutObjectCommand({
        Body: input.body,
        Bucket: this.bucket,
        ContentType: input.contentType,
        Key: storageKey
      })
    )

    return {
      storageKey,
      publicUrl: `${this.publicBaseUrl}/${storageKey}`
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey
      })
    )
  }

  // buildClient centralizes S3-compatible client creation so env-based MinIO and cloud storage use the same port.
  private buildClient(options: S3CompatibleObjectStorageAdaptorOptions): S3Client {
    const accessKeyId = process.env.ASSET_S3_ACCESS_KEY_ID
    const secretAccessKey = process.env.ASSET_S3_SECRET_ACCESS_KEY

    return new S3Client({
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey
            }
          : undefined,
      endpoint: options.endpoint || process.env.ASSET_S3_ENDPOINT,
      forcePathStyle:
        options.forcePathStyle ?? (process.env.ASSET_S3_FORCE_PATH_STYLE || 'true') !== 'false',
      region: options.region || process.env.ASSET_S3_REGION || 'us-east-1'
    })
  }

  // buildStorageKey creates a deterministic namespace while keeping filenames opaque and collision-resistant.
  private buildStorageKey(input: PutObjectInput): string {
    if (input.scopeLevel === 'SYSTEM') {
      return [
        this.keyPrefix,
        'system',
        sanitizePathSegment(input.ownerAccountId),
        `${randomUUID()}.${extensionFor(input.contentType)}`
      ].join('/')
    }

    return [
      this.keyPrefix,
      'tenant',
      sanitizePathSegment(input.tenantId || ''),
      sanitizePathSegment(input.ownerAccountId),
      `${randomUUID()}.${extensionFor(input.contentType)}`
    ].join('/')
  }
}

// extensionFor maps accepted image MIME types to safe object key suffixes.
function extensionFor(contentType: string): string {
  if (contentType === 'image/png') {
    return 'png'
  }

  if (contentType === 'image/webp') {
    return 'webp'
  }

  return 'jpg'
}

// sanitizePathSegment prevents tenant/account ids from escaping the intended object-key namespace.
function sanitizePathSegment(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
}

// trimSlashes normalizes optional key prefixes without changing their logical namespace.
function trimSlashes(value: string): string {
  return value.replaceAll(/^\/+|\/+$/g, '')
}

// trimTrailingSlash ensures public URL concatenation produces one separator between base and key.
function trimTrailingSlash(value: string): string {
  return value.replaceAll(/\/+$/g, '')
}
