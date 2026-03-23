import { IQuery } from '@nestjs/cqrs'

export class GetAccountsByUserIdQuery implements IQuery {
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
