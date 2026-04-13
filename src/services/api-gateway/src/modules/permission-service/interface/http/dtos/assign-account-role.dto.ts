import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ValidateIf, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Defines the payload for granting one role instance to one account binding target.
export class AssignAccountRoleDto {
  @ApiProperty({
    description: 'Account type that owns the binding.',
    enum: ['USER', 'SERVICE']
  })
  @IsIn(['USER', 'SERVICE'])
  accountType: string

  @ApiProperty({
    description: 'Role instance id to assign.',
    example: 'role-id'
  })
  @IsString()
  @IsNotEmpty()
  roleId: string

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

  @ApiPropertyOptional({
    description: 'Optional ISO timestamp after which the binding becomes effective.'
  })
  @IsOptional()
  @IsDateString()
  effectiveAt?: string

  @ApiPropertyOptional({
    description: 'Optional ISO timestamp after which the binding expires.'
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
