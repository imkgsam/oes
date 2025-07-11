import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  @IsNotEmpty()
  module: string
}
