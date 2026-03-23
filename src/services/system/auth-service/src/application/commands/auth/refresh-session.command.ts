import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshSessionCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  public readonly refreshToken: string

  constructor(refreshToken: string) {
    this.refreshToken = refreshToken
  }
}
