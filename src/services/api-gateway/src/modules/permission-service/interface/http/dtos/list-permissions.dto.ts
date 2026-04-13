import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

// Captures the supported filters for the unified permission dictionary list endpoint.
export class ListPermissionsDto {
  @ApiPropertyOptional({
    description: 'Filter permissions by owning service or module.',
    example: 'PERMISSION_SERVICE'
  })
  @IsOptional()
  @IsString()
  module?: string

  @ApiPropertyOptional({
    description: 'Search keyword matched against permission code or description.',
    example: 'role'
  })
  @IsOptional()
  @IsString()
  keyword?: string

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
}
