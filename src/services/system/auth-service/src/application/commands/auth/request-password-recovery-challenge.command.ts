import { ICommand } from '@nestjs/cqrs'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class RequestPasswordRecoveryChallengeCommand implements ICommand {
  @IsEnum(['EMAIL', 'PHONE'])
  readonly channel: 'EMAIL' | 'PHONE'

  @IsNotEmpty()
  @IsString()
  readonly identifier: string

  constructor(input: { channel: 'EMAIL' | 'PHONE'; identifier: string }) {
    this.channel = input.channel
    this.identifier = input.identifier
  }
}
