import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountCandidateEntity } from '../../../domain/entities/account-candidate.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountCandidateView } from './account-query.result'
import { GetAccountsByUserIdQuery } from './get-accounts-by-user-id.query'

@QueryHandler(GetAccountsByUserIdQuery)
export class GetAccountsByUserIdHandler
  implements IQueryHandler<GetAccountsByUserIdQuery, AccountCandidateView[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository
  ) {}

  async execute(query: GetAccountsByUserIdQuery): Promise<AccountCandidateView[]> {
    const accounts = await this.accountRepository.findAvailableByUserId(query.userId)
    return accounts.map(toAccountCandidateView)
  }
}

function toAccountCandidateView(account: AccountCandidateEntity): AccountCandidateView {
  return {
    accountId: account.accountId,
    tenantId: account.tenantId,
    scopeLevel: account.scopeLevel,
    displayName: account.displayName,
    isEnabled: account.isEnabled
  }
}
