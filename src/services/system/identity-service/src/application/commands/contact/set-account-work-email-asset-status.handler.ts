import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  SYMBOLS
} from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import {
  assertContactAssetModifiable,
  loadAccountContactAssetOrThrow,
  resolveContactAssetStatus
} from './contact-asset-command-support'
import { SetAccountWorkEmailAssetStatusCommand } from './set-account-work-email-asset-status.command'

@CommandHandler(SetAccountWorkEmailAssetStatusCommand)
export class SetAccountWorkEmailAssetStatusHandler
  implements ICommandHandler<SetAccountWorkEmailAssetStatusCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(
    command: SetAccountWorkEmailAssetStatusCommand
  ): Promise<AccountContactAssetEntity> {
    const asset = await loadAccountContactAssetOrThrow(
      this.accountContactAssetRepository,
      command.assetId
    )
    assertContactAssetModifiable(asset)

    const targetStatus = resolveContactAssetStatus(command.enabled)
    if (asset.status === targetStatus) {
      return asset
    }

    return this.accountContactAssetRepository.setStatus(command.assetId, targetStatus)
  }
}
