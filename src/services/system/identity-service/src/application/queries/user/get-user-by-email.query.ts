import { IQuery } from '@nestjs/cqrs'
import { IsEmail } from 'class-validator'

export class GetUserByEmailQuery implements IQuery {
  @IsEmail()
  readonly email: string

  constructor(email: string) {
    this.email = email
  }
}
