import { AccountContactAssetEntity } from '../entities/account-contact-asset.entity'

export interface AccountContactAssetRepository {
  findById(assetId: string): Promise<AccountContactAssetEntity | null>
  findCurrentByTenantAndTypeAndValue(
    tenantId: string,
    type: string,
    value: string
  ): Promise<AccountContactAssetEntity | null>
  listByAccountIdAndType(accountId: string, type: string): Promise<AccountContactAssetEntity[]>
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
