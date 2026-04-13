import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class ActivateTotpBindingCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  public readonly userId: string

  @IsString()
  @IsNotEmpty()
  public readonly bindingId: string

  @IsString()
  @IsNotEmpty()
  public readonly code: string

  constructor(userId: string, bindingId: string, code: string) {
    this.userId = userId
    this.bindingId = bindingId
    this.code = code
  }
}
