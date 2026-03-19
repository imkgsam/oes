import { ICommand } from '@nestjs/cqrs'
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { AccountType } from '../../../domain/enums/account-type.enum'

export class AssignAccountRoleCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsEnum(AccountType)
  readonly accountType: AccountType

  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsOptional()
  @IsDateString()
  readonly effectiveAt?: string

  @IsOptional()
  @IsDateString()
  readonly expiresAt?: string

  constructor(params: {
    accountId: string
    accountType: AccountType
    roleId: string
    tenantId: string
    effectiveAt?: string
    expiresAt?: string
  }) {
    this.accountId = params.accountId
    this.accountType = params.accountType
    this.roleId = params.roleId
    this.tenantId = params.tenantId
    this.effectiveAt = params.effectiveAt
    this.expiresAt = params.expiresAt
  }
}
