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

const SUPPLIER_OFFERING_STATUS_VALUES = ['ACTIVE', 'INACTIVE'] as const
const SUPPLIER_STATUS_VALUES = ['ACTIVE', 'INACTIVE'] as const

/** SearchSuppliersDto defines the optional supplier directory filters exposed through the SRM BFF. */
export class SearchSuppliersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ enum: SUPPLIER_STATUS_VALUES })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantPartyId?: string

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

/** ListSupplierOfferingsDto defines the optional offering paging filters for supplier or item scoped reads. */
export class ListSupplierOfferingsDto {
  @ApiPropertyOptional({ enum: SUPPLIER_OFFERING_STATUS_VALUES })
  @IsOptional()
  @IsString()
  status?: string

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

/** CreateSupplierProfileDto defines the frozen phase 1 supplier-shell creation fields accepted by the BFF. */
export class CreateSupplierProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierNo?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierCategory?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

/** UpdateSupplierProfileBasicsDto defines the mutable basics fields for one existing supplier shell. */
export class UpdateSupplierProfileBasicsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierNo?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierCategory?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

/** BindSupplierToTenantPartyDto defines the single phase 1 formal binding target. */
export class BindSupplierToTenantPartyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tenantPartyId!: string
}

/** UpsertSupplierContactDto defines the create-or-update payload for one SRM business contact. */
export class UpsertSupplierContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierContactId?: string

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

/** UpsertSupplierAddressDto defines the create-or-update payload for one SRM business address. */
export class UpsertSupplierAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierAddressId?: string

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

/** UpsertSupplierOfferingDto defines the create-or-update payload for one SRM supplier offering fact. */
export class UpsertSupplierOfferingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierOfferingId?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @ApiProperty({ enum: SUPPLIER_OFFERING_STATUS_VALUES })
  @IsString()
  @IsNotEmpty()
  status!: string
}

/** ChangeSupplierStatusDto defines the minimal explicit lifecycle mutation accepted by the BFF. */
export class ChangeSupplierStatusDto {
  @ApiProperty({ enum: SUPPLIER_STATUS_VALUES })
  @IsString()
  @IsNotEmpty()
  status!: string
}
