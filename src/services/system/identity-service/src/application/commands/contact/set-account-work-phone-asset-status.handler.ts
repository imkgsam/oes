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
  assertContactAssetModifiable,
  assertContactAssetType,
  loadAccountContactAssetOrThrow,
  resolveContactAssetStatus
} from './contact-asset-command-support'
import { SetAccountWorkPhoneAssetStatusCommand } from './set-account-work-phone-asset-status.command'

@CommandHandler(SetAccountWorkPhoneAssetStatusCommand)
export class SetAccountWorkPhoneAssetStatusHandler
  implements ICommandHandler<SetAccountWorkPhoneAssetStatusCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(
    command: SetAccountWorkPhoneAssetStatusCommand
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
    assertContactAssetModifiable(asset)

    const targetStatus = resolveContactAssetStatus(command.enabled)
    if (asset.status === targetStatus) {
      return asset
    }

    return this.accountContactAssetRepository.setStatus(command.assetId, targetStatus)
  }
}
