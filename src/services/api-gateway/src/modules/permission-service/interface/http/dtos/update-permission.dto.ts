import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

// Defines mutable fields for a global permission dictionary item.
export class UpdatePermissionDto {
  @ApiPropertyOptional({
    description: 'New owning service or module name.',
    example: 'PERMISSION_SERVICE'
  })
  @IsOptional()
  @IsString()
  module?: string

  @ApiPropertyOptional({
    description: 'Updated human-readable permission description.'
  })
  @IsOptional()
  @IsString()
  description?: string
}
