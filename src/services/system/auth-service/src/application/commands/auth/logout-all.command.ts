import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class LogoutAllCommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
