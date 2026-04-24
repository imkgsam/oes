import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

// Captures supported filters for the system-admin tenant list endpoint.
export class ListTenantsDto {
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

  @ApiPropertyOptional({ description: 'Search keyword matched against tenant code or name.' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: 'Tenant lifecycle status filter.', enum: ['ACTIVE', 'ARCHIVED', 'SUSPENDED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED', 'SUSPENDED'])
  status?: string
}
