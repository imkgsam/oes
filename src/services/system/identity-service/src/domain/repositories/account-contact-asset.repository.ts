import { AccountContactAssetEntity } from '../entities/account-contact-asset.entity'

// AccountContactAssetRepository defines storage operations for identity-owned account contact assets.
export interface AccountContactAssetRepository {
  findById(assetId: string): Promise<AccountContactAssetEntity | null>
  listByIds(assetIds: string[]): Promise<AccountContactAssetEntity[]>
  findCurrentByTenantAndTypeAndValue(
    tenantId: string,
    type: string,
    value: string
  ): Promise<AccountContactAssetEntity | null>
  listByAccountIdAndType(
    accountId: string,
    type: string,
    scope?: {
      tenantId?: string
    }
  ): Promise<AccountContactAssetEntity[]>
  listByAccountContactAssetFilter(input: {
    tenantId: string
    accountId: string
    employeeId?: string | null
    types?: string[]
    statuses?: string[]
    ownership?: string[]
  }): Promise<AccountContactAssetEntity[]>
  assign(input: {
    tenantId: string
    accountId: string
    type: string
    value: string
    isPrimary: boolean
    assignedBy: string
  }): Promise<AccountContactAssetEntity>
  revoke(assetId: string, revokedBy: string): Promise<AccountContactAssetEntity>
  setStatus(assetId: string, status: string): Promise<AccountContactAssetEntity>
  setPrimary(assetId: string): Promise<AccountContactAssetEntity>
}
