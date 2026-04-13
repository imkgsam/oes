import { IsNotEmpty, IsString } from 'class-validator'

export class ListMfaBindingsQuery {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
