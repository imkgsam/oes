import {
  MoldDesignRecord,
  MoldDesignSummaryRecord,
  ProductionMoldRecord,
  ProductionMoldSummaryRecord,
  ToolingInstallationStatus,
  ToolingPlacementSummaryRecord,
  ToolingPlacementType
} from '../../domain/models/mes-mold-records'

/** toMoldDesignSummary converts one full mold design into the compact selector shape. */
export function toMoldDesignSummary(record: MoldDesignRecord): MoldDesignSummaryRecord {
  return {
    moldDesignId: record.moldDesignId,
    designCode: record.designCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    status: record.status
  }
}

/** toProductionMoldSummary converts one full production mold into the compact selector shape. */
export function toProductionMoldSummary(
  record: ProductionMoldRecord,
  moldDesignSummary: MoldDesignSummaryRecord
): ProductionMoldSummaryRecord {
  return {
    productionMoldId: record.productionMoldId,
    moldCode: record.moldCode,
    moldDesignSummary,
    currentStatus: record.currentStatus,
    currentPlacementSummary: toToolingPlacementSummary(record),
    lifeCounterSummary: record.lifeCounterSummary ?? null
  }
}

/** toToolingPlacementSummary derives the current placement projection from one production mold. */
export function toToolingPlacementSummary(record: ProductionMoldRecord): ToolingPlacementSummaryRecord | null {
  const installation = record.currentInstallationSummary
  if (installation?.status === ToolingInstallationStatus.ACTIVE) {
    return {
      placementType: installation.workUnitRef ? ToolingPlacementType.WORK_UNIT : ToolingPlacementType.WORK_CENTER,
      workCenterRef: installation.workCenterRef,
      workUnitRef: installation.workUnitRef ?? null,
      toolingInstallationId: installation.toolingInstallationId,
      moldInstallationDetail: installation.moldDetail ?? null
    }
  }
  if (record.currentCarrierResourceRef) {
    return {
      placementType: ToolingPlacementType.CARRIER_RESOURCE,
      carrierResourceRef: record.currentCarrierResourceRef
    }
  }
  if (record.currentStorageResourceRef) {
    return {
      placementType: ToolingPlacementType.STORAGE_RESOURCE,
      storageResourceRef: record.currentStorageResourceRef
    }
  }
  return null
}
