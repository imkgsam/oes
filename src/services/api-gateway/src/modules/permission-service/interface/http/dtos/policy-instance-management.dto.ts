import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator'
import {
  PolicyInstanceEffect,
  PolicyInstanceParamsDto,
  PolicyInstanceSubjectSelectorDto
} from './policy-instance-preview.dto'

// Captures readonly filters for PolicyInstance governance list queries.
export class ListPolicyInstancesDto {
  @ApiPropertyOptional({ description: 'One-based page number.', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ description: 'Page size.', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number

  @ApiPropertyOptional({ description: 'Tenant id filter.' })
  @IsOptional()
  @IsString()
  tenantId?: string

  @ApiPropertyOptional({ description: 'Permission code filter.' })
  @IsOptional()
  @IsString()
  permissionCode?: string

  @ApiPropertyOptional({ description: 'Resource type filter.' })
  @IsOptional()
  @IsString()
  resourceType?: string

  @ApiPropertyOptional({ description: 'Built-in template code filter.' })
  @IsOptional()
  @IsString()
  templateCode?: string

  @ApiPropertyOptional({ enum: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'] })
  @IsOptional()
  @IsIn(['ACCOUNT', 'ROLE', 'TENANT_WIDE'])
  subjectSelectorType?: 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE'

  @ApiPropertyOptional({ description: 'Account id or role id for subject selector filtering.' })
  @IsOptional()
  @IsString()
  subjectSelectorValue?: string

  @ApiPropertyOptional({ description: 'Enabled-state filter.' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  enabled?: boolean
}

// Captures one template-based PolicyInstance create command without exposing legacy conditionAstJson.
export class CreatePolicyInstanceDto {
  @ApiPropertyOptional({ description: 'Tenant id that owns the authorization fact.' })
  @IsString()
  tenantId!: string

  @ApiPropertyOptional({ description: 'Account, role, or tenant-wide subject selector.' })
  @IsObject()
  subjectSelector!: PolicyInstanceSubjectSelectorDto

  @ApiPropertyOptional({ description: 'Permission code guarded by this policy instance.' })
  @IsString()
  permissionCode!: string

  @ApiPropertyOptional({ description: 'Business resource type guarded by this policy instance.' })
  @IsOptional()
  @IsString()
  resourceType?: string

  @ApiPropertyOptional({ description: 'Built-in template code.' })
  @IsString()
  templateCode!: string

  @ApiPropertyOptional({ enum: ['ALLOW', 'DENY'] })
  @IsIn(['ALLOW', 'DENY'])
  effect!: PolicyInstanceEffect

  @ApiPropertyOptional({ description: 'Template params validated in permission-service.' })
  @IsObject()
  params!: PolicyInstanceParamsDto

  @ApiPropertyOptional({ description: 'Initial enabled state.' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: 'Evaluation priority.' })
  @IsOptional()
  @IsInt()
  priority?: number
}

// Captures an explicit PolicyInstance enabled-state change.
export class SetPolicyInstanceEnabledDto {
  @ApiPropertyOptional({ description: 'Whether this PolicyInstance is active.' })
  @IsBoolean()
  enabled!: boolean
}
