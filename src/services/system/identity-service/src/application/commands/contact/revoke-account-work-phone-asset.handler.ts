import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  SYMBOLS
} from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import {
  assertContactAssetModifiable,
  loadAccountContactAssetOrThrow
} from './contact-asset-command-support'
import { RevokeAccountWorkPhoneAssetCommand } from './revoke-account-work-phone-asset.command'

@CommandHandler(RevokeAccountWorkPhoneAssetCommand)
export class RevokeAccountWorkPhoneAssetHandler
  implements ICommandHandler<RevokeAccountWorkPhoneAssetCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(
    command: RevokeAccountWorkPhoneAssetCommand
  ): Promise<AccountContactAssetEntity> {
    const asset = await loadAccountContactAssetOrThrow(
      this.accountContactAssetRepository,
      command.assetId
    )
    assertContactAssetModifiable(asset)

    return this.accountContactAssetRepository.revoke(command.assetId, command.operatorId)
  }
}
