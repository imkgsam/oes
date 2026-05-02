import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsOptional, IsString, Matches, ValidateNested } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TenantOnboardingTenantDto {
  @ApiProperty({ example: 'tenant.alpha' })
  @IsString()
  code!: string

  @ApiProperty({ example: 'Alpha Tenant' })
  @IsString()
  name!: string
}

export class TenantOnboardingIdentifierDto {
  @ApiProperty({ example: 'BUSINESS_REG_NO' })
  @IsString()
  identifierType!: string

  @ApiPropertyOptional({ example: 'US-001' })
  @IsOptional()
  @IsString()
  rawValue?: string

  @ApiProperty({ example: 'US-001' })
  @IsString()
  normalizedValue!: string

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  issuerCountryOrRegion?: string
}

export class TenantOnboardingOrganizationPartyDto {
  @ApiProperty({ example: 'Alpha Inc.' })
  @IsString()
  legalName!: string

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  registeredCountry?: string

  @ApiPropertyOptional({ type: [TenantOnboardingIdentifierDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TenantOnboardingIdentifierDto)
  identifiers?: TenantOnboardingIdentifierDto[]
}

export class TenantOnboardingRootOrgDto {
  @ApiProperty({ example: 'Alpha Root' })
  @IsString()
  name!: string
}

export class TenantOnboardingFirstAdminDto {
  @ApiProperty({ example: 'Alice Admin' })
  @IsString()
  displayName!: string

  @ApiPropertyOptional({ example: 'alice@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ example: '+14155550100' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{5,19}$/)
  phone?: string

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requirePasswordSetup?: boolean
}

/** CreateTenantOnboardingDto collects the full system-admin tenant opening payload for the gateway BFF. */
export class CreateTenantOnboardingDto {
  @ApiProperty({ example: 'ui-generated-uuid-or-request-id' })
  @IsString()
  idempotencyKey!: string

  @ApiProperty({ type: TenantOnboardingTenantDto })
  @ValidateNested()
  @Type(() => TenantOnboardingTenantDto)
  tenant!: TenantOnboardingTenantDto

  @ApiProperty({ type: TenantOnboardingOrganizationPartyDto })
  @ValidateNested()
  @Type(() => TenantOnboardingOrganizationPartyDto)
  organizationParty!: TenantOnboardingOrganizationPartyDto

  @ApiProperty({ type: TenantOnboardingRootOrgDto })
  @ValidateNested()
  @Type(() => TenantOnboardingRootOrgDto)
  rootOrg!: TenantOnboardingRootOrgDto

  @ApiProperty({ type: TenantOnboardingFirstAdminDto })
  @ValidateNested()
  @Type(() => TenantOnboardingFirstAdminDto)
  firstAdmin!: TenantOnboardingFirstAdminDto
}
