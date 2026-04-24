import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ChangePrimaryEmploymentDto {
  @ApiProperty()
  @IsString()
  fromEmploymentId!: string

  @ApiProperty()
  @IsString()
  toOrgUnitId!: string

  @ApiProperty()
  @IsString()
  effectiveFrom!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endedReason?: string
}
