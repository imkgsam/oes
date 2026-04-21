import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

// Carries the submitted recovery identifier whose verified recovery channels should be inspected.
export class InspectPasswordRecoveryChannelsQuery implements IQuery {
  @IsNotEmpty()
  @IsString()
  readonly identifier: string

  constructor(identifier: string) {
    this.identifier = identifier
  }
}
