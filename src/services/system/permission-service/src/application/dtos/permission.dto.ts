import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  @IsNotEmpty()
  module: string
}


export class CheckUserPermissionDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  permissionCode: string
}