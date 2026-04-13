import { ICommand } from '@nestjs/cqrs'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { MfaType } from '../../../common/constants'

export class EnableMfaBindingCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  public readonly userId: string

  @IsEnum(MfaType)
  public readonly type: MfaType

  constructor(userId: string, type: MfaType) {
    this.userId = userId
    this.type = type
  }
}
