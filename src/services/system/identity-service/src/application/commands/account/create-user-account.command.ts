import { ICommand } from '@nestjs/cqrs'
import { Allow, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'

type CreateUserAccountInput = {
  displayName?: string
  email?: string
  operatorId?: string
  operatorScope?: OperatorScope
  phone?: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId?: string
  username?: string
  idempotencyKey?: string
}

// Carries one admin-driven human account creation request through the identity write path.
export class CreateUserAccountCommand implements ICommand {
  @IsIn(['SYSTEM', 'TENANT'])
  readonly scopeLevel: 'SYSTEM' | 'TENANT'

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly displayName?: string

  @IsOptional()
  @IsString()
  readonly username?: string

  @IsOptional()
  @IsString()
  readonly email?: string

  @IsOptional()
  @IsString()
  readonly phone?: string

  @IsOptional()
  @IsString()
  readonly idempotencyKey?: string

  @IsOptional()
  @IsString()
  readonly operatorId?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: CreateUserAccountInput) {
    this.scopeLevel = input.scopeLevel
    this.tenantId = input.tenantId
    this.displayName = input.displayName
    this.username = input.username
    this.email = input.email
    this.phone = input.phone
    this.idempotencyKey = input.idempotencyKey
    this.operatorId = input.operatorId
    this.operatorScope = input.operatorScope
  }
}
