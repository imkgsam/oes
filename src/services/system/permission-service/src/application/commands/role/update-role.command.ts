import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

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

  constructor(params: { id: string; name?: string; description?: string }) {
    this.id = params.id
    this.name = params.name
    this.description = params.description
  }
}
