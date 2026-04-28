import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

const CUSTOMER_STATUS_VALUES = ['ACTIVE_CUSTOMER', 'BLOCKED', 'ARCHIVED'] as const

/** SearchCustomerAccountsDto defines the optional customer directory filters exposed through the CRM BFF. */
export class SearchCustomerAccountsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ enum: CUSTOMER_STATUS_VALUES })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryTenantPartyId?: string

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}

/** SearchSelectableCustomersDto defines the optional selector filters exposed through the CRM BFF. */
export class SearchSelectableCustomersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}

/** CreateCustomerAccountDto defines the frozen phase 1 account-shell creation fields accepted by the BFF. */
export class CreateCustomerAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerCategory?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

/** UpdateCustomerAccountBasicsDto defines the mutable basics fields for one existing account shell. */
export class UpdateCustomerAccountBasicsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerCategory?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

/** BindCustomerAccountToTenantPartyDto defines the single phase 1 primary binding target. */
export class BindCustomerAccountToTenantPartyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tenantPartyId!: string
}

/** UpsertCustomerContactDto defines the create-or-update payload for one CRM business contact. */
export class UpsertCustomerContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerContactId?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleTitle?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimaryContact?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean
}

/** UpsertCustomerAddressDto defines the create-or-update payload for one CRM business address. */
export class UpsertCustomerAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddressId?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  countryCode!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locality?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  addressLine1!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimaryAddress?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean
}

/** ChangeCustomerStatusDto defines the minimal explicit lifecycle mutation accepted by the BFF. */
export class ChangeCustomerStatusDto {
  @ApiProperty({ enum: CUSTOMER_STATUS_VALUES })
  @IsString()
  @IsNotEmpty()
  status!: string
}
