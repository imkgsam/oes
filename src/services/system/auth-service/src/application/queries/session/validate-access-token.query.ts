import { IsNotEmpty, IsString } from 'class-validator'

export class ValidateAccessTokenQuery {
  @IsString()
  @IsNotEmpty()
  readonly accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }
}
