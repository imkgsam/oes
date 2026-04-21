import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

// Captures the readonly filter set for policy governance list queries.
export class ListPoliciesDto {
  @ApiPropertyOptional({
    description: 'One-based page number.',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({
    description: 'Page size.',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number

  @ApiPropertyOptional({
    description: 'Search keyword matched against policy name or description.'
  })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({
    description: 'Permission code filter.',
    example: 'permission.role.update'
  })
  @IsOptional()
  @IsString()
  permissionCode?: string

  @ApiPropertyOptional({
    description: 'Tenant id filter for tenant-scoped policies.'
  })
  @IsOptional()
  @IsString()
  tenantId?: string

  @ApiPropertyOptional({
    description: 'Enabled-state filter.'
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isEnabled?: boolean
}

// Captures the optional tenant filter for permission-linked readonly policy queries.
export class ListPermissionPoliciesDto {
  @ApiPropertyOptional({
    description: 'Tenant id filter for tenant-scoped policies.'
  })
  @IsOptional()
  @IsString()
  tenantId?: string
}
