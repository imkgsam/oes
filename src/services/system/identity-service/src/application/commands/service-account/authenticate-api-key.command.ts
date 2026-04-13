import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class AuthenticateApiKeyCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly secret: string

  constructor(secret: string) {
    this.secret = secret
  }
}
