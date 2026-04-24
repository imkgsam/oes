import { AssetEntity, AssetScopeLevel, AssetStatus } from '../entities/asset.entity'

export interface CreateAssetRecordInput {
  scopeLevel: AssetScopeLevel
  tenantId?: string
  ownerAccountId: string
  category: 'ACCOUNT_AVATAR'
  storageKey: string
  mimeType: string
  size: bigint
  checksum: string
  publicUrl: string
  status: AssetStatus
  createdBy: string
}

export interface UpdateAssetStatusInput {
  assetId: string
  status: AssetStatus
  updatedBy: string
}

export interface AssetOwnershipInput {
  scopeLevel: AssetScopeLevel
  tenantId?: string
}

// AssetRepository defines the persistence operations needed by the avatar asset write and query paths.
export interface AssetRepository {
  create(input: CreateAssetRecordInput): Promise<AssetEntity>
  findById(assetId: string): Promise<AssetEntity | null>
  findActiveAvatarByAccountId(accountId: string, scopeLevel: AssetScopeLevel, tenantId?: string): Promise<AssetEntity | null>
  updateStatus(input: UpdateAssetStatusInput): Promise<AssetEntity>
}
