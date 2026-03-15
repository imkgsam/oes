import { ICommand } from '@nestjs/cqrs'
import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator'

export class SetRoleEnabledCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  @IsBoolean()
  readonly isEnabled: boolean

  constructor(id: string, isEnabled: boolean) {
    this.id = id
    this.isEnabled = isEnabled
  }
}
