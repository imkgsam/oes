import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

// Captures the supported filters for the unified role instance list endpoint.
export class ListRolesDto {
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
    description: 'Tenant filter for tenant-scoped role instances.',
    example: 'tenant-id'
  })
  @IsOptional()
  @IsString()
  tenantId?: string

  @ApiPropertyOptional({
    description: 'Role scope filter.',
    enum: ['SYSTEM', 'TENANT']
  })
  @IsOptional()
  @IsIn(['SYSTEM', 'TENANT'])
  scopeLevel?: string

  @ApiPropertyOptional({
    description: 'Search keyword matched against role code or name.',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  keyword?: string
}
