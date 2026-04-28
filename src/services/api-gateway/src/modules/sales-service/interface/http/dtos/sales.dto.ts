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
  Min,
  ValidateNested
} from 'class-validator'

const QUOTE_STATUS_VALUES = ['DRAFT', 'PUBLISHED'] as const

/** SearchQuotesDto defines the optional quote directory filters exposed through the sales BFF. */
export class SearchQuotesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerTenantPartyId?: string

  @ApiPropertyOptional({ enum: QUOTE_STATUS_VALUES })
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

/** ListQuoteVersionsDto defines the paging inputs for one quote's published version history. */
export class ListQuoteVersionsDto {
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

/** SearchSalesOrdersDto defines the optional sales-order directory filters exposed through the sales BFF. */
export class SearchSalesOrdersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerTenantPartyId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteVersionId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  productionGate?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  stockingGate?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  shippingGate?: boolean

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

/** OpportunityRefDto defines the optional CRM opportunity summary carried by quote create and draft update commands. */
export class OpportunityRefDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  opportunityId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  opportunityNo?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  opportunityName?: string
}

/** ItemSnapshotDto defines the manual phase 1 item summary typed into one quote line. */
export class ItemSnapshotDto {
  @ApiProperty()
  @IsString()
  itemCode!: string

  @ApiProperty()
  @IsString()
  itemName!: string
}

/** SalesConfigSnapshotDto defines the manual phase 1 sales configuration summary typed into one quote line. */
export class SalesConfigSnapshotDto {
  @ApiProperty()
  @IsString()
  salesUom!: string

  @ApiProperty()
  @IsString()
  salesUnitLabel!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string
}

/** PackagingRequirementSnapshotDto defines the manual phase 1 packaging requirement summary typed into one quote line. */
export class PackagingRequirementSnapshotDto {
  @ApiProperty()
  @IsString()
  packageMode!: string

  @ApiProperty()
  @IsString()
  packageLabel!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string
}

/** PriceQuantityDeliverySnapshotDto defines the manual phase 1 price, quantity, and delivery summary typed into one quote line. */
export class PriceQuantityDeliverySnapshotDto {
  @ApiProperty()
  @IsString()
  currencyCode!: string

  @ApiProperty()
  @IsString()
  unitPrice!: string

  @ApiProperty()
  @IsString()
  quantity!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryTerm?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestedDeliveryDate?: string
}

/** CustomerItemSnapshotDto defines the optional customer-facing sku, model, and label summary typed into one quote line. */
export class CustomerItemSnapshotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerSku?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerModel?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerDisplayName?: string
}

/** QuoteLineInputDto defines one manual phase 1 quote line input accepted by the BFF. */
export class QuoteLineInputDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lineNo!: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @ApiProperty({ type: ItemSnapshotDto })
  @ValidateNested()
  @Type(() => ItemSnapshotDto)
  itemSnapshot!: ItemSnapshotDto

  @ApiProperty({ type: SalesConfigSnapshotDto })
  @ValidateNested()
  @Type(() => SalesConfigSnapshotDto)
  salesConfigSnapshot!: SalesConfigSnapshotDto

  @ApiProperty({ type: PackagingRequirementSnapshotDto })
  @ValidateNested()
  @Type(() => PackagingRequirementSnapshotDto)
  packagingRequirementSnapshot!: PackagingRequirementSnapshotDto

  @ApiProperty({ type: PriceQuantityDeliverySnapshotDto })
  @ValidateNested()
  @Type(() => PriceQuantityDeliverySnapshotDto)
  priceQuantityDeliverySnapshot!: PriceQuantityDeliverySnapshotDto

  @ApiProperty({ type: CustomerItemSnapshotDto })
  @ValidateNested()
  @Type(() => CustomerItemSnapshotDto)
  customerItemSnapshot!: CustomerItemSnapshotDto
}

/** CreateQuoteDto defines the minimum quote draft creation payload exposed through the sales BFF. */
export class CreateQuoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerTenantPartyId!: string

  @ApiPropertyOptional({ type: OpportunityRefDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OpportunityRefDto)
  opportunityRef?: OpportunityRefDto

  @ApiPropertyOptional({ type: [QuoteLineInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineInputDto)
  draftLines?: QuoteLineInputDto[]
}

/** QuoteDraftMutationDto defines the mutable quote draft shape accepted by the sales BFF. */
export class QuoteDraftMutationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerTenantPartyId!: string

  @ApiPropertyOptional({ type: OpportunityRefDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OpportunityRefDto)
  opportunityRef?: OpportunityRefDto

  @ApiProperty({ type: [QuoteLineInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineInputDto)
  lines!: QuoteLineInputDto[]
}

/** UpdateQuoteDraftDto wraps one quote draft mutation command payload. */
export class UpdateQuoteDraftDto {
  @ApiProperty({ type: QuoteDraftMutationDto })
  @ValidateNested()
  @Type(() => QuoteDraftMutationDto)
  draftMutation!: QuoteDraftMutationDto
}

/** AuditReasonDto defines the optional free-form audit reason accepted on explicit management commands. */
export class AuditReasonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  auditReason?: string
}
