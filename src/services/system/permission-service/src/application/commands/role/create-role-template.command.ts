import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class CreateRoleTemplateCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  readonly code: string

  @IsString()
  @MaxLength(200)
  readonly description?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: { name: string; code: string; description?: string; operatorScope?: OperatorScope }) {
    this.name = params.name
    this.code = params.code
    this.description = params.description
    this.operatorScope = params.operatorScope
  }
}
