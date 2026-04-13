import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CheckResourceService } from '../../authorization'
import {
  CONTACT_ASSET_TYPES,
  SYMBOLS
} from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import {
  assertContactAssetCanBePrimary,
  assertContactAssetType,
  loadAccountContactAssetOrThrow
} from './contact-asset-command-support'
import { SetAccountPrimaryWorkEmailAssetCommand } from './set-account-primary-work-email-asset.command'

@CommandHandler(SetAccountPrimaryWorkEmailAssetCommand)
export class SetAccountPrimaryWorkEmailAssetHandler
  implements ICommandHandler<SetAccountPrimaryWorkEmailAssetCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(
    command: SetAccountPrimaryWorkEmailAssetCommand
  ): Promise<AccountContactAssetEntity> {
    const asset = await loadAccountContactAssetOrThrow(
      this.accountContactAssetRepository,
      command.assetId
    )
    this.checkResourceService.checkContactAsset(command.operatorScope, {
      resourceId: asset.id,
      tenantId: asset.tenantId
    })
    assertContactAssetType(asset, CONTACT_ASSET_TYPES.WORK_EMAIL)
    assertContactAssetCanBePrimary(asset)

    if (asset.isPrimary) {
      return asset
    }

    return this.accountContactAssetRepository.setPrimary(command.assetId)
  }
}
