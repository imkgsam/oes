import { AssetScopeLevel } from '../entities/asset.entity'

export interface PutObjectInput {
  body: Buffer
  contentType: string
  fileName: string
  ownerAccountId: string
  scopeLevel: AssetScopeLevel
  tenantId?: string
}

export interface PutObjectResult {
  storageKey: string
  publicUrl: string
}

// ObjectStoragePort isolates asset-service from concrete S3-compatible providers.
export interface ObjectStoragePort {
  putObject(input: PutObjectInput): Promise<PutObjectResult>
  deleteObject(storageKey: string): Promise<void>
}
