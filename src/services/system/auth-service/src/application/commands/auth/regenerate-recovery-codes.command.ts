import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class RegenerateRecoveryCodesCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  public readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }
}
