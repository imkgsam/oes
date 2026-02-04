import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class GetPermissionByIdQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid permission ID format' })
  @IsNotEmpty({ message: 'Permission ID is required' })
  readonly id: string

  constructor(id: string) {
    this.id = id
  }
}
