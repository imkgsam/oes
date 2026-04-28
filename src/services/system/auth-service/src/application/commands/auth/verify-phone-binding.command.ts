import { ICommand } from '@nestjs/cqrs'
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

// Carries one authenticated self-service phone binding verification attempt.
export class VerifyPhoneBindingCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  readonly accountId?: string

  @IsString()
  readonly tenantId?: string

  @IsString()
  readonly scopeLevel?: 'SYSTEM' | 'TENANT'

  @IsString()
  @Matches(/^\+\d{6,20}$/)
  readonly phone: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  readonly otp: string

  @IsOptional()
  @IsString()
  readonly mfaGrantToken?: string

  constructor(input: {
    accountId?: string
    mfaGrantToken?: string
    otp: string
    phone: string
    scopeLevel?: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }) {
    this.userId = input.userId
    this.accountId = input.accountId
    this.tenantId = input.tenantId
    this.scopeLevel = input.scopeLevel
    this.phone = input.phone
    this.otp = input.otp
    this.mfaGrantToken = input.mfaGrantToken
  }
}
