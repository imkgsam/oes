import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CheckResourceService } from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountSummaryView } from './account-query.result'
import { GetAccountByIdQuery } from './get-account-by-id.query'

@QueryHandler(GetAccountByIdQuery)
export class GetAccountByIdHandler
  implements IQueryHandler<GetAccountByIdQuery, AccountSummaryView | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(query: GetAccountByIdQuery): Promise<AccountSummaryView | null> {
    const account = await this.accountRepository.findById(query.accountId)
    if (!account) {
      return null
    }

    this.checkResourceService.checkAccount(query.operatorScope, {
      resourceId: account.id,
      tenantId: account.tenantId
    })

    return toAccountSummaryView(account)
  }
}

function toAccountSummaryView(account: AccountSummaryEntity): AccountSummaryView {
  return {
    id: account.id,
    userId: account.userId,
    tenantId: account.tenantId,
    scopeLevel: account.scopeLevel,
    displayName: account.displayName,
    isEnabled: account.isEnabled
  }
}
