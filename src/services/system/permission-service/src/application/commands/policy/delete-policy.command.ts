import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class DeletePolicyCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  constructor(id: string) {
    this.id = id
  }
}
