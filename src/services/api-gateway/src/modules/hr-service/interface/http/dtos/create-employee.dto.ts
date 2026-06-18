import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator'

export class EmployeePartyIdentifierDto {
  @ApiProperty()
  @IsString()
  identifierType!: string

  @ApiProperty()
  @IsString()
  normalizedValue!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawValue?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuerCountryOrRegion?: string
}

export class CreateEmployeePersonDto {
  @ApiProperty()
  @IsString()
  legalName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string

  @ApiPropertyOptional({ type: EmployeePartyIdentifierDto, isArray: true })
  @IsArray()
  @IsOptional()
  identifiers?: EmployeePartyIdentifierDto[]
}

export class CreateEmployeePrimaryEmploymentDto {
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

export class CreateEmployeeAccountDto {
  @ApiProperty()
  @IsString()
  displayName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  existingUserId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string
}

export class CreateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantPartyId?: string

  @ApiPropertyOptional({ type: CreateEmployeePersonDto })
  @IsObject()
  @IsOptional()
  person?: CreateEmployeePersonDto

  @ApiPropertyOptional({ type: CreateEmployeePrimaryEmploymentDto })
  @IsObject()
  @IsOptional()
  primaryEmployment?: CreateEmployeePrimaryEmploymentDto

  @ApiPropertyOptional({ type: CreateEmployeeAccountDto })
  @IsObject()
  @IsOptional()
  account?: CreateEmployeeAccountDto
}
