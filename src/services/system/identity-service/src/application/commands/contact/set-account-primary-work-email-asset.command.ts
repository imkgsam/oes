import { ICommand } from '@nestjs/cqrs'
import { Allow, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class SetAccountPrimaryWorkEmailAssetCommand implements ICommand {
  @IsUUID()
  readonly assetId: string

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(assetId: string, operatorId: string, operatorScope?: OperatorScope) {
    this.assetId = assetId
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
