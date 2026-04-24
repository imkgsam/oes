import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString } from 'class-validator'

// Defines the payload used to create one org node under the selected tenant org tree.
export class CreateOrgUnitDto {
  @ApiProperty({ description: 'Parent org unit identifier.', example: 'org-root-1' })
  @IsString()
  parentOrgId!: string

  @ApiProperty({ description: 'Org node display name.', example: 'Manufacturing' })
  @IsString()
  name!: string

  @ApiProperty({ description: 'Org node type.', example: 'DEPARTMENT' })
  @IsString()
  type!: string

  @ApiPropertyOptional({ description: 'Optional sibling sort order.', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @ApiPropertyOptional({
    description: 'Optional organization party identifier for ROOT or BRANCH nodes.',
    example: '5f9624d9-294c-4b9b-ae72-4d9f8b8a7b73'
  })
  @IsOptional()
  @IsString()
  organizationPartyId?: string
}
