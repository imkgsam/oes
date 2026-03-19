import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator'

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

  constructor(params: { name: string; code: string; description?: string }) {
    this.name = params.name
    this.code = params.code
    this.description = params.description
  }
}
