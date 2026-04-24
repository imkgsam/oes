import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

// Defines the system-admin payload used to create one tenant with its root org.
export class CreateTenantDto {
  @ApiProperty({ description: 'Stable tenant code.', example: 'tenant.alpha' })
  @IsString()
  code!: string

  @ApiProperty({ description: 'Human-readable tenant name.', example: 'Alpha Tenant' })
  @IsString()
  name!: string

  @ApiPropertyOptional({
    description: 'Optional root org display name. When omitted the tenant name is reused.',
    example: 'Alpha Root'
  })
  @IsOptional()
  @IsString()
  rootOrgName?: string
}
