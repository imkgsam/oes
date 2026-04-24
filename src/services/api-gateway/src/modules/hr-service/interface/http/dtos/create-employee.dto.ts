import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  employeeCode!: string

  @ApiProperty()
  @IsString()
  tenantPartyId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyId?: string
}
