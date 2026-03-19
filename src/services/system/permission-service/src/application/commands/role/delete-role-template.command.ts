import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class DeleteRoleTemplateCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  constructor(id: string) {
    this.id = id
  }
}
