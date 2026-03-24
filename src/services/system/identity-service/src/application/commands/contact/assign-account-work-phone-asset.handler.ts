import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  CONTACT_ASSET_PATTERNS,
  CONTACT_ASSET_TYPES,
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_INVALID_WORK_PHONE,
  IDENTITY_WORK_PHONE_ALREADY_ASSIGNED,
  SYMBOLS
} from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AssignAccountWorkPhoneAssetCommand } from './assign-account-work-phone-asset.command'

@CommandHandler(AssignAccountWorkPhoneAssetCommand)
export class AssignAccountWorkPhoneAssetHandler
  implements ICommandHandler<AssignAccountWorkPhoneAssetCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(
    command: AssignAccountWorkPhoneAssetCommand
  ): Promise<AccountContactAssetEntity> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    const normalizedPhone = command.phone.trim()
    if (!CONTACT_ASSET_PATTERNS.WORK_PHONE.test(normalizedPhone)) {
      throw ExceptionFactory.domain(IDENTITY_INVALID_WORK_PHONE, {
        phone: command.phone
      })
    }

    const existing = await this.accountContactAssetRepository.findCurrentByTenantAndTypeAndValue(
      account.tenantId,
      CONTACT_ASSET_TYPES.WORK_PHONE,
      normalizedPhone
    )

    if (existing) {
      throw ExceptionFactory.domain(IDENTITY_WORK_PHONE_ALREADY_ASSIGNED, {
        phone: normalizedPhone,
        accountId: existing.accountId,
        assetId: existing.id
      })
    }

    return this.accountContactAssetRepository.assign({
      tenantId: account.tenantId,
      accountId: command.accountId,
      type: CONTACT_ASSET_TYPES.WORK_PHONE,
      value: normalizedPhone,
      isPrimary: command.isPrimary,
      assignedBy: command.operatorId
    })
  }
}
