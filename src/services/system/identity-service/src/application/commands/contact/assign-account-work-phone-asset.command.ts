import { ICommand } from '@nestjs/cqrs'
import { IsBoolean, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'

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

  constructor(accountId: string, phone: string, isPrimary: boolean, operatorId: string) {
    this.accountId = accountId
    this.phone = phone
    this.isPrimary = isPrimary
    this.operatorId = operatorId
  }
}
