import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class GetPolicyByIdQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  constructor(id: string) {
    this.id = id
  }
}
