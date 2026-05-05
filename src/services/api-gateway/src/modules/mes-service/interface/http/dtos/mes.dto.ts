/** ListManufacturingSpecsDto captures the supported ManufacturingSpec directory filters for the MES mold workspace. */
export class ListManufacturingSpecsDto {
  includeRetired?: boolean
  itemId?: string
  keyword?: string
  orgId?: string
  page?: number
  pageSize?: number
  productFamilyRefId?: string
  status?: string
}

/** CreateManufacturingSpecDto captures the first-stage ManufacturingSpec creation payload. */
export class CreateManufacturingSpecDto {
  commandId?: string
  effectiveFrom?: string
  effectiveTo?: string
  itemRef!: unknown
  manufacturingAttributes!: unknown[]
  name!: string
  orgId?: string
  productFamilyRef!: unknown
  reason?: string
  revisionCode?: string
  routeIntentRef?: unknown
  specCode!: string
  supersedesSpecId?: string
}

/** ActivateManufacturingSpecDto captures the explicit ManufacturingSpec activation payload. */
export class ActivateManufacturingSpecDto {
  activatedAt?: string
  commandId?: string
  expectedVersion?: number
  orgId?: string
  reason?: string
}

/** UpdateManufacturingSpecDto captures the first-stage ManufacturingSpec update payload. */
export class UpdateManufacturingSpecDto {
  commandId?: string
  effectiveFrom?: string
  effectiveTo?: string
  expectedVersion?: number
  itemRef?: unknown
  manufacturingAttributes?: unknown[]
  name?: string
  orgId?: string
  productFamilyRef?: unknown
  reason?: string
  routeIntentRef?: unknown
}

/** RetireManufacturingSpecDto captures the first-stage ManufacturingSpec retirement payload. */
export class RetireManufacturingSpecDto {
  commandId?: string
  expectedVersion?: number
  orgId?: string
  reason?: string
  replacementSpecId?: string
  retiredAt?: string
}

/** ListWorkCentersDto captures the production-unit directory filters for the mold workspace. */
export class ListWorkCentersDto {
  keyword?: string
  orgId?: string
  page?: number
  pageSize?: number
  parentWorkCenterId?: string
  status?: string
  workCenterType?: string
}

/** CreateWorkCenterDto captures one production-unit creation command without exposing mold-position CRUD. */
export class CreateWorkCenterDto {
  capacityProfileId?: string
  commandId?: string
  name!: string
  orgId?: string
  parentWorkCenterId?: string
  reason?: string
  relatedMesLocationId?: string
  workCenterCode!: string
  workCenterType!: string
}

/** DeactivateWorkCenterDto captures one production-unit deactivation command. */
export class DeactivateWorkCenterDto {
  commandId?: string
  orgId?: string
  reason?: string
}

/** ListMoldDesignsDto captures the supported MoldDesign directory filters for the MES mold workspace. */
export class ListMoldDesignsDto {
  functionRole?: string
  itemId?: string
  keyword?: string
  manufacturingSpecRefId?: string
  materialType?: string
  orgId?: string
  page?: number
  pageSize?: number
  productFamilyRefId?: string
  productionMethodTag?: string
  status?: string
}

/** RegisterMoldDesignDto captures the first-stage MoldDesign registration payload. */
export class RegisterMoldDesignDto {
  commandId?: string
  defaultLifeLimit?: string
  defaultLifeUnit?: string
  designCode!: string
  functionRole!: string
  itemRef?: unknown
  manufacturingSpecRefs?: unknown[]
  materialType!: string
  name!: string
  orgId?: string
  outputStructureType!: string
  outputs!: unknown[]
  productFamilyRef!: unknown
  productionMethodTags?: string[]
  reason?: string
  revisionCode?: string
  supersedesDesignId?: string
}

/** RegisterProductionMoldInstanceDto captures the first-stage production mold registration payload. */
export class RegisterProductionMoldInstanceDto {
  acceptedAt?: string
  commandId?: string
  initialMesLocationId?: string
  initialStatus?: string
  lifeLimitValue?: string
  lifeUnit?: string
  masterMoldId?: string
  moldDesignId!: string
  moldInstanceCode!: string
  orgId?: string
  purchaseRef?: unknown
  reason?: string
  receivedAt?: string
  supplierRef?: unknown
  warningThresholdValue?: string
}

/** ListProductionMoldInstancesByDesignDto captures production mold directory filters for one MoldDesign. */
export class ListProductionMoldInstancesByDesignDto {
  orgId?: string
  page?: number
  pageSize?: number
  status?: string
  supplierId?: string
  warningLevel?: string
}

/** ListProductionMoldInstancesDto captures tenant-wide production mold directory filters. */
export class ListProductionMoldInstancesDto {
  moldDesignId?: string
  orgId?: string
  page?: number
  pageSize?: number
  status?: string
  supplierId?: string
  warningLevel?: string
}

/** MoveProductionMoldInstanceDto captures one production mold transfer payload. */
export class MoveProductionMoldInstanceDto {
  commandId?: string
  fromMesLocationId?: string
  movedAt?: string
  movementReason?: string
  orgId?: string
  toMesLocationId!: string
}

/** InstallProductionMoldInstanceDto captures one production mold installation payload. */
export class InstallProductionMoldInstanceDto {
  commandId?: string
  installedAt?: string
  operationRef?: unknown
  operationTaskRef?: unknown
  orgId?: string
  reason?: string
  resourcePositionId?: string
  routingRef?: unknown
  setupSnapshot?: string
  workCenterId!: string
  workOrderRef?: unknown
}

/** UnmountProductionMoldInstanceDto captures one production mold unmount payload. */
export class UnmountProductionMoldInstanceDto {
  commandId?: string
  moldInstallationId!: string
  nextStatus?: string
  orgId?: string
  reason?: string
  toMesLocationId?: string
  unmountedAt?: string
}

/** ScrapProductionMoldInstanceDto captures one production mold scrap command payload. */
export class ScrapProductionMoldInstanceDto {
  closeCurrentInstallation?: boolean
  commandId?: string
  orgId?: string
  scrapReason!: string
  scrappedAt?: string
  toMesLocationId?: string
}

/** ListCurrentMoldsByWorkCenterDto captures current line mold visualization filters. */
export class ListCurrentMoldsByWorkCenterDto {
  includeChildWorkCenters?: boolean
  orgId?: string
  page?: number
  pageSize?: number
  warningLevel?: string
}

/** PrintDailyMoldChecklistDto captures the web-stage daily mold checklist query. */
export class PrintDailyMoldChecklistDto {
  checklistDate?: string
  includeChildWorkCenters?: boolean
  includeRecentUsage?: boolean
  includeWarnings?: boolean
  orgId?: string
  workCenterIds?: string[] | string
}

/** DailyMoldUsageBatchItemDto captures one checkbox row selected for manual usage recording. */
export class DailyMoldUsageBatchItemDto {
  captureSource?: string
  checked?: boolean
  lifeDelta?: string
  lifeUnit?: string
  manufacturingSpecRef?: unknown
  moldDesignOutputId?: string
  moldDesignOutputOptionId?: string
  moldInstallationId!: string
  productFamilyRef?: unknown
  productionMoldInstanceId!: string
  reason?: string
  resourcePositionId!: string
  usageQuantity?: string
  workCenterId?: string
}

/** RecordDailyMoldUsageBatchDto captures one idempotent web-stage checkbox batch submission. */
export class RecordDailyMoldUsageBatchDto {
  batchCommandId!: string
  items!: DailyMoldUsageBatchItemDto[]
  orgId?: string
  reason?: string
  usedAt?: string
  workCenterId!: string
}
