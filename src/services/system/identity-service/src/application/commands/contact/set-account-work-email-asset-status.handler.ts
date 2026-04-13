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
import { SetAccountWorkEmailAssetStatusCommand } from './set-account-work-email-asset-status.command'

@CommandHandler(SetAccountWorkEmailAssetStatusCommand)
export class SetAccountWorkEmailAssetStatusHandler
  implements ICommandHandler<SetAccountWorkEmailAssetStatusCommand, AccountContactAssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(
    command: SetAccountWorkEmailAssetStatusCommand
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
    assertContactAssetModifiable(asset)

    const targetStatus = resolveContactAssetStatus(command.enabled)
    if (asset.status === targetStatus) {
      return asset
    }

    return this.accountContactAssetRepository.setStatus(command.assetId, targetStatus)
  }
}
