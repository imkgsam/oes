import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

// Defines mutable metadata fields for a role instance.
export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Updated human-readable role name.',
    example: 'System Auditor'
  })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({
    description: 'Updated human-readable role description.'
  })
  @IsOptional()
  @IsString()
  description?: string
}
