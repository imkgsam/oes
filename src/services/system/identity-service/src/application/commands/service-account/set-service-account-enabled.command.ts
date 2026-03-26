import { ICommand } from '@nestjs/cqrs'
import { IsBoolean, IsUUID } from 'class-validator'

export class SetServiceAccountEnabledCommand implements ICommand {
  @IsUUID()
  readonly serviceAccountId: string

  @IsBoolean()
  readonly enabled: boolean

  @IsUUID()
  readonly operatorId: string

  constructor(serviceAccountId: string, enabled: boolean, operatorId: string) {
    this.serviceAccountId = serviceAccountId
    this.enabled = enabled
    this.operatorId = operatorId
  }
}
