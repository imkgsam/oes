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
import { SetAccountPrimaryWorkPhoneAssetCommand } from './set-account-primary-work-phone-asset.command'

@CommandHandler(SetAccountPrimaryWorkPhoneAssetCommand)
export class SetAccountPrimaryWorkPhoneAssetHandler
  implements ICommandHandler<SetAccountPrimaryWorkPhoneAssetCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(
    command: SetAccountPrimaryWorkPhoneAssetCommand
  ): Promise<AccountContactAssetEntity> {
    const asset = await loadAccountContactAssetOrThrow(
      this.accountContactAssetRepository,
      command.assetId
    )
    this.checkResourceService.checkContactAsset(command.operatorScope, {
      resourceId: asset.id,
      tenantId: asset.tenantId
    })
    assertContactAssetType(asset, CONTACT_ASSET_TYPES.WORK_PHONE)
    assertContactAssetCanBePrimary(asset)

    if (asset.isPrimary) {
      return asset
    }

    return this.accountContactAssetRepository.setPrimary(command.assetId)
  }
}
