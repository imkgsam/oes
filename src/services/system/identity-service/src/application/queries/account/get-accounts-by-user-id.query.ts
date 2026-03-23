import { IQuery } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class GetAccountsByUserIdQuery implements IQuery {
  @IsUUID()
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
