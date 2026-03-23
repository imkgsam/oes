import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountCandidateEntity } from '../../../domain/entities/account-candidate.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { GetAccountsByUserIdQuery } from './get-accounts-by-user-id.query'

@QueryHandler(GetAccountsByUserIdQuery)
export class GetAccountsByUserIdHandler implements IQueryHandler<GetAccountsByUserIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository
  ) {}

  execute(query: GetAccountsByUserIdQuery): Promise<AccountCandidateEntity[]> {
    return this.accountRepository.findAvailableByUserId(query.userId)
  }
}
