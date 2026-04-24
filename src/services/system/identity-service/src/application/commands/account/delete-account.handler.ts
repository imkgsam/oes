import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  IDENTITY_ACCOUNT_DELETE_BLOCKED,
  IDENTITY_ACCOUNT_NOT_FOUND,
  SYMBOLS
} from '../../../common/constants'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountDeletionBlockerService } from '../../services/account-deletion-blocker.service'
import { DeleteAccountCommand } from './delete-account.command'

export interface DeleteAccountResult {
  accountId: string
  deletedOrgMembershipCount: number
  deletedContactAssetCount: number
  userRetained: true
}

@CommandHandler(DeleteAccountCommand)
// Permanently deletes one account record after scope validation while retaining the backing user.
export class DeleteAccountHandler
  implements ICommandHandler<DeleteAccountCommand, DeleteAccountResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    private readonly accountDeletionBlockerService: AccountDeletionBlockerService,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: DeleteAccountCommand): Promise<DeleteAccountResult> {
    const impact = await this.accountRepository.getDeletionImpact(command.accountId)
    if (!impact.account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    if (impact.account.tenantId) {
      this.checkResourceService.checkAccount(command.operatorScope, {
        resourceId: impact.account.id,
        tenantId: impact.account.tenantId
      })
    }

    const blockingReasons = [
      ...impact.blockingReasons,
      ...(await this.accountDeletionBlockerService.getBlockingReasons({
        accountId: impact.account.id,
        userId: impact.account.userId,
        tenantId: impact.account.tenantId,
        scopeLevel: impact.account.scopeLevel
      }))
    ]
    if (blockingReasons.length > 0) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_DELETE_BLOCKED, {
        accountId: command.accountId,
        blockingReasons
      })
    }

    const result = await this.accountRepository.delete(command.accountId)

    return {
      accountId: command.accountId,
      deletedOrgMembershipCount: result.deletedOrgMembershipCount,
      deletedContactAssetCount: result.deletedContactAssetCount,
      userRetained: true
    }
  }
}
