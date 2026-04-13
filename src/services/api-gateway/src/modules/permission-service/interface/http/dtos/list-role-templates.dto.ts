import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

// Captures the supported filters for the unified role template list endpoint.
export class ListRoleTemplatesDto {
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
    description: 'Search keyword matched against role template code or name.',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  keyword?: string
}
