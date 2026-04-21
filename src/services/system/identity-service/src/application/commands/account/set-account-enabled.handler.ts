import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import { IDENTITY_ACCOUNT_NOT_FOUND, SYMBOLS } from '../../../common/constants'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { SetAccountEnabledCommand } from './set-account-enabled.command'

@CommandHandler(SetAccountEnabledCommand)
export class SetAccountEnabledHandler
  implements ICommandHandler<SetAccountEnabledCommand, AccountSummaryEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: SetAccountEnabledCommand): Promise<AccountSummaryEntity> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    if (account.tenantId) {
      this.checkResourceService.checkAccount(command.operatorScope, {
        resourceId: account.id,
        tenantId: account.tenantId
      })
    }

    return this.accountRepository.setEnabled(command.accountId, command.isEnabled)
  }
}
