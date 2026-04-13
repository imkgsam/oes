import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

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
