import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Defines the payload for instantiating a tenant role from a role template.
export class CreateRoleFromTemplateDto {
  @ApiProperty({
    description: 'Tenant id that will own the instantiated role.',
    example: 'tenant-id'
  })
  @IsString()
  @IsNotEmpty()
  tenantId: string

  @ApiPropertyOptional({
    description: 'Optional overridden role name.'
  })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({
    description: 'Optional overridden role description.'
  })
  @IsOptional()
  @IsString()
  description?: string
}
