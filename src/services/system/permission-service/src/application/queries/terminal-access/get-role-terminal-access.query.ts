import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

/** GetRoleTerminalAccessQuery reads the default login terminals configured for a role. */
export class GetRoleTerminalAccessQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid role ID format' })
  @IsNotEmpty({ message: 'Role ID is required' })
  readonly roleId: string

  constructor(roleId: string) {
    this.roleId = roleId
  }
}
