import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  module: string

  @IsOptional()
  @IsString()
  description?: string
}
