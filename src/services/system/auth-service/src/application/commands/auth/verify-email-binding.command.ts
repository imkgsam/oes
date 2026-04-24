import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

// Carries one authenticated self-service email binding verification attempt.
export class VerifyEmailBindingCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  readonly accountId?: string

  @IsString()
  readonly tenantId?: string

  @IsString()
  readonly scopeLevel?: 'SYSTEM' | 'TENANT'

  @IsEmail()
  readonly email: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  readonly otp: string

  @IsString()
  readonly mfaGrantToken?: string

  constructor(input: {
    accountId?: string
    email: string
    mfaGrantToken?: string
    otp: string
    scopeLevel?: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }) {
    this.userId = input.userId
    this.accountId = input.accountId
    this.tenantId = input.tenantId
    this.scopeLevel = input.scopeLevel
    this.email = input.email
    this.otp = input.otp
    this.mfaGrantToken = input.mfaGrantToken
  }
}
