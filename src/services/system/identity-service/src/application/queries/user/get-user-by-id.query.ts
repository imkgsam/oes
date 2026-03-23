import { IQuery } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class GetUserByIdQuery implements IQuery {
  @IsUUID()
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
