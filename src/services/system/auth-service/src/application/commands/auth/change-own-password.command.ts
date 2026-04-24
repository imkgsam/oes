import { ICommand } from '@nestjs/cqrs'
import { IsString, MinLength } from 'class-validator'

// Carries a self-service password change request for the authenticated user.
export class ChangeOwnPasswordCommand implements ICommand {
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
  @MinLength(1)
  readonly currentPassword: string

  @IsString()
  @MinLength(8)
  readonly newPassword: string

  @IsString()
  readonly mfaGrantToken?: string

  constructor(input: {
    accountId?: string
    currentPassword: string
    mfaGrantToken?: string
    newPassword: string
    scopeLevel?: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }) {
    this.userId = input.userId
    this.accountId = input.accountId
    this.tenantId = input.tenantId
    this.scopeLevel = input.scopeLevel
    this.currentPassword = input.currentPassword
    this.newPassword = input.newPassword
    this.mfaGrantToken = input.mfaGrantToken
  }
}
