import { ICommand } from '@nestjs/cqrs'
import { LoginMethodEnum } from '@oes/common/constants'
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class SelectAccountCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly userId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly accountId: string

  @IsEnum(LoginMethodEnum)
  public readonly loginMethod: LoginMethodEnum

  constructor(
    userId: string,
    accountId: string,
    loginMethod: LoginMethodEnum
  ) {
    this.userId = userId
    this.accountId = accountId
    this.loginMethod = loginMethod
  }
}
