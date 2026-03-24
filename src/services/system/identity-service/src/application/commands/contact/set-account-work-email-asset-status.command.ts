import { ICommand } from '@nestjs/cqrs'
import { IsBoolean, IsUUID } from 'class-validator'

export class SetAccountWorkEmailAssetStatusCommand implements ICommand {
  @IsUUID()
  readonly assetId: string

  @IsBoolean()
  readonly enabled: boolean

  constructor(assetId: string, enabled: boolean) {
    this.assetId = assetId
    this.enabled = enabled
  }
}
