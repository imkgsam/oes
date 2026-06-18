import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AssetEntity } from '../../../domain/entities/asset.entity'
import { AssetRepository } from '../../../domain/repositories/asset.repository'
import { validateEmployeeOfficialPhotoScope } from './avatar-command-validation'
import { BindEmployeeOfficialPhotoCommand } from './bind-employee-official-photo.command'

export interface BindEmployeeOfficialPhotoResult {
  activeAsset: AssetEntity
  replacedAssetId: null | string
}

@Injectable()
@CommandHandler(BindEmployeeOfficialPhotoCommand)
// BindEmployeeOfficialPhotoHandler promotes a pending employee photo and retires the previous matching photo.
export class BindEmployeeOfficialPhotoHandler
  implements ICommandHandler<BindEmployeeOfficialPhotoCommand, BindEmployeeOfficialPhotoResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.ASSET)
    private readonly assetRepository: AssetRepository
  ) {}

  async execute(command: BindEmployeeOfficialPhotoCommand): Promise<BindEmployeeOfficialPhotoResult> {
    const tenantId = validateEmployeeOfficialPhotoScope(command)

    return this.assetRepository.activateEmployeeOfficialPhoto({
      tenantId,
      employeeId: command.employeeId,
      newAssetId: command.newAssetId,
      previousAssetId: command.previousAssetId,
      updatedBy: command.operatorId
    })
  }
}
