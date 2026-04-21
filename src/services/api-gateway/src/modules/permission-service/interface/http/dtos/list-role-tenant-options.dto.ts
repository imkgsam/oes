import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

// Captures the read-only tenant directory filters used by role creation selectors.
export class ListRoleTenantOptionsDto {
  @ApiPropertyOptional({
    description: 'Optional keyword matched against tenant name or code.',
    example: 'alpha'
  })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({
    description: 'Maximum tenant options returned to the selector.',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number
}
