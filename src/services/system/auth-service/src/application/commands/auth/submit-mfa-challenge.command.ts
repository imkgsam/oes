import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator'

export class SubmitMfaChallengeCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly challengeId: string

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  public readonly code: string

  constructor(
    challengeId: string,
    code: string
  ) {
    this.challengeId = challengeId
    this.code = code
  }
}
