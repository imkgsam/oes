import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator'

// Defines the query filters accepted by the admin online-user overview endpoint.
export class AdminOnlineUserQueryDto {
  @ApiPropertyOptional({ description: 'Optional lightweight text filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  query?: string

  @ApiPropertyOptional({
    description: 'Optional tenant filter. Tenant-bound operators may only use their own tenant.',
    maxLength: 128
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantId?: string

  @ApiPropertyOptional({ description: 'Optional opaque cursor for pagination.', maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string

  @ApiPropertyOptional({ description: 'Optional page size override.', minimum: 1, maximum: 200, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number
}

// Defines the query filters accepted by the admin user-search endpoint.
export class AdminUserSearchQueryDto {
  @ApiProperty({ description: 'Required keyword matched against userId, email, or phone.', maxLength: 256 })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  keyword!: string

  @ApiPropertyOptional({ description: 'Optional result limit override.', minimum: 1, maximum: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number
}

// Defines the filters accepted by the administrator account directory endpoint.
export class AdminAccountDirectoryQueryDto {
  @ApiPropertyOptional({ description: 'Optional free-text keyword matched against account and user identifiers.', maxLength: 256 })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  keyword?: string

  @ApiPropertyOptional({ description: 'Optional scope filter.', enum: ['SYSTEM', 'TENANT'] })
  @IsOptional()
  @IsIn(['SYSTEM', 'TENANT'])
  scopeLevel?: string

  @ApiPropertyOptional({ description: 'Optional enabled-state filter.', enum: ['ENABLED', 'DISABLED'] })
  @IsOptional()
  @IsIn(['ENABLED', 'DISABLED'])
  status?: string

  @ApiPropertyOptional({ description: 'Optional 1-based page number.', minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ description: 'Optional page size override.', minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}

// Defines the tenant-option selector query accepted by account creation flows.
export class AdminTenantOptionQueryDto {
  @ApiPropertyOptional({ description: 'Optional tenant keyword matched against code or name.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  keyword?: string

  @ApiPropertyOptional({ description: 'Optional result limit override.', minimum: 1, maximum: 50, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number
}

// Defines the payload accepted when an administrator creates one human account.
export class CreateAdminAccountDto {
  @ApiProperty({ enum: ['SYSTEM', 'TENANT'] })
  @IsIn(['SYSTEM', 'TENANT'])
  scopeLevel!: 'SYSTEM' | 'TENANT'

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantId?: string

  @ApiProperty({ maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  displayName!: string

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  username?: string

  @ApiPropertyOptional({ maxLength: 256 })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  email?: string

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  initialRoleIds?: string[]
}

// Defines the payload accepted when an administrator updates one account basic-info profile.
export class UpdateAdminAccountBasicInfoDto {
  @ApiProperty({ maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  displayName!: string

  @ApiPropertyOptional({ maxLength: 256 })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  email?: string

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string

  @ApiPropertyOptional({ description: 'Optional enabled-state mutation merged into the admin profile update flow.' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean
}

// Defines the payload used when an administrator revokes one concrete session.
export class AdminRevokeSessionDto {
  @ApiProperty({
    description: 'Operator-supplied reason recorded alongside the administrative session revocation.',
    maxLength: 512,
    example: 'Suspicious sign-in detected'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  reason: string
}

// Defines the payload used when an administrator requires one account user to set a new password.
export class AdminRequirePasswordSetupDto {
  @ApiPropertyOptional({
    description: 'Operator-visible reason recorded in the auth audit event.',
    maxLength: 512,
    example: '管理员要求重设密码'
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  reason?: string

  @ApiPropertyOptional({
    description: 'Whether active sessions should be revoked after requiring password setup.'
  })
  @IsOptional()
  @IsBoolean()
  revokeSessions?: boolean
}

// Defines the payload used when an administrator enables or disables one login method.
export class AdminLoginMethodStateMutationDto {
  @ApiPropertyOptional({
    description: 'Operator-visible reason recorded in the auth audit event.',
    maxLength: 512
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  reason?: string
}

// Defines the query string filters accepted by the auth audit list endpoint.
export class AdminAuditEventQueryDto {
  @ApiPropertyOptional({ description: 'Optional downstream service name filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  service?: string

  @ApiPropertyOptional({ description: 'Optional downstream module name filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  module?: string

  @ApiPropertyOptional({ description: 'Optional audit event type filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  eventType?: string

  @ApiPropertyOptional({ description: 'Optional audit result filter.', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  result?: string

  @ApiPropertyOptional({ description: 'Optional operator identifier filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  operatorId?: string

  @ApiPropertyOptional({ description: 'Optional tenant filter. Tenant-bound operators may only query their own tenant.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantId?: string

  @ApiPropertyOptional({ description: 'Optional organization filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  orgId?: string

  @ApiPropertyOptional({ description: 'Optional resource type filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  resourceType?: string

  @ApiPropertyOptional({ description: 'Optional resource identifier filter.', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  resourceId?: string

  @ApiPropertyOptional({ description: 'Optional inclusive lower bound for the audit occurrence time.', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  occurredAtFrom?: string

  @ApiPropertyOptional({ description: 'Optional inclusive upper bound for the audit occurrence time.', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  occurredAtTo?: string

  @ApiPropertyOptional({ description: 'Optional opaque cursor for pagination.', maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string

  @ApiPropertyOptional({ description: 'Optional page size override.', minimum: 1, maximum: 200, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number
}

export class AdminTenantMfaFactorPolicyDto {
  @ApiProperty({ enum: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'] })
  @IsIn(['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'])
  factor!: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priority!: number
}

export class AdminTenantMfaPolicyMutationDto {
  @ApiProperty()
  @IsBoolean()
  loginRequired!: boolean

  @ApiProperty({ type: AdminTenantMfaFactorPolicyDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminTenantMfaFactorPolicyDto)
  factors!: AdminTenantMfaFactorPolicyDto[]
}
