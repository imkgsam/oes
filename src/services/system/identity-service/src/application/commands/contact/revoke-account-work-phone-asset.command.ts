import { ICommand } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class RevokeAccountWorkPhoneAssetCommand implements ICommand {
  @IsUUID()
  readonly assetId: string

  @IsUUID()
  readonly operatorId: string

  constructor(assetId: string, operatorId: string) {
    this.assetId = assetId
    this.operatorId = operatorId
  }
}
