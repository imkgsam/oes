import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class CreateRoleTemplateCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z][A-Za-z0-9._-]*$/)
  readonly code: string

  @IsOptional()
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
