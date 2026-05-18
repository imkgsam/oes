import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class CreateEmploymentDto {
  @ApiProperty()
  @IsString()
  orgUnitId!: string

  @ApiProperty()
  @IsString()
  effectiveFrom!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionName?: string
}
