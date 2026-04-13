import { ICommand } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class AssignAccountWorkPhoneAssetCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  readonly phone: string

  @IsBoolean()
  readonly isPrimary: boolean

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    accountId: string,
    phone: string,
    isPrimary: boolean,
    operatorId: string,
    operatorScope?: OperatorScope
  ) {
    this.accountId = accountId
    this.phone = phone
    this.isPrimary = isPrimary
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
