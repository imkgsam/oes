import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

// Defines the target tenant lifecycle status mutation accepted by the gateway tenant page.
export class UpdateTenantStatusDto {
  @ApiProperty({ description: 'Target tenant lifecycle status.', enum: ['ACTIVE', 'ARCHIVED', 'SUSPENDED'] })
  @IsIn(['ACTIVE', 'ARCHIVED', 'SUSPENDED'])
  status!: string

  @ApiPropertyOptional({ description: 'Optional operator reason recorded with the status transition.' })
  @IsOptional()
  @IsString()
  reason?: string
}
