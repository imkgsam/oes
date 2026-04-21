import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class VerifyPasswordRecoveryChallengeCommand implements ICommand {
  @IsNotEmpty()
  @IsString()
  readonly challengeId: string

  @IsNotEmpty()
  @IsString()
  readonly otp: string

  constructor(input: { challengeId: string; otp: string }) {
    this.challengeId = input.challengeId
    this.otp = input.otp
  }
}
