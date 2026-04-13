import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND,
  IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED,
  SYMBOLS
} from '../../../common/constants'
import { AccountOrgMembershipEntity } from '../../../domain/entities/account-org-membership.entity'
import { AccountOrgMembershipRepository } from '../../../domain/repositories/account-org-membership.repository'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { RemoveAccountOrgMembershipCommand } from './remove-account-org-membership.command'

@CommandHandler(RemoveAccountOrgMembershipCommand)
export class RemoveAccountOrgMembershipHandler
  implements ICommandHandler<RemoveAccountOrgMembershipCommand, AccountOrgMembershipEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP)
    private readonly membershipRepository: AccountOrgMembershipRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(
    command: RemoveAccountOrgMembershipCommand
  ): Promise<AccountOrgMembershipEntity> {
    const membership = await this.membershipRepository.findByAccountAndOrg(
      command.accountId,
      command.orgId
    )

    if (!membership) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND, {
        accountId: command.accountId,
        orgId: command.orgId
      })
    }

    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND, {
        accountId: command.accountId,
        orgId: command.orgId
      })
    }

    this.checkResourceService.checkAccountOrgMembership(command.operatorScope, {
      resourceId: membership.id,
      tenantId: account.tenantId
    })

    if (membership.isPrimary) {
      throw ExceptionFactory.domain(IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED, {
        accountId: command.accountId,
        orgId: command.orgId
      })
    }

    const removed = await this.membershipRepository.removeMembership(
      command.accountId,
      command.orgId
    )

    if (!removed) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND, {
        accountId: command.accountId,
        orgId: command.orgId
      })
    }

    return removed
  }
}
