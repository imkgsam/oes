import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class ListRoleTemplatePermissionsQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly roleTemplateId: string

  constructor(roleTemplateId: string) {
    this.roleTemplateId = roleTemplateId
  }
}
