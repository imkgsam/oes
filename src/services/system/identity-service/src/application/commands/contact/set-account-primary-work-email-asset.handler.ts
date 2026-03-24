import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  SYMBOLS
} from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import {
  assertContactAssetCanBePrimary,
  loadAccountContactAssetOrThrow
} from './contact-asset-command-support'
import { SetAccountPrimaryWorkEmailAssetCommand } from './set-account-primary-work-email-asset.command'

@CommandHandler(SetAccountPrimaryWorkEmailAssetCommand)
export class SetAccountPrimaryWorkEmailAssetHandler
  implements ICommandHandler<SetAccountPrimaryWorkEmailAssetCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(
    command: SetAccountPrimaryWorkEmailAssetCommand
  ): Promise<AccountContactAssetEntity> {
    const asset = await loadAccountContactAssetOrThrow(
      this.accountContactAssetRepository,
      command.assetId
    )
    assertContactAssetCanBePrimary(asset)

    if (asset.isPrimary) {
      return asset
    }

    return this.accountContactAssetRepository.setPrimary(command.assetId)
  }
}
