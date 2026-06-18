import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString } from 'class-validator'

// Defines mutable org node fields exposed to the shared org structure page.
export class UpdateOrgUnitDto {
  @ApiPropertyOptional({ description: 'Updated org node display name.', example: 'Manufacturing Updated' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Updated org node type.', example: 'DEPARTMENT' })
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional({ description: 'Updated sibling sort order.', example: 11 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @ApiPropertyOptional({
    description: 'Set one organization TenantParty id, or pass null to clear the current association.',
    example: '5f9624d9-294c-4b9b-ae72-4d9f8b8a7b73',
    nullable: true
  })
  @IsOptional()
  @IsString()
  organizationTenantPartyId?: string | null
}
