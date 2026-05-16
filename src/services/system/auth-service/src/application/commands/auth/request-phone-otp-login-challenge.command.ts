import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

// Carries a phone OTP login challenge request together with optional terminal context.
export class RequestPhoneOtpLoginChallengeCommand implements ICommand {
  @IsNotEmpty()
  @Matches(/^\+?\d{6,20}$/)
  readonly phone: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly terminal?: string

  constructor(phone: string, terminal?: string) {
    this.phone = phone
    this.terminal = terminal
  }
}
