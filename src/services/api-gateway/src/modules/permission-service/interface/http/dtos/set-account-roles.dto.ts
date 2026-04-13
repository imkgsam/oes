import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayUnique, IsArray, IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator'

// Defines the payload for replacing one account's effective role set within one scope.
export class SetAccountRolesDto {
  @ApiProperty({
    description: 'Account type that owns the binding set.',
    enum: ['USER', 'SERVICE']
  })
  @IsIn(['USER', 'SERVICE'])
  accountType: string

  @ApiProperty({
    description: 'Binding scope.',
    enum: ['SYSTEM', 'TENANT']
  })
  @IsIn(['SYSTEM', 'TENANT'])
  scopeLevel: string

  @ApiPropertyOptional({
    description: 'Tenant id for tenant-scoped bindings; omit for system-scoped bindings.',
    example: 'tenant-id'
  })
  @ValidateIf((value) => value.scopeLevel === 'TENANT')
  @IsString()
  @IsNotEmpty()
  tenantId?: string

  @ApiProperty({
    description: 'Role instance ids that should remain assigned after replacement.',
    type: [String]
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleIds: string[]
}
