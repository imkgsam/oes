import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Defines the payload for creating a global role template.
export class CreateRoleTemplateDto {
  @ApiProperty({
    description: 'Human-readable role template name.',
    example: 'Tenant Admin Template'
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'Stable role template code.',
    example: 'TENANT_ADMIN_TEMPLATE'
  })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiPropertyOptional({
    description: 'Human-readable role template description.'
  })
  @IsOptional()
  @IsString()
  description?: string
}
