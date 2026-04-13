import { IsNotEmpty, IsString } from 'class-validator'

export class LogoutAllCommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
