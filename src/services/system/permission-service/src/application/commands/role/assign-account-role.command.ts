import { ICommand } from '@nestjs/cqrs'
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator'
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

  constructor(params: {
    accountId: string
    accountType: AccountType
    roleId: string
    tenantId: string
  }) {
    this.accountId = params.accountId
    this.accountType = params.accountType
    this.roleId = params.roleId
    this.tenantId = params.tenantId
  }
}
