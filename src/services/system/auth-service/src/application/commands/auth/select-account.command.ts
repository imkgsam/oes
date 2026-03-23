import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class SelectAccountCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly userId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly accountId: string

  constructor(
    userId: string,
    accountId: string
  ) {
    this.userId = userId
    this.accountId = accountId
  }
}
