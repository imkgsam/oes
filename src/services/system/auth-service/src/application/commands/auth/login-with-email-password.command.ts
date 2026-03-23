import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsNotEmpty, Length } from 'class-validator'

export class LoginWithEmailPasswordCommand implements ICommand {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string

  @IsNotEmpty()
  @Length(6, 30)
  readonly password: string

  constructor(email: string, password: string) {
    this.email = email
    this.password = password
  }
}
