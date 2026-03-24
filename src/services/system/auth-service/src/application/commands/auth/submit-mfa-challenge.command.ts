import { ICommand } from '@nestjs/cqrs'
import { LoginMethodEnum } from '@oes/common/constants'
import { IsEnum, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator'

export class SubmitMfaChallengeCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly challengeId: string

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  public readonly code: string

  @IsEnum(LoginMethodEnum)
  public readonly loginMethod: LoginMethodEnum

  constructor(
    challengeId: string,
    code: string,
    loginMethod: LoginMethodEnum
  ) {
    this.challengeId = challengeId
    this.code = code
    this.loginMethod = loginMethod
  }
}
