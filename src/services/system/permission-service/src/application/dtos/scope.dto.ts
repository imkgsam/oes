import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class AddUserScopeDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  permissionCode: string

  @IsString()
  @IsNotEmpty()
  resourceType: string

  @IsString()
  @IsNotEmpty()
  resourceId: string
}


export class CheckUserScopeDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string

  scope: string
}
