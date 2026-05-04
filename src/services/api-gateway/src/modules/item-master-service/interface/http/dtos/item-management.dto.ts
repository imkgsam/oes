import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
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

const ITEM_CAPABILITY_VALUES = ['sellable', 'purchasable', 'stockable', 'manufacturable'] as const
const ITEM_NATURE_VALUES = ['PHYSICAL', 'SERVICE', 'VIRTUAL'] as const
const ITEM_STATUS_VALUES = ['ACTIVE', 'INACTIVE'] as const
const ITEM_STRUCTURE_VALUES = ['SINGLE', 'BUNDLE'] as const

/** ListItemsDto defines the tenant-scoped directory filters accepted by the item-management list entry. */
export class ListItemsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDescendants?: boolean

  @ApiPropertyOptional({ enum: ITEM_CAPABILITY_VALUES })
  @IsOptional()
  @IsIn(ITEM_CAPABILITY_VALUES)
  capability?: string

  @ApiPropertyOptional({ enum: ITEM_STRUCTURE_VALUES })
  @IsOptional()
  @IsIn(ITEM_STRUCTURE_VALUES)
  structureType?: string

  @ApiPropertyOptional({ enum: ITEM_NATURE_VALUES })
  @IsOptional()
  @IsIn(ITEM_NATURE_VALUES)
  natureType?: string

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

/** CreateItemDto defines the immutable phase 1 item creation fields exposed through the BFF. */
export class CreateItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemCode!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName!: string

  @ApiProperty({ enum: ITEM_STRUCTURE_VALUES })
  @IsIn(ITEM_STRUCTURE_VALUES)
  structureType!: string

  @ApiProperty({ enum: ITEM_NATURE_VALUES })
  @IsIn(ITEM_NATURE_VALUES)
  natureType!: string
}

/** UpdateItemBasicsDto restricts the editable phase 1 basics to code and name only. */
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

/** ItemCapabilitiesDto carries the full-replace item capability snapshot used by the BFF. */
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
}

/** SetItemCapabilitiesDto wraps the full capability replacement payload for one item. */
export class SetItemCapabilitiesDto {
  @ApiProperty({ type: ItemCapabilitiesDto })
  @ValidateNested()
  @Type(() => ItemCapabilitiesDto)
  capabilities!: ItemCapabilitiesDto
}

/** ItemCompositionComponentDto defines the single permitted phase 1 bundle component input shape. */
export class ItemCompositionComponentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  componentItemId!: string
}

/** SetItemCompositionDto wraps the full-replace bundle composition submitted by the BFF. */
export class SetItemCompositionDto {
  @ApiProperty({ type: [ItemCompositionComponentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCompositionComponentDto)
  components!: ItemCompositionComponentDto[]
}

/** ListSupplierMappingsDto defines the optional paging inputs for one item's supplier mappings list. */
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

/** UpsertSupplierItemMappingDto defines the thin phase 1 supplier mapping command payload. */
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
}

/** ChangeItemStatusDto defines the item lifecycle mutation exposed by the phase 1 management entry. */
export class ChangeItemStatusDto {
  @ApiProperty({ enum: ITEM_STATUS_VALUES })
  @IsIn(ITEM_STATUS_VALUES)
  status!: string
}

/** ListItemCategoriesDto defines the optional tree-layer selector accepted by the lightweight category directory entry. */
export class ListItemCategoriesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentCategoryId?: string
}

/** CreateItemCategoryDto defines the minimal category creation payload exposed through the item-management entry. */
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

/** ChangeItemCategoryStatusDto defines the minimal category lifecycle mutation exposed by the BFF. */
export class ChangeItemCategoryStatusDto {
  @ApiProperty({ enum: ITEM_STATUS_VALUES })
  @IsIn(ITEM_STATUS_VALUES)
  status!: string
}

/** SetItemPrimaryCategoryDto defines the single-value primary-category assignment payload for one item. */
export class SetItemPrimaryCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryCategoryId?: string
}
