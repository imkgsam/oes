import { ICommand } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class SetAccountPrimaryWorkEmailAssetCommand implements ICommand {
  @IsUUID()
  readonly assetId: string

  constructor(assetId: string) {
    this.assetId = assetId
  }
}
