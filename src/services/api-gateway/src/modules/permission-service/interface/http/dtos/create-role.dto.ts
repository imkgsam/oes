import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Defines the payload for creating a role instance in either system or tenant scope.
export class CreateRoleDto {
  @ApiProperty({
    description: 'Human-readable role name.',
    example: 'System Auditor'
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'Stable role code.',
    example: 'SYSTEM_AUDITOR'
  })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({
    description: 'Role scope.',
    enum: ['SYSTEM', 'TENANT']
  })
  @IsIn(['SYSTEM', 'TENANT'])
  scopeLevel: string

  @ApiPropertyOptional({
    description: 'Tenant id for tenant-scoped role instances.'
  })
  @IsOptional()
  @IsString()
  tenantId?: string

  @ApiPropertyOptional({
    description: 'Optional source role template id.'
  })
  @IsOptional()
  @IsString()
  templateRoleId?: string

  @ApiPropertyOptional({
    description: 'Human-readable role description.'
  })
  @IsOptional()
  @IsString()
  description?: string
}
