import { IQuery } from '@nestjs/cqrs'

export class GetUserByEmailQuery implements IQuery {
  readonly email: string

  constructor(email: string) {
    this.email = email
  }
}
