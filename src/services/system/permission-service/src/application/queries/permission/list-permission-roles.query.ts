import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class ListPermissionRolesQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid permission ID format' })
  @IsNotEmpty({ message: 'Permission ID is required' })
  readonly permissionId: string

  constructor(permissionId: string) {
    this.permissionId = permissionId
  }
}
