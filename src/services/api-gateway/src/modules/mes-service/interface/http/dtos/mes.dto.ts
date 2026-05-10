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
  commandId?: string
  effectiveFrom?: string
  effectiveTo?: string
  @Allow()
  itemRef!: unknown
  name!: string
  orgId?: string
  reason?: string
  revisionCode?: string
  specCode!: string
  supersedesProductionSpecId?: string
}

/** ActivateProductionSpecDto captures the explicit ProductionSpec activation payload. */
export class ActivateProductionSpecDto {
  activatedAt?: string
  commandId?: string
  expectedVersion?: number
  orgId?: string
  reason?: string
}

/** UpdateProductionSpecDto captures the current ProductionSpec update payload. */
export class UpdateProductionSpecDto {
  commandId?: string
  effectiveFrom?: string
  effectiveTo?: string
  expectedVersion?: number
  @Allow()
  itemRef?: unknown
  name?: string
  orgId?: string
  reason?: string
}

/** RetireProductionSpecDto captures the current ProductionSpec retirement payload. */
export class RetireProductionSpecDto {
  commandId?: string
  expectedVersion?: number
  orgId?: string
  reason?: string
  replacementProductionSpecId?: string
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
  commandId?: string
  defaultLifeLimit?: string
  defaultLifeUnit?: string
  designCode!: string
  functionRole!: string
  itemRef?: unknown
  materialType!: string
  name!: string
  orgId?: string
  outputStructureType!: string
  @Allow()
  outputs!: unknown[]
  productionMethodTags?: string[]
  @Allow()
  productionSpecRefs?: unknown[]
  reason?: string
  revisionCode?: string
  supersedesMoldDesignId?: string
}

/** RegisterMasterMoldDto captures the current MasterMold registration payload. */
export class RegisterMasterMoldDto {
  commandId?: string
  @Allow()
  initialCarrierResourceRef?: unknown
  @Allow()
  initialStorageResourceRef?: unknown
  masterMoldCode!: string
  moldDesignId!: string
  notes?: string
  orgId?: string
  @Allow()
  purchaseRef?: unknown
  qualitySummary?: string
  reason?: string
  receivedAt?: string
  @Allow()
  supplierRef?: unknown
}

/** RegisterProductionMoldDto captures the current ProductionMold registration payload. */
export class RegisterProductionMoldDto {
  acceptedAt?: string
  commandId?: string
  @Allow()
  initialCarrierResourceRef?: unknown
  @Allow()
  initialStorageResourceRef?: unknown
  moldCode!: string
  moldDesignId!: string
  orgId?: string
  @Allow()
  purchaseRef?: unknown
  reason?: string
  receivedAt?: string
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
  commandId?: string
  movedAt?: string
  movementReason?: string
  orgId?: string
  @Allow()
  toCarrierResourceRef?: unknown
  @Allow()
  toStorageResourceRef?: unknown
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
  commandId?: string
  orgId?: string
  reason?: string
  unmountedAt?: string
}

/** ScrapProductionMoldDto captures one production mold scrap command payload. */
export class ScrapProductionMoldDto {
  commandId?: string
  orgId?: string
  reason?: string
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
  captureSource?: string
  checked?: boolean
  lifeDelta?: string
  lifeUnit?: string
  moldDesignOutputId?: string
  moldDesignOutputOptionId?: string
  productionMoldId!: string
  productionSpecRef?: unknown
  productionUnitRef?: unknown
  reason?: string
  toolingInstallationId!: string
  traceSubjectRef?: unknown
  usageQuantity?: string
  workCenterRef?: unknown
  workUnitRef?: unknown
}

/** RecordDailyMoldUsageBatchDto captures one idempotent web-stage checkbox batch submission. */
export class RecordDailyMoldUsageBatchDto {
  batchCommandId!: string
  @Allow()
  items!: DailyMoldUsageBatchItemDto[]
  orgId?: string
  reason?: string
  usedAt?: string
  @Allow()
  workCenterRef!: unknown
}
