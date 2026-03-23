import { AccountCandidateEntity } from '../entities/account-candidate.entity'
import { AccountSummaryEntity } from '../entities/account-summary.entity'

export interface AccountRepository {
  findAvailableByUserId(userId: string): Promise<AccountCandidateEntity[]>
  findById(accountId: string): Promise<AccountSummaryEntity | null>
}
