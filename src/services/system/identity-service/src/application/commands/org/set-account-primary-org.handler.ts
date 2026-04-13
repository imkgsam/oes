import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH,
  IDENTITY_ORG_NOT_FOUND,
  SYMBOLS
} from '../../../common/constants'
import { AccountOrgMembershipEntity } from '../../../domain/entities/account-org-membership.entity'
import { AccountOrgMembershipRepository } from '../../../domain/repositories/account-org-membership.repository'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { OrgRepository } from '../../../domain/repositories/org.repository'
import { SetAccountPrimaryOrgCommand } from './set-account-primary-org.command'

@CommandHandler(SetAccountPrimaryOrgCommand)
export class SetAccountPrimaryOrgHandler
  implements ICommandHandler<SetAccountPrimaryOrgCommand, AccountOrgMembershipEntity | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.ORG)
    private readonly orgRepository: OrgRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP)
    private readonly accountOrgMembershipRepository: AccountOrgMembershipRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(
    command: SetAccountPrimaryOrgCommand
  ): Promise<AccountOrgMembershipEntity | null> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    this.checkResourceService.checkAccount(command.operatorScope, {
      resourceId: account.id,
      tenantId: account.tenantId
    })

    if (!command.orgId) {
      await this.accountOrgMembershipRepository.clearPrimaryByAccountId(command.accountId)
      return null
    }

    const org = await this.orgRepository.findById(command.orgId)
    if (!org) {
      throw ExceptionFactory.domain(IDENTITY_ORG_NOT_FOUND, {
        orgId: command.orgId
      })
    }

    if (org.tenantId !== account.tenantId) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH, {
        accountId: command.accountId,
        accountTenantId: account.tenantId,
        orgId: command.orgId,
        orgTenantId: org.tenantId
      })
    }

    return this.accountOrgMembershipRepository.setPrimaryOrg(command.accountId, command.orgId)
  }
}
