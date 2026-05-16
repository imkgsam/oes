import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'

// Carries normalized PDA device identity supplied by the Android Shell.
export class PdaHeartbeatDeviceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  deviceId!: string

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  idSource!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  fallbackAppDeviceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  manufacturer?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceModel?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  androidVersion?: string

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  appVersion!: string
}

// Carries volatile PDA runtime state for diagnostics and future device management.
export class PdaHeartbeatRuntimeDto {
  @ApiProperty({ enum: ['ONLINE', 'OFFLINE'] })
  @IsIn(['ONLINE', 'OFFLINE'])
  networkStatus!: 'ONLINE' | 'OFFLINE'

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevel?: number

  @ApiProperty({ enum: ['FOREGROUND', 'BACKGROUND', 'LOGIN', 'LOGOUT', 'SESSION_RESTORED'] })
  @IsIn(['FOREGROUND', 'BACKGROUND', 'LOGIN', 'LOGOUT', 'SESSION_RESTORED'])
  appState!: 'FOREGROUND' | 'BACKGROUND' | 'LOGIN' | 'LOGOUT' | 'SESSION_RESTORED'
}

// Carries the current PDA session summary when the app has an authenticated session.
export class PdaHeartbeatSessionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  accountId!: string

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantId?: string | null

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  sessionId!: string
}

// Defines the Phase 1 PDA heartbeat request accepted before or after login.
export class PdaHeartbeatDto {
  @ApiProperty({ type: PdaHeartbeatDeviceDto })
  @ValidateNested()
  @Type(() => PdaHeartbeatDeviceDto)
  device!: PdaHeartbeatDeviceDto

  @ApiProperty({ type: PdaHeartbeatRuntimeDto })
  @ValidateNested()
  @Type(() => PdaHeartbeatRuntimeDto)
  runtime!: PdaHeartbeatRuntimeDto

  @ApiPropertyOptional({ type: PdaHeartbeatSessionDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PdaHeartbeatSessionDto)
  session?: PdaHeartbeatSessionDto | null

  @ApiProperty()
  @IsISO8601()
  clientTime!: string
}

// Carries one manually uploaded PDA diagnostic event from the local device buffer.
export class PdaDiagnosticLogEntryDto {
  @ApiProperty()
  @IsISO8601()
  clientTime!: string

  @ApiProperty({ enum: ['INFO', 'WARN', 'ERROR'] })
  @IsIn(['INFO', 'WARN', 'ERROR'])
  level!: 'INFO' | 'WARN' | 'ERROR'

  @ApiProperty()
  @IsString()
  @MaxLength(96)
  eventType!: string

  @ApiProperty()
  @IsString()
  @MaxLength(512)
  message!: string

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  traceId?: string | null

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestId?: string | null

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  errorCode?: string | null

  @ApiProperty()
  @IsBoolean()
  diagnosticMode!: boolean

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>
}

// Defines the Phase 1 manual PDA diagnostic upload request accepted before or after login.
export class PdaDeviceLogsDto {
  @ApiProperty({ type: PdaHeartbeatDeviceDto })
  @ValidateNested()
  @Type(() => PdaHeartbeatDeviceDto)
  device!: PdaHeartbeatDeviceDto

  @ApiPropertyOptional({ type: PdaHeartbeatSessionDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PdaHeartbeatSessionDto)
  session?: PdaHeartbeatSessionDto | null

  @ApiProperty({ type: [PdaDiagnosticLogEntryDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PdaDiagnosticLogEntryDto)
  logs!: PdaDiagnosticLogEntryDto[]
}
