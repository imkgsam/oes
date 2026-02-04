import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CheckUserPermissionQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty({ message: 'User ID is required' })
  readonly userId: string

  @IsString()
  @IsNotEmpty({ message: 'Permission code is required' })
  readonly permissionCode: string

  constructor(userId: string, permissionCode: string) {
    this.userId = userId
    this.permissionCode = permissionCode
  }
}
