import { ICommand } from '@nestjs/cqrs'
import { IsOptional, IsString, MaxLength } from 'class-validator'

// Carries one account-creation follow-up request that bootstraps OTP-ready login methods.
export class BootstrapUserLoginMethodsCommand implements ICommand {
  @IsString()
  readonly userId: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly email?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  readonly phone?: string

  constructor(input: { email?: string; phone?: string; userId: string }) {
    this.userId = input.userId
    this.email = input.email
    this.phone = input.phone
  }
}
