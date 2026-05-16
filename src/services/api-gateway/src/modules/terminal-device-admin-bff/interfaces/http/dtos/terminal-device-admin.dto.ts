import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsISO8601, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export const ADMIN_TERMINAL_DEVICE_TYPES = ['PDA', 'TOUCH_PANEL'] as const
export const ADMIN_TERMINAL_DEVICE_STATUSES = [
  'ACTIVE',
  'DECOMMISSIONED',
  'DISABLED',
  'LOST',
  'MAINTENANCE',
  'PENDING_APPROVAL'
] as const
export const ADMIN_ENROLLMENT_STATUSES = ['EXPIRED', 'ISSUED', 'REVOKED', 'USED'] as const
export const ADMIN_PRESENCE_STATUSES = ['OFFLINE', 'ONLINE', 'UNKNOWN'] as const

// Carries administrator input for creating a one-time terminal enrollment.
export class CreateTerminalDeviceEnrollmentDto {
  @ApiProperty({ enum: ADMIN_TERMINAL_DEVICE_TYPES })
  @IsIn(ADMIN_TERMINAL_DEVICE_TYPES)
  terminalDeviceType!: 'PDA' | 'TOUCH_PANEL'

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  displayName!: string

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  expectedManufacturerSerial?: string | null

  @ApiProperty()
  @IsISO8601()
  expiresAt!: string

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  notes?: string | null
}

// Carries enrollment list filters from tenant-web.
export class ListTerminalDeviceEnrollmentsQueryDto {
  @ApiPropertyOptional({ enum: ADMIN_ENROLLMENT_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_ENROLLMENT_STATUSES)
  status?: 'EXPIRED' | 'ISSUED' | 'REVOKED' | 'USED'

  @ApiPropertyOptional({ enum: ADMIN_TERMINAL_DEVICE_TYPES })
  @IsOptional()
  @IsIn(ADMIN_TERMINAL_DEVICE_TYPES)
  terminalDeviceType?: 'PDA' | 'TOUCH_PANEL'

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number
}

// Carries an administrator reason for revoking an unused enrollment.
export class RevokeTerminalDeviceEnrollmentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(512)
  reason!: string
}

// Carries terminal device list filters from tenant-web.
export class ListTerminalDevicesQueryDto {
  @ApiPropertyOptional({ enum: ADMIN_TERMINAL_DEVICE_TYPES })
  @IsOptional()
  @IsIn(ADMIN_TERMINAL_DEVICE_TYPES)
  terminalDeviceType?: 'PDA' | 'TOUCH_PANEL'

  @ApiPropertyOptional({ enum: ADMIN_TERMINAL_DEVICE_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_TERMINAL_DEVICE_STATUSES)
  status?: typeof ADMIN_TERMINAL_DEVICE_STATUSES[number]

  @ApiPropertyOptional({ enum: ADMIN_PRESENCE_STATUSES })
  @IsOptional()
  @IsIn(ADMIN_PRESENCE_STATUSES)
  presenceStatus?: 'OFFLINE' | 'ONLINE' | 'UNKNOWN'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number
}

// Carries non-lifecycle terminal device display edits.
export class UpdateTerminalDeviceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  displayName?: string

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  notes?: string | null
}

// Carries one administrator lifecycle status transition request.
export class ChangeTerminalDeviceStatusDto {
  @ApiProperty({ enum: ADMIN_TERMINAL_DEVICE_STATUSES })
  @IsIn(ADMIN_TERMINAL_DEVICE_STATUSES)
  targetStatus!: typeof ADMIN_TERMINAL_DEVICE_STATUSES[number]

  @ApiProperty()
  @IsString()
  @MaxLength(512)
  reason!: string
}

// Carries version policy lookup filters from tenant-web.
export class TerminalDeviceVersionPolicyQueryDto {
  @ApiProperty({ enum: ADMIN_TERMINAL_DEVICE_TYPES })
  @IsIn(ADMIN_TERMINAL_DEVICE_TYPES)
  terminalDeviceType!: 'PDA' | 'TOUCH_PANEL'
}

// Carries tenant-level terminal app version policy updates.
export class UpdateTerminalDeviceVersionPolicyDto {
  @ApiProperty({ enum: ADMIN_TERMINAL_DEVICE_TYPES })
  @IsIn(ADMIN_TERMINAL_DEVICE_TYPES)
  terminalDeviceType!: 'PDA' | 'TOUCH_PANEL'

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  minSupportedAppVersion!: string

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  latestAppVersion!: string

  @ApiProperty()
  @IsBoolean()
  upgradeRequired!: boolean

  @ApiProperty()
  @IsBoolean()
  upgradeRecommended!: boolean

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  apkDownloadUrl?: string | null

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  releaseNotesUrl?: string | null

  @ApiProperty()
  @IsString()
  @MaxLength(512)
  reason!: string
}

// Carries audit event list pagination from tenant-web.
export class TerminalDeviceAuditEventsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number
}
