import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Matches } from 'class-validator'

// Defines mutable tenant profile fields exposed to the system-admin tenant page.
export class UpdateTenantProfileDto {
  @ApiPropertyOptional({ description: 'Updated tenant code.', example: 'tenant.alpha.updated' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: 'Three digit hexadecimal prefix used in generated employee codes.', example: '0AF' })
  @IsOptional()
  @Matches(/^[0-9A-Fa-f]{3}$/)
  employeeCodePrefix?: string

  @ApiPropertyOptional({ description: 'Updated tenant name.', example: 'Alpha Tenant Updated' })
  @IsOptional()
  @IsString()
  name?: string
}
