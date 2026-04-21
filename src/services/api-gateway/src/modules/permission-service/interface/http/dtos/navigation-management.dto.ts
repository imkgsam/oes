import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator'

// Captures list filters for managed navigation entry registry records.
export class ListNavigationEntriesDto {
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

  @ApiPropertyOptional({ description: 'Search keyword matched against entry key or name.' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: 'Feature key filter.' })
  @IsOptional()
  @IsString()
  featureKey?: string

  @ApiPropertyOptional({ description: 'Terminal filter.', example: 'WEB' })
  @IsOptional()
  @IsString()
  terminal?: string

  @ApiPropertyOptional({ description: 'Enabled-state filter.' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  enabled?: boolean
}

// Defines the payload for creating one managed navigation entry registry record.
export class CreateNavigationEntryDto {
  @ApiProperty({ description: 'Stable navigation entry key.', example: 'workbench.home' })
  @IsString()
  @IsNotEmpty()
  entryKey: string

  @ApiProperty({ description: 'Human-readable entry name.' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiPropertyOptional({ description: 'Human-readable entry description.' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Feature or plugin capability key.' })
  @IsOptional()
  @IsString()
  featureKey?: string

  @ApiProperty({ description: 'Supported terminals.', example: ['WEB'] })
  @IsArray()
  @IsString({ each: true })
  supportedTerminals: string[]

  @ApiProperty({ description: 'Registry fallback priority.', example: 100 })
  @IsInt()
  registryPriority: number

  @ApiProperty({ description: 'Whether the entry is globally enabled.' })
  @IsBoolean()
  enabled: boolean

  @ApiProperty({ description: 'Entry type for management classification.', example: 'page' })
  @IsString()
  @IsNotEmpty()
  entryType: string
}

// Defines the payload for updating mutable navigation entry metadata.
export class UpdateNavigationEntryDto {
  @ApiPropertyOptional({ description: 'Human-readable entry name.' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Human-readable entry description.' })
  @IsOptional()
  @IsString()
  description?: string | null

  @ApiPropertyOptional({ description: 'Feature or plugin capability key.' })
  @IsOptional()
  @IsString()
  featureKey?: string | null

  @ApiPropertyOptional({ description: 'Supported terminals.', example: ['WEB'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedTerminals?: string[]

  @ApiPropertyOptional({ description: 'Registry fallback priority.', example: 100 })
  @IsOptional()
  @IsInt()
  registryPriority?: number

  @ApiPropertyOptional({ description: 'Whether the entry is globally enabled.' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: 'Entry type for management classification.', example: 'page' })
  @IsOptional()
  @IsString()
  entryType?: string
}

// Defines one role navigation visibility row in a full replacement payload.
export class RoleNavigationVisibilityDto {
  @ApiProperty({ description: 'Navigation entry key.', example: 'workbench.home' })
  @IsString()
  @IsNotEmpty()
  entryKey: string

  @ApiProperty({ description: 'Terminal.', example: 'WEB' })
  @IsString()
  @IsNotEmpty()
  terminal: string

  @ApiProperty({ description: 'Whether this role can see the entry in this scope and terminal.' })
  @IsBoolean()
  enabled: boolean
}

// Defines the full replacement payload for role navigation visibility.
export class SetRoleNavigationVisibilityDto {
  @ApiProperty({ type: [RoleNavigationVisibilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleNavigationVisibilityDto)
  visibility: RoleNavigationVisibilityDto[]
}

// Defines one role landing policy row in a full replacement payload.
export class RoleLandingPolicyDto {
  @ApiProperty({ description: 'Terminal.', example: 'WEB' })
  @IsString()
  @IsNotEmpty()
  terminal: string

  @ApiProperty({ description: 'Default navigation entry key.', example: 'workbench.home' })
  @IsString()
  @IsNotEmpty()
  defaultEntryKey: string

  @ApiProperty({ description: 'Priority used when multiple role policies match.', example: 100 })
  @IsInt()
  priority: number

  @ApiProperty({ description: 'Whether this landing policy is enabled.' })
  @IsBoolean()
  enabled: boolean
}

// Defines the full replacement payload for role landing policies.
export class SetRoleLandingPoliciesDto {
  @ApiProperty({ type: [RoleLandingPolicyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleLandingPolicyDto)
  landingPolicies: RoleLandingPolicyDto[]
}

// Defines a resolver preview request for visible entries and default landing selection.
export class ResolveNavigationPreviewDto {
  @ApiProperty({ description: 'Role ids to preview together.' })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[]

  @ApiProperty({ description: 'Scope level.', example: 'TENANT' })
  @IsString()
  @IsNotEmpty()
  scopeLevel: string

  @ApiProperty({ description: 'Terminal.', example: 'WEB' })
  @IsString()
  @IsNotEmpty()
  terminal: string
}
