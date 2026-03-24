import { ICommand } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class SetAccountPrimaryWorkPhoneAssetCommand implements ICommand {
  @IsUUID()
  readonly assetId: string

  constructor(assetId: string) {
    this.assetId = assetId
  }
}
