import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class ListRoleAccountsQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid role ID format' })
  @IsNotEmpty({ message: 'Role ID is required' })
  readonly roleId: string

  constructor(roleId: string) {
    this.roleId = roleId
  }
}
