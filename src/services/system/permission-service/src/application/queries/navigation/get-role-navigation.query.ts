import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class GetRoleNavigationQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly roleId: string

  constructor(roleId: string) {
    this.roleId = roleId
  }
}
