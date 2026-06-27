import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested
} from 'class-validator'

// BrowserActivityPolicyUpdateDto carries tenant policy fields while tenant/operator context comes from the session.
export class BrowserActivityPolicyUpdateDto {
  @IsBoolean()
  enabled!: boolean

  @IsInt()
  @Max(365)
  @Min(30)
  rawRetentionDays!: number

  @IsInt()
  @Max(1095)
  @Min(90)
  aggregateRetentionDays!: number
}

// BrowserActivityEmployeeAuditGrantUpdateDto carries one account-level collection grant toggle.
export class BrowserActivityEmployeeAuditGrantUpdateDto {
  @IsBoolean()
  enabled!: boolean
}

// BrowserActivityEmployeeAuditGrantQueryDto carries account ids for grant reads.
export class BrowserActivityEmployeeAuditGrantQueryDto {
  @IsOptional()
  accountIds?: string | string[]
}

// BrowserActivityPeriodQueryDto carries the browser monitoring time-window filter.
export class BrowserActivityPeriodQueryDto {
  @IsIn(['LAST_1_HOUR', 'LAST_1_DAY', 'LAST_1_WEEK', 'LAST_1_MONTH', 'LAST_7_DAYS', 'LAST_30_DAYS'])
  @IsOptional()
  period?: string
}

// BrowserActivityEmployeeScopedQueryDto carries optional employee scoping for aggregate reads.
export class BrowserActivityEmployeeScopedQueryDto extends BrowserActivityPeriodQueryDto {
  @IsOptional()
  @IsString()
  employeeAccountId?: string
}

// BrowserActivityUrlSearchQueryDto carries URL search filters for sensitive URL detail reads.
export class BrowserActivityUrlSearchQueryDto extends BrowserActivityPeriodQueryDto {
  @IsString()
  keyword!: string
}

// BrowserActivityOnlinePresenceQueryDto carries online-status filters for the tenant workbench.
export class BrowserActivityOnlinePresenceQueryDto {
  @IsIn(['ALL', 'ONLINE', 'STALE', 'OFFLINE'])
  @IsOptional()
  status?: string

  @IsInt()
  @IsOptional()
  @Max(10080)
  @Min(1)
  @Type(() => Number)
  includeOfflineWithinMinutes?: number
}

// BrowserActivityVisitSessionDto carries privacy-bounded extension visit summaries.
export class BrowserActivityVisitSessionDto {
  @IsString()
  clientVisitId!: string

  @IsString()
  extensionSessionId!: string

  @IsString()
  mergeKey!: string

  @IsUrl({ require_tld: false })
  url!: string

  @IsString()
  domain!: string

  @IsOptional()
  @IsString()
  pageTitle?: string

  @IsString()
  startedAt!: string

  @IsString()
  endedAt!: string

  @IsString()
  lastFlushedAt!: string

  @IsInt()
  @Min(0)
  dwellDurationSeconds!: number

  @IsInt()
  @Min(0)
  activeDurationSeconds!: number

  @IsInt()
  @Min(0)
  idleDurationSeconds!: number

  @IsInt()
  @Min(0)
  foregroundDurationSeconds!: number
}

// AppendBrowserActivityVisitSessionsDto carries one extension flush batch.
export class AppendBrowserActivityVisitSessionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrowserActivityVisitSessionDto)
  sessions!: BrowserActivityVisitSessionDto[]
}

// BrowserActivityHeartbeatDto carries one extension liveness report.
export class BrowserActivityHeartbeatDto {
  @IsString()
  extensionSessionId!: string

  @IsString()
  observedAt!: string
}
