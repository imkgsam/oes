import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator'

const ITEM_CAPABILITY_VALUES = [
  'sellable',
  'purchasable',
  'stockable',
  'manufacturable',
  'assemblable',
  'transformable',
  'packable',
  'packaged'
] as const
const ITEM_MODEL_KIND_VALUES = ['PHYSICAL', 'SERVICE', 'DIGITAL', 'VIRTUAL'] as const
const ITEM_MODEL_TYPE_VALUES = [
  'FINISHED_PRODUCT',
  'SEMI_FINISHED_PRODUCT',
  'ACCESSORY',
  'PART',
  'SUB_ASSEMBLY',
  'RAW_MATERIAL',
  'PACKAGING_MATERIAL',
  'SERVICE',
  'VIRTUAL_KIT'
] as const
const ITEM_STATUS_VALUES = ['ACTIVE', 'INACTIVE'] as const
const ITEM_TYPE_VALUES = ['STANDARD', 'PACKAGED_FINISHED_GOOD'] as const
const BOM_TYPE_VALUES = ['COMPOSITION', 'TRANSFORMATION', 'PACKAGING'] as const
const BOM_LINE_ROLE_VALUES = ['PRIMARY_INPUT', 'COMPONENT', 'PACKAGING_MATERIAL'] as const

/** normalizeQueryStringArray turns repeated or comma-separated query params into a compact string array. */
function normalizeQueryStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const normalized = (Array.isArray(value) ? value : [value])
    .flatMap((item) => `${item}`.split(','))
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length > 0 ? [...new Set(normalized)] : undefined
}

/** ItemCapabilitiesDto carries the full V2 item capability snapshot used by the BFF. */
export class ItemCapabilitiesDto {
  @ApiProperty()
  @IsBoolean()
  sellable!: boolean

  @ApiProperty()
  @IsBoolean()
  purchasable!: boolean

  @ApiProperty()
  @IsBoolean()
  stockable!: boolean

  @ApiProperty()
  @IsBoolean()
  manufacturable!: boolean

  @ApiProperty()
  @IsBoolean()
  assemblable!: boolean

  @ApiProperty()
  @IsBoolean()
  transformable!: boolean

  @ApiProperty()
  @IsBoolean()
  packable!: boolean

  @ApiProperty()
  @IsBoolean()
  packaged!: boolean
}

/** ListItemModelsDto defines the tenant-scoped model directory filters accepted by item-management. */
export class ListItemModelsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ enum: ITEM_MODEL_KIND_VALUES })
  @IsOptional()
  @IsIn(ITEM_MODEL_KIND_VALUES)
  modelKind?: string

  @ApiPropertyOptional({ enum: ITEM_MODEL_TYPE_VALUES })
  @IsOptional()
  @IsIn(ITEM_MODEL_TYPE_VALUES)
  modelType?: string

  @ApiPropertyOptional({ enum: ITEM_CAPABILITY_VALUES, isArray: true })
  @IsOptional()
  @Transform(({ value }) => normalizeQueryStringArray(value))
  @IsArray()
  @IsIn(ITEM_CAPABILITY_VALUES, { each: true })
  capabilities?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDescendants?: boolean

  @ApiPropertyOptional({ enum: ITEM_STATUS_VALUES })
  @IsOptional()
  @IsIn(ITEM_STATUS_VALUES)
  status?: string

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number
}

/** CreateItemModelDto defines the V2 model-level creation payload. */
export class CreateItemModelDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modelCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modelName!: string

  @ApiProperty({ enum: ITEM_MODEL_KIND_VALUES })
  @IsIn(ITEM_MODEL_KIND_VALUES)
  modelKind!: string

  @ApiProperty({ enum: ITEM_MODEL_TYPE_VALUES })
  @IsIn(ITEM_MODEL_TYPE_VALUES)
  modelType!: string

  @ApiPropertyOptional({ type: ItemCapabilitiesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemCapabilitiesDto)
  capabilities?: ItemCapabilitiesDto

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryCategoryId?: string
}

/** UpdateItemModelBasicsDto restricts model editing to code and name only. */
export class UpdateItemModelBasicsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modelCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modelName!: string
}

/** SetItemModelCapabilitiesDto wraps the full model capability replacement payload. */
export class SetItemModelCapabilitiesDto {
  @ApiProperty({ type: ItemCapabilitiesDto })
  @ValidateNested()
  @Type(() => ItemCapabilitiesDto)
  capabilities!: ItemCapabilitiesDto
}

/** SetItemModelPrimaryCategoryDto defines the model-level primary category assignment payload. */
export class SetItemModelPrimaryCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryCategoryId?: string
}

/** ChangeStatusDto defines active/archive mutations exposed by the BFF. */
export class ChangeStatusDto {
  @ApiProperty({ enum: ITEM_STATUS_VALUES })
  @IsIn(ITEM_STATUS_VALUES)
  status!: string
}

/** ListItemsDto defines the tenant-scoped executable Item directory filters. */
export class ListItemsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemModelId?: string

  @ApiPropertyOptional({ enum: ITEM_TYPE_VALUES })
  @IsOptional()
  @IsIn(ITEM_TYPE_VALUES)
  itemType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packagingSpecId?: string

  @ApiPropertyOptional({ enum: ITEM_CAPABILITY_VALUES, isArray: true })
  @IsOptional()
  @Transform(({ value }) => normalizeQueryStringArray(value))
  @IsArray()
  @IsIn(ITEM_CAPABILITY_VALUES, { each: true })
  capabilities?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDescendants?: boolean

  @ApiPropertyOptional({ enum: ITEM_STATUS_VALUES })
  @IsOptional()
  @IsIn(ITEM_STATUS_VALUES)
  status?: string

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number
}

/** CreateItemDto defines the V2 executable Item creation payload. */
export class CreateItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemModelId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName!: string

  @ApiProperty({ enum: ITEM_TYPE_VALUES })
  @IsIn(ITEM_TYPE_VALUES)
  itemType!: string

  @ApiPropertyOptional({ isArray: true, type: String })
  @IsOptional()
  @Transform(({ value }) => normalizeQueryStringArray(value))
  @IsArray()
  @IsString({ each: true })
  lockedAttributeOptionIds?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packagingSpecId?: string

  @ApiPropertyOptional({ type: ItemCapabilitiesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemCapabilitiesDto)
  capabilities?: ItemCapabilitiesDto
}

/** UpdateItemBasicsDto restricts executable Item editing to code and name only. */
export class UpdateItemBasicsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName!: string
}

/** SetItemCapabilitiesDto wraps the full item capability replacement payload. */
export class SetItemCapabilitiesDto {
  @ApiProperty({ type: ItemCapabilitiesDto })
  @ValidateNested()
  @Type(() => ItemCapabilitiesDto)
  capabilities!: ItemCapabilitiesDto
}

/** ListItemCategoriesDto defines the optional tree-layer selector accepted by category endpoints. */
export class ListItemCategoriesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentCategoryId?: string
}

/** CreateItemCategoryDto defines the minimal category creation payload exposed through item-management. */
export class CreateItemCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentCategoryId?: string
}

/** UpdateItemCategoryBasicsDto restricts category editing to code and name only. */
export class UpdateItemCategoryBasicsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryName!: string
}

/** BomLineDto defines one V2 BOM line input. */
export class BomLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  componentItemId!: string

  @ApiProperty({ enum: BOM_LINE_ROLE_VALUES })
  @IsIn(BOM_LINE_ROLE_VALUES)
  lineRole!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantity!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  uomCode!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lineNote?: string
}

/** ListBomsDto defines the BOM directory filters exposed by item-management. */
export class ListBomsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ enum: BOM_TYPE_VALUES })
  @IsOptional()
  @IsIn(BOM_TYPE_VALUES)
  bomType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outputItemId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  componentItemId?: string

  @ApiPropertyOptional({ enum: ITEM_STATUS_VALUES })
  @IsOptional()
  @IsIn(ITEM_STATUS_VALUES)
  status?: string

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number
}

/** CreateBomDto defines the V2 BOM creation payload. */
export class CreateBomDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bomCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bomName!: string

  @ApiProperty({ enum: BOM_TYPE_VALUES })
  @IsIn(BOM_TYPE_VALUES)
  bomType!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  outputItemId!: string

  @ApiProperty({ type: [BomLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomLineDto)
  lines!: BomLineDto[]
}

/** UpdateBomBasicsDto restricts BOM editing to code and name only. */
export class UpdateBomBasicsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bomCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bomName!: string
}

/** ReplaceBomLinesDto wraps the full-replace V2 BOM line payload. */
export class ReplaceBomLinesDto {
  @ApiProperty({ type: [BomLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomLineDto)
  lines!: BomLineDto[]
}

/** ListSupplierMappingsDto defines optional paging inputs for one item's supplier mappings list. */
export class ListSupplierMappingsDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number
}

/** UpsertSupplierItemMappingDto defines the supplier mapping command payload. */
export class UpsertSupplierItemMappingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  supplierId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierItemCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierItemName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean
}
