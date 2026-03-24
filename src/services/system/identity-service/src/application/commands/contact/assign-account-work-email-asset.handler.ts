import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  CONTACT_ASSET_PATTERNS,
  CONTACT_ASSET_TYPES,
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_INVALID_WORK_EMAIL,
  IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED,
  SYMBOLS
} from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AssignAccountWorkEmailAssetCommand } from './assign-account-work-email-asset.command'

@CommandHandler(AssignAccountWorkEmailAssetCommand)
export class AssignAccountWorkEmailAssetHandler
  implements ICommandHandler<AssignAccountWorkEmailAssetCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(
    command: AssignAccountWorkEmailAssetCommand
  ): Promise<AccountContactAssetEntity> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    const normalizedEmail = command.email.trim().toLowerCase()
    if (!CONTACT_ASSET_PATTERNS.WORK_EMAIL.test(normalizedEmail)) {
      throw ExceptionFactory.domain(IDENTITY_INVALID_WORK_EMAIL, {
        email: command.email
      })
    }

    const existing = await this.accountContactAssetRepository.findCurrentByTenantAndTypeAndValue(
      account.tenantId,
      CONTACT_ASSET_TYPES.WORK_EMAIL,
      normalizedEmail
    )

    if (existing) {
      throw ExceptionFactory.domain(IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED, {
        email: normalizedEmail,
        accountId: existing.accountId,
        assetId: existing.id
      })
    }

    return this.accountContactAssetRepository.assign({
      tenantId: account.tenantId,
      accountId: command.accountId,
      type: CONTACT_ASSET_TYPES.WORK_EMAIL,
      value: normalizedEmail,
      isPrimary: command.isPrimary,
      assignedBy: command.operatorId
    })
  }
}
