import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { Allow, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

/** toOptionalBoolean converts common query-string boolean values while leaving absent values untouched. */
function toOptionalBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (value === true || value === 'true') {
    return true
  }
  if (value === false || value === 'false') {
    return false
  }
  return value
}

/** toOptionalStringArray accepts repeated query params or comma-separated lists. */
function toOptionalStringArray({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return undefined
}

/** ListProductionSpecsDto captures the supported ProductionSpec directory filters for the MES mold workspace. */
export class ListProductionSpecsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  includeRetired?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgId?: string

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string
}

/** CreateProductionSpecDto captures the current ProductionSpec creation payload. */
export class CreateProductionSpecDto {
  @Allow()
  commandId?: string
  @Allow()
  effectiveFrom?: string
  @Allow()
  effectiveTo?: string
  @Allow()
  itemRef!: unknown
  @Allow()
  name!: string
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
  @Allow()
  revisionCode?: string
  @Allow()
  specCode!: string
  @Allow()
  supersedesProductionSpecId?: string
}

/** ActivateProductionSpecDto captures the explicit ProductionSpec activation payload. */
export class ActivateProductionSpecDto {
  @Allow()
  activatedAt?: string
  @Allow()
  commandId?: string
  @Allow()
  expectedVersion?: number
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
}

/** UpdateProductionSpecDto captures the current ProductionSpec update payload. */
export class UpdateProductionSpecDto {
  @Allow()
  commandId?: string
  @Allow()
  effectiveFrom?: string
  @Allow()
  effectiveTo?: string
  @Allow()
  expectedVersion?: number
  @Allow()
  itemRef?: unknown
  @Allow()
  name?: string
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
}

/** RetireProductionSpecDto captures the current ProductionSpec retirement payload. */
export class RetireProductionSpecDto {
  @Allow()
  commandId?: string
  @Allow()
  expectedVersion?: number
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
  @Allow()
  replacementProductionSpecId?: string
  @Allow()
  retiredAt?: string
}

/** ListMoldDesignsDto captures the supported MoldDesign directory filters for the MES mold workspace. */
export class ListMoldDesignsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgId?: string

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionSpecId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string
}

/** RegisterMoldDesignDto captures the current MoldDesign registration payload. */
export class RegisterMoldDesignDto {
  @Allow()
  commandId?: string
  @Allow()
  defaultLifeLimit?: string
  @Allow()
  defaultLifeUnit?: string
  @Allow()
  designCode!: string
  @Allow()
  functionRole!: string
  @Allow()
  itemRef?: unknown
  @Allow()
  materialType!: string
  @Allow()
  name!: string
  @Allow()
  orgId?: string
  @Allow()
  outputStructureType!: string
  @Allow()
  outputs!: unknown[]
  @Allow()
  productionMethodTags?: string[]
  @Allow()
  productionSpecRefs?: unknown[]
  @Allow()
  reason?: string
  @Allow()
  revisionCode?: string
  @Allow()
  supersedesMoldDesignId?: string
}

/** RegisterMasterMoldDto captures the current MasterMold registration payload. */
export class RegisterMasterMoldDto {
  @Allow()
  commandId?: string
  @Allow()
  initialCarrierResourceRef?: unknown
  @Allow()
  initialStorageResourceRef?: unknown
  @Allow()
  masterMoldCode!: string
  @Allow()
  moldDesignId!: string
  @Allow()
  notes?: string
  @Allow()
  orgId?: string
  @Allow()
  purchaseRef?: unknown
  @Allow()
  qualitySummary?: string
  @Allow()
  reason?: string
  @Allow()
  receivedAt?: string
  @Allow()
  supplierRef?: unknown
}

/** RegisterProductionMoldDto captures the current ProductionMold registration payload. */
export class RegisterProductionMoldDto {
  @Allow()
  acceptedAt?: string
  @Allow()
  commandId?: string
  @Allow()
  initialCarrierResourceRef?: unknown
  @Allow()
  initialStorageResourceRef?: unknown
  @Allow()
  moldCode!: string
  @Allow()
  moldDesignId!: string
  @Allow()
  orgId?: string
  @Allow()
  purchaseRef?: unknown
  @Allow()
  reason?: string
  @Allow()
  receivedAt?: string
  @Allow()
  sourceMasterMoldId?: string
  @Allow()
  supplierRef?: unknown
}

/** ListProductionMoldsByDesignDto captures production mold directory filters for one MoldDesign. */
export class ListProductionMoldsByDesignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgId?: string

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string
}

/** ListProductionMoldsDto captures tenant-wide production mold directory filters. */
export class ListProductionMoldsDto extends ListProductionMoldsByDesignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierResourceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  moldDesignId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageResourceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warningLevel?: string
}

/** MoveToolingDto captures one storage or carrier placement command. */
export class MoveToolingDto {
  @Allow()
  commandId?: string
  @Allow()
  movedAt?: string
  @Allow()
  movementReason?: string
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
  @Allow()
  toCarrierResourceRef?: unknown
  @Allow()
  toStorageResourceRef?: unknown
  @Allow()
  toolingType?: string
}

/** InstallToolingDto captures one tooling installation payload. */
export class InstallToolingDto {
  @Allow()
  cavityMapping?: string
  @Allow()
  cavityPosition?: string
  @Allow()
  commandId?: string
  @Allow()
  installedAt?: string
  @Allow()
  moldPosition?: string
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
  @Allow()
  setupParameters?: string
  @Allow()
  toolingType?: string
  @Allow()
  workCenterRef!: unknown
  @Allow()
  workUnitRef?: unknown
}

/** UnmountToolingDto captures one tooling unmount payload. */
export class UnmountToolingDto {
  @Allow()
  commandId?: string
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
  @Allow()
  unmountedAt?: string
}

/** ScrapProductionMoldDto captures one production mold scrap command payload. */
export class ScrapProductionMoldDto {
  @Allow()
  commandId?: string
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
  @Allow()
  scrappedAt?: string
}

/** ListCurrentMoldsByWorkCenterDto captures current work-center mold visualization filters. */
export class ListCurrentMoldsByWorkCenterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workUnitId?: string
}

/** ListMoldLifeCountersDto captures life counter directory filters. */
export class ListMoldLifeCountersDto extends ListProductionMoldsByDesignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productionMoldId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warningLevel?: string
}

/** GetMoldUsageHistoryDto captures chronological mold history filters. */
export class GetMoldUsageHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgId?: string

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string
}

/** PrintDailyMoldChecklistDto captures the web-stage daily mold checklist query. */
export class PrintDailyMoldChecklistDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  checklistDate!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgId?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workCenterId!: string
}

/** DailyMoldUsageBatchItemDto captures one checkbox row selected for manual usage recording. */
export class DailyMoldUsageBatchItemDto {
  @Allow()
  captureSource?: string
  @Allow()
  checked?: boolean
  @Allow()
  lifeDelta?: string
  @Allow()
  lifeUnit?: string
  @Allow()
  moldDesignOutputId?: string
  @Allow()
  moldDesignOutputOptionId?: string
  @Allow()
  productionMoldId!: string
  @Allow()
  productionSpecRef?: unknown
  @Allow()
  productionUnitRef?: unknown
  @Allow()
  reason?: string
  @Allow()
  toolingInstallationId!: string
  @Allow()
  traceSubjectRef?: unknown
  @Allow()
  usageQuantity?: string
  @Allow()
  workCenterRef?: unknown
  @Allow()
  workUnitRef?: unknown
}

/** RecordDailyMoldUsageBatchDto captures one idempotent web-stage checkbox batch submission. */
export class RecordDailyMoldUsageBatchDto {
  @Allow()
  batchCommandId!: string
  @Allow()
  items!: DailyMoldUsageBatchItemDto[]
  @Allow()
  orgId?: string
  @Allow()
  reason?: string
  @Allow()
  usedAt?: string
  @Allow()
  workCenterRef!: unknown
}
