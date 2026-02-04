import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator'

export class CreateRoleCommand implements ICommand {
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  readonly name: string

  @IsString()
  @IsNotEmpty({ message: 'Role code is required' })
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'Role code must start with uppercase letter and contain only uppercase letters, numbers, and underscores'
  })
  readonly code: string

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Description must not exceed 200 characters' })
  readonly description?: string

  constructor(name: string, code: string, description?: string) {
    this.name = name
    this.code = code
    this.description = description
  }
}
