import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

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

export class CheckUserPermissionDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  permissionCode: string
}
