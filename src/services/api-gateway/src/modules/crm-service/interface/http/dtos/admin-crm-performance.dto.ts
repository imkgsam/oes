import { IsIn, IsOptional, IsString } from 'class-validator'

// Carries tenant-web admin CRM performance filters while tenant/operator context comes from the session.
export class AdminCrmPerformanceOverviewDto {
  @IsOptional()
  @IsString()
  employeeAccountId?: string

  @IsIn(['LAST_7_DAYS', 'LAST_30_DAYS'])
  @IsOptional()
  period?: string

  @IsOptional()
  @IsString()
  sourceType?: string
}
