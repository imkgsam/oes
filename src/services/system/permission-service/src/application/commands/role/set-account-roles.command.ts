import { ICommand } from '@nestjs/cqrs'
import { IsArray, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator'
import { AccountType } from '../../../domain/enums/account-type.enum'

export class SetAccountRolesCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsEnum(AccountType)
  readonly accountType: AccountType

  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsArray()
  @IsUUID(undefined, { each: true })
  readonly roleIds: string[]

  constructor(params: {
    accountId: string
    accountType: AccountType
    tenantId: string
    roleIds: string[]
  }) {
    this.accountId = params.accountId
    this.accountType = params.accountType
    this.tenantId = params.tenantId
    this.roleIds = params.roleIds
  }
}
