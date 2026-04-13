import { ICommand } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class AssignAccountWorkEmailAssetCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  readonly email: string

  @IsBoolean()
  readonly isPrimary: boolean

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    accountId: string,
    email: string,
    isPrimary: boolean,
    operatorId: string,
    operatorScope?: OperatorScope
  ) {
    this.accountId = accountId
    this.email = email
    this.isPrimary = isPrimary
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
