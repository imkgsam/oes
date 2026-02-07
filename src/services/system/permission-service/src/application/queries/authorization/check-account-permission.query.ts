import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CheckAccountPermissionQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty({ message: 'User ID is required' })
  readonly accountId: string

  @IsString()
  @IsNotEmpty({ message: 'Permission code is required' })
  readonly permissionCode: string

  constructor(accountId: string, permissionCode: string) {
    this.accountId = accountId
    this.permissionCode = permissionCode
  }
}
