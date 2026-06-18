import { AssetCategory, AssetEntity, AssetScopeLevel, AssetStatus } from '../entities/asset.entity'

export interface CreateAssetRecordInput {
  scopeLevel: AssetScopeLevel
  tenantId?: string
  ownerAccountId?: null | string
  ownerEmployeeId?: null | string
  category: AssetCategory
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

export interface ActivateEmployeeOfficialPhotoInput {
  tenantId: string
  employeeId: string
  newAssetId: string
  previousAssetId?: string
  updatedBy: string
}

export interface ActivateEmployeeOfficialPhotoResult {
  activeAsset: AssetEntity
  replacedAssetId: null | string
}

export interface AssetOwnershipInput {
  scopeLevel: AssetScopeLevel
  tenantId?: string
}

// AssetRepository defines the persistence operations needed by the avatar asset write and query paths.
export interface AssetRepository {
  activateEmployeeOfficialPhoto(input: ActivateEmployeeOfficialPhotoInput): Promise<ActivateEmployeeOfficialPhotoResult>
  create(input: CreateAssetRecordInput): Promise<AssetEntity>
  findById(assetId: string): Promise<AssetEntity | null>
  findActiveAvatarByAccountId(accountId: string, scopeLevel: AssetScopeLevel, tenantId?: string): Promise<AssetEntity | null>
  findActiveEmployeeOfficialPhotoByEmployeeId(
    employeeId: string,
    scopeLevel: AssetScopeLevel,
    tenantId: string
  ): Promise<AssetEntity | null>
  updateStatus(input: UpdateAssetStatusInput): Promise<AssetEntity>
}
