import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CheckPermissionQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  readonly permissionCode: string

  constructor(accountId: string, permissionCode: string) {
    this.accountId = accountId
    this.permissionCode = permissionCode
  }
}
