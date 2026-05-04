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

/** PriceSnapshotDto defines the optional frozen pricing source snapshot carried on quote and order lines. */
export class PriceSnapshotDto {
  @ApiProperty()
  @IsString()
  currencyCode!: string

  @ApiProperty()
  @IsString()
  unitPriceAmount!: string

  @ApiProperty()
  @IsString()
  sourceType!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceRefId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceLineRefId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceVersionNo?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolvedAt?: string
}

/** MoqSnapshotDto defines the optional frozen MOQ source snapshot carried on quote and order lines. */
export class MoqSnapshotDto {
  @ApiProperty()
  @IsString()
  moqQuantity!: string

  @ApiProperty()
  @IsString()
  quantityUomCode!: string

  @ApiProperty()
  @IsString()
  sourceType!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceRefId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceLineRefId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceVersionNo?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolvedAt?: string
}

/** ExchangeRateSnapshotDto defines the optional finance-owned FX snapshot frozen on the sales side. */
export class ExchangeRateSnapshotDto {
  @ApiProperty()
  @IsString()
  fromCurrencyCode!: string

  @ApiProperty()
  @IsString()
  toCurrencyCode!: string

  @ApiProperty()
  @IsString()
  exchangeRateValue!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  financeRateRef?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  snapshottedAt?: string
}

/** ExceptionPlaceholderDto defines the optional pricing exception placeholder surface displayed by tenant-web. */
export class ExceptionPlaceholderDto {
  @ApiProperty()
  @IsString()
  exceptionType!: string

  @ApiProperty()
  @IsString()
  status!: string

  @ApiProperty()
  @IsString()
  baselineSourceType!: string

  @ApiProperty()
  @IsString()
  baselineValue!: string

  @ApiProperty()
  @IsString()
  actualValue!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currencyCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantityUomCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detectedAt?: string
}

/** PriceQuantityDeliverySnapshotDto defines the manual phase 1 price, quantity, delivery, and pricing preview summary typed into one quote line. */
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

  @ApiPropertyOptional({ type: PriceSnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceSnapshotDto)
  priceSnapshot?: PriceSnapshotDto

  @ApiPropertyOptional({ type: MoqSnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoqSnapshotDto)
  moqSnapshot?: MoqSnapshotDto

  @ApiPropertyOptional({ type: ExchangeRateSnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExchangeRateSnapshotDto)
  exchangeRateSnapshot?: ExchangeRateSnapshotDto

  @ApiPropertyOptional({ type: [ExceptionPlaceholderDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExceptionPlaceholderDto)
  exceptionPlaceholders?: ExceptionPlaceholderDto[]
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

/** SearchPriceListsDto defines the optional price-list catalog filters exposed through the sales pricing BFF. */
export class SearchPriceListsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priceListType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currencyCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveAt?: string

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

/** GetPriceListLinesDto defines the optional line paging and item filter inputs for one price list. */
export class GetPriceListLinesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemId?: string

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

/** GetActiveCustomerPriceAgreementDto defines the required customer and currency lookup inputs for the active agreement read. */
export class GetActiveCustomerPriceAgreementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerTenantPartyId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currencyCode!: string
}

/** GetCustomerPriceAgreementDto defines the optional version selector for one agreement family read. */
export class GetCustomerPriceAgreementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  versionNo?: number
}

/** ListCustomerPriceAgreementVersionsDto defines the paging inputs for one agreement family's version directory. */
export class ListCustomerPriceAgreementVersionsDto {
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

/** PreviewQuoteLinePricingDto defines the non-mutating quote-line pricing preview payload exposed through the sales pricing BFF. */
export class PreviewQuoteLinePricingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerTenantPartyId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandKey?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currencyCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  requestedQuantity!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantityUomCode!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selectedPriceListId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manualUnitPriceAmount?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pricingAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exchangeRateTargetCurrencyCode?: string
}

/** PriceListLineInputDto defines one price-list or agreement line edit row accepted by the sales pricing BFF. */
export class PriceListLineInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandKey?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unitPriceAmount!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moqQuantity!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantityUomCode!: string
}

/** CreatePriceListDto defines the price-list creation payload exposed through the sales pricing BFF. */
export class CreatePriceListDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  priceListName!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  priceListType!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currencyCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  effectiveFrom!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveTo?: string

  @ApiPropertyOptional({ type: [PriceListLineInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListLineInputDto)
  initialLines?: PriceListLineInputDto[]
}

/** UpdatePriceListDto defines the mutable header fields accepted by the sales pricing BFF for one price list. */
export class UpdatePriceListDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priceListName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveFrom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveTo?: string
}

/** ReplacePriceListLinesDto defines the whole-table line replacement payload for one price list. */
export class ReplacePriceListLinesDto {
  @ApiProperty({ type: [PriceListLineInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListLineInputDto)
  lines!: PriceListLineInputDto[]
}

/** ChangePriceListStatusDto defines the target lifecycle status requested for one price list. */
export class ChangePriceListStatusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetStatus!: string
}

/** CustomerPriceAgreementLineRemovalDto defines one draft removal selector accepted by the sales pricing BFF. */
export class CustomerPriceAgreementLineRemovalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandKey?: string
}

/** CustomerPriceAgreementDraftMutationDto defines the draft mutation envelope for one customer agreement family. */
export class CustomerPriceAgreementDraftMutationDto {
  @ApiProperty({ type: [PriceListLineInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListLineInputDto)
  upserts!: PriceListLineInputDto[]

  @ApiProperty({ type: [CustomerPriceAgreementLineRemovalDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerPriceAgreementLineRemovalDto)
  removals!: CustomerPriceAgreementLineRemovalDto[]
}

/** CreateCustomerPriceAgreementDto defines the agreement draft creation payload exposed through the sales pricing BFF. */
export class CreateCustomerPriceAgreementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerTenantPartyId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currencyCode!: string

  @ApiPropertyOptional({ type: [PriceListLineInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListLineInputDto)
  initialLines?: PriceListLineInputDto[]
}

/** UpdateCustomerPriceAgreementDraftDto wraps one customer agreement draft mutation payload. */
export class UpdateCustomerPriceAgreementDraftDto {
  @ApiProperty({ type: CustomerPriceAgreementDraftMutationDto })
  @ValidateNested()
  @Type(() => CustomerPriceAgreementDraftMutationDto)
  draftMutation!: CustomerPriceAgreementDraftMutationDto
}

/** AuditReasonDto defines the optional free-form audit reason accepted on explicit management commands. */
export class AuditReasonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  auditReason?: string
}
