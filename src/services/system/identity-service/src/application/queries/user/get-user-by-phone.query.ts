import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class GetUserByPhoneQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  readonly phone: string

  constructor(phone: string) {
    this.phone = phone
  }
}
