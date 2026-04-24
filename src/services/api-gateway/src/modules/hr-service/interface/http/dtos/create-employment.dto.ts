import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateEmploymentDto {
  @ApiProperty()
  @IsString()
  orgUnitId!: string

  @ApiProperty()
  @IsString()
  effectiveFrom!: string
}
