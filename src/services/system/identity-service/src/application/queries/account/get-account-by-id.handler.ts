import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { GetAccountByIdQuery } from './get-account-by-id.query'

@QueryHandler(GetAccountByIdQuery)
export class GetAccountByIdHandler
  implements IQueryHandler<GetAccountByIdQuery, AccountSummaryEntity | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository
  ) {}

  async execute(query: GetAccountByIdQuery): Promise<AccountSummaryEntity | null> {
    return this.accountRepository.findById(query.accountId)
  }
}
