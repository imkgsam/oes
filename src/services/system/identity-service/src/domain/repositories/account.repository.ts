import { AccountCandidateEntity } from '../entities/account-candidate.entity'
import { AccountDirectoryEntity } from '../entities/account-directory.entity'
import { AccountSummaryEntity } from '../entities/account-summary.entity'

export interface AccountRepository {
  getDeletionImpact(accountId: string): Promise<{
    account: AccountSummaryEntity | null
    contactAssetCount: number
    blockingReasons: Array<{
      resourceType: string
      resourceCount: number
      message: string
    }>
  }>
  createUserAccount(input: {
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
    displayName?: string | null
  }): Promise<AccountSummaryEntity>
  delete(accountId: string): Promise<{
    deletedContactAssetCount: number
  }>
  findAvailableByUserId(userId: string): Promise<AccountCandidateEntity[]>
  findById(accountId: string): Promise<AccountSummaryEntity | null>
  findByUserScope(input: {
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }): Promise<AccountSummaryEntity | null>
  list(input?: {
    keyword?: string
    page?: number
    pageSize?: number
    scopeLevel?: string
    status?: string
    tenantId?: string
  }): Promise<{ items: AccountDirectoryEntity[]; total: number }>
  countByTenantIds(input: {
    tenantIds: string[]
    scopeLevel?: string
    status?: string
  }): Promise<Array<{ tenantId: string; total: number }>>
  setEnabled(accountId: string, isEnabled: boolean): Promise<AccountSummaryEntity>
  updateProfile(
    accountId: string,
    input: {
      avatarAssetId?: string | null
      displayName?: string | null
      bio?: string | null
      isEnabled?: boolean
    }
  ): Promise<AccountSummaryEntity>
}
