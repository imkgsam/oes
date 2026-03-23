import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS,
  IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH,
  IDENTITY_ORG_NOT_FOUND,
  SYMBOLS
} from '../../../common/constants'
import { AccountOrgMembershipEntity } from '../../../domain/entities/account-org-membership.entity'
import { AccountOrgMembershipRepository } from '../../../domain/repositories/account-org-membership.repository'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { OrgRepository } from '../../../domain/repositories/org.repository'
import { AddAccountOrgMembershipCommand } from './add-account-org-membership.command'

@CommandHandler(AddAccountOrgMembershipCommand)
export class AddAccountOrgMembershipHandler
  implements ICommandHandler<AddAccountOrgMembershipCommand, AccountOrgMembershipEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.ORG)
    private readonly orgRepository: OrgRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP)
    private readonly membershipRepository: AccountOrgMembershipRepository
  ) {}

  async execute(command: AddAccountOrgMembershipCommand): Promise<AccountOrgMembershipEntity> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
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
        orgId: command.orgId,
        accountTenantId: account.tenantId,
        orgTenantId: org.tenantId
      })
    }

    const existing = await this.membershipRepository.findByAccountAndOrg(
      command.accountId,
      command.orgId
    )

    if (existing) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS, {
        accountId: command.accountId,
        orgId: command.orgId
      })
    }

    return this.membershipRepository.addSecondaryMembership(command.accountId, command.orgId)
  }
}
