import { ICommand } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class UpdateAccountProfileCommand implements ICommand {
  @IsString()
  readonly accountId: string

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  readonly avatarUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly displayName?: string

  @IsOptional()
  @IsString()
  @MaxLength(280)
  readonly bio?: string

  @IsOptional()
  @IsBoolean()
  readonly isEnabled?: boolean

  @IsOptional()
  @IsString()
  readonly operatorId?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  // Carries one current-account profile mutation request through the identity write path.
  constructor(
    accountId: string,
    input: {
      avatarUrl?: string
      displayName?: string
      bio?: string
      isEnabled?: boolean
      operatorId?: string
      operatorScope?: OperatorScope
    }
  ) {
    this.accountId = accountId
    this.avatarUrl = input.avatarUrl
    this.displayName = input.displayName
    this.bio = input.bio
    this.isEnabled = input.isEnabled
    this.operatorId = input.operatorId
    this.operatorScope = input.operatorScope
  }
}
