import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class UpdateRoleCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly name?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly description?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: { id: string; name?: string; description?: string; operatorScope?: OperatorScope }) {
    this.id = params.id
    this.name = params.name
    this.description = params.description
    this.operatorScope = params.operatorScope
  }
}
