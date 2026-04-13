import { ICommand } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class SetAccountWorkPhoneAssetStatusCommand implements ICommand {
  @IsUUID()
  readonly assetId: string

  @IsBoolean()
  readonly enabled: boolean

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(assetId: string, enabled: boolean, operatorId: string, operatorScope?: OperatorScope) {
    this.assetId = assetId
    this.enabled = enabled
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
