import { IQuery } from '@nestjs/cqrs'
import { IsString, MinLength } from 'class-validator'

// Carries the target user whose login methods should be listed.
export class ListLoginMethodsQuery implements IQuery {
  @IsString()
  @MinLength(1)
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
