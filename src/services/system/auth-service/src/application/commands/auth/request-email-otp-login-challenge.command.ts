import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

// Carries an email OTP login challenge request together with optional terminal context.
export class RequestEmailOtpLoginChallengeCommand implements ICommand {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly terminal?: string

  constructor(email: string, terminal?: string) {
    this.email = email
    this.terminal = terminal
  }
}
