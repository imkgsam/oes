import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

// Defines the payload for assigning one permission to a role instance.
export class AssignRolePermissionDto {
  @ApiProperty({
    description: 'Permission id to assign to the role.',
    example: 'permission-id'
  })
  @IsString()
  @IsNotEmpty()
  permissionId: string
}
