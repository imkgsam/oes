import { ICommand } from '@nestjs/cqrs'
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'

// Carries a request to enable or disable one login method owned by a user.
export class SetLoginMethodEnabledCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @MinLength(1)
  readonly methodId: string

  @IsBoolean()
  readonly enabled: boolean

  @IsString()
  @MinLength(1)
  readonly operatorId: string

  @IsOptional()
  @IsString()
  readonly reason?: string

  constructor(input: {
    enabled: boolean
    methodId: string
    operatorId: string
    reason?: string
    userId: string
  }) {
    this.userId = input.userId
    this.methodId = input.methodId
    this.enabled = input.enabled
    this.operatorId = input.operatorId
    this.reason = input.reason
  }
}
