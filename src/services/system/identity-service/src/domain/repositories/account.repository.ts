import { AccountCandidateEntity } from '../entities/account-candidate.entity'
import { AccountDirectoryEntity } from '../entities/account-directory.entity'
import { AccountSummaryEntity } from '../entities/account-summary.entity'

export interface AccountRepository {
  createUserAccount(input: {
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
    displayName?: string | null
  }): Promise<AccountSummaryEntity>
  findAvailableByUserId(userId: string): Promise<AccountCandidateEntity[]>
  findById(accountId: string): Promise<AccountSummaryEntity | null>
  list(input?: {
    keyword?: string
    page?: number
    pageSize?: number
    scopeLevel?: string
    status?: string
    tenantId?: string
  }): Promise<{ items: AccountDirectoryEntity[]; total: number }>
  setEnabled(accountId: string, isEnabled: boolean): Promise<AccountSummaryEntity>
  updateProfile(
    accountId: string,
    input: {
      avatarUrl?: string | null
      displayName?: string | null
      bio?: string | null
      isEnabled?: boolean
    }
  ): Promise<AccountSummaryEntity>
}
