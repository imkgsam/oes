import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class EndEmploymentDto {
  @ApiProperty()
  @IsString()
  effectiveTo!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endedReason?: string
}
