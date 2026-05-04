import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

/** RetryTenantOnboardingDto carries optional operator context for retrying a failed onboarding run. */
export class RetryTenantOnboardingDto {
  @ApiPropertyOptional({ example: 'Retry after permission-service became available' })
  @IsOptional()
  @IsString()
  reason?: string
}
