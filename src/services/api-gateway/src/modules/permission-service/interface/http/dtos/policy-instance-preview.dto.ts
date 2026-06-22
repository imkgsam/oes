import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString } from 'class-validator'

export type PolicyInstancePreviewMode = 'CHECK_RESOURCE' | 'QUERY_SCOPE'
export type PolicyInstanceSubjectSelectorType = 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE'
export type PolicyInstanceEffect = 'ALLOW' | 'DENY'

export class PolicyInstancePreviewSubjectDto {
  @ApiProperty()
  @IsString()
  accountId!: string

  @ApiProperty()
  @IsString()
  tenantId!: string

  @ApiProperty({ type: [String] })
  @IsArray()
  roleIds!: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  roleCodes?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  orgIds?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  visibleOrgIds?: string[]
}

export class PolicyInstanceSubjectSelectorDto {
  @ApiProperty({ enum: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'] })
  @IsIn(['ACCOUNT', 'ROLE', 'TENANT_WIDE'])
  type!: PolicyInstanceSubjectSelectorType

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string
}

export class PolicyInstanceParamsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  field?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allowedValues?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceField?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectField?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerField?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgField?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  cidrs?: string[]
}

export class PolicyInstancePreviewCandidateDto {
  @ApiProperty()
  @IsString()
  id!: string

  @ApiProperty()
  @IsString()
  tenantId!: string

  @ApiProperty()
  @IsObject()
  subjectSelector!: PolicyInstanceSubjectSelectorDto

  @ApiProperty()
  @IsString()
  permissionCode!: string

  @ApiProperty()
  @IsString()
  resourceType!: string

  @ApiProperty()
  @IsString()
  templateCode!: string

  @ApiProperty({ enum: ['ALLOW', 'DENY'] })
  @IsIn(['ALLOW', 'DENY'])
  effect!: PolicyInstanceEffect

  @ApiProperty()
  @IsObject()
  params!: PolicyInstanceParamsDto

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  priority?: number
}

export class ResourceFactsPreviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  factoryId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workshopId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workCenterId?: string
}

export class EvaluatePolicyInstancePreviewDto {
  @ApiProperty({ enum: ['CHECK_RESOURCE', 'QUERY_SCOPE'] })
  @IsIn(['CHECK_RESOURCE', 'QUERY_SCOPE'])
  mode!: PolicyInstancePreviewMode

  @ApiProperty()
  @IsObject()
  subject!: PolicyInstancePreviewSubjectDto

  @ApiProperty()
  @IsString()
  permissionCode!: string

  @ApiProperty()
  @IsString()
  resourceType!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  resource?: ResourceFactsPreviewDto

  @ApiProperty({ type: [PolicyInstancePreviewCandidateDto] })
  @IsArray()
  policyInstances!: PolicyInstancePreviewCandidateDto[]
}
