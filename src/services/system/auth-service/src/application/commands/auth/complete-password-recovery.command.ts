import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CompletePasswordRecoveryCommand implements ICommand {
  @IsNotEmpty()
  @IsString()
  readonly resetToken: string

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly newPassword: string

  constructor(input: { resetToken: string; newPassword: string }) {
    this.resetToken = input.resetToken
    this.newPassword = input.newPassword
  }
}
