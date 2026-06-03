import {
  CurrentMoldByWorkCenterRecord,
  MasterMoldRecord,
  MasterMoldStatus,
  MasterMoldSummaryRecord,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  MoldDesignRecord,
  MoldDesignSummaryRecord,
  MoldDesignStatus,
  MoldLifeCounterRecord,
  MoldMovementRecord,
  MoldUsageHistoryEntryRecord,
  MoldUsageRecord,
  MoldWarningLevel,
  ProductionMoldRecord,
  ProductionMoldSummaryRecord,
  ProductionMoldStatus,
  ToolingInstallationRecord,
  ToolingPlacementSummaryRecord,
  ToolingType
} from '../models/mes-mold-records'

/** SearchMoldDesignsInput captures the contract filter set for mold design directories. */
export interface SearchMoldDesignsInput {
  tenantId: string
  orgId?: string | null
  keyword?: string
  status?: MoldDesignStatus
  productionSpecId?: string
  itemModelId?: string
  page: number
  pageSize: number
}

/** SearchProductionMoldsInput captures the contract filter set for production mold directories. */
export interface SearchProductionMoldsInput {
  tenantId: string
  orgId?: string | null
  moldDesignId?: string
  status?: ProductionMoldStatus
  storageResourceId?: string
  carrierResourceId?: string
  warningLevel?: MoldWarningLevel
  page: number
  pageSize: number
}

/** MoldDesignSummaryPageResult mirrors the ListMoldDesigns contract response shape. */
export interface MoldDesignSummaryPageResult {
  moldDesigns: MoldDesignSummaryRecord[]
  total: number
  page: number
  pageSize: number
}

/** ProductionMoldSummaryPageResult mirrors the ListProductionMolds contract response shape. */
export interface ProductionMoldSummaryPageResult {
  productionMolds: ProductionMoldSummaryRecord[]
  total: number
  page: number
  pageSize: number
}

/** SearchMasterMoldsInput captures the contract filter set for master mold directories. */
export interface SearchMasterMoldsInput {
  tenantId: string
  orgId?: string | null
  keyword?: string
  moldDesignId?: string
  status?: MasterMoldStatus
  storageResourceId?: string
  carrierResourceId?: string
  page: number
  pageSize: number
}

/** MasterMoldSummaryPageResult mirrors the ListMasterMolds contract response shape. */
export interface MasterMoldSummaryPageResult {
  masterMolds: MasterMoldSummaryRecord[]
  total: number
  page: number
  pageSize: number
}

/** ListProductionMoldsByDesignInput captures production mold lookup scoped to one mold design. */
export interface ListProductionMoldsByDesignInput {
  tenantId: string
  orgId?: string | null
  moldDesignId: string
  status?: ProductionMoldStatus
  page: number
  pageSize: number
}

/** ListProductionMoldsByDesignResult mirrors the contract response for production molds grouped by design. */
export interface ListProductionMoldsByDesignResult {
  moldDesignSummary: MoldDesignSummaryRecord
  productionMolds: ProductionMoldSummaryRecord[]
  total: number
  page: number
  pageSize: number
}

/** ListCurrentMoldsByWorkCenterInput captures active mold installation lookup filters. */
export interface ListCurrentMoldsByWorkCenterInput {
  tenantId: string
  orgId?: string | null
  workCenterId: string
  workUnitId?: string
}

/** ListActiveToolingInstallationsByWorkCenterInput captures active installation lookup for position sequencing. */
export interface ListActiveToolingInstallationsByWorkCenterInput {
  tenantId: string
  orgId?: string | null
  workCenterId: string
}

/** ListCurrentMoldsByWorkCenterResult mirrors the contract response for current mold installations. */
export interface ListCurrentMoldsByWorkCenterResult {
  items: CurrentMoldByWorkCenterRecord[]
}

/** GetMoldUsageHistoryInput captures chronological mold history lookup filters. */
export interface GetMoldUsageHistoryInput {
  tenantId: string
  orgId?: string | null
  productionMoldId: string
  from?: string
  to?: string
  page: number
  pageSize: number
}

/** ListMoldLifeCountersInput captures life counter lookup filters. */
export interface ListMoldLifeCountersInput {
  tenantId: string
  orgId?: string | null
  productionMoldId?: string
  warningLevel?: MoldWarningLevel
  page: number
  pageSize: number
}

/** MoldUsageHistoryResult mirrors the GetMoldUsageHistory contract response shape. */
export interface MoldUsageHistoryResult {
  entries: MoldUsageHistoryEntryRecord[]
  total: number
  page: number
  pageSize: number
}

/** MoldLifeCounterPageResult mirrors the ListMoldLifeCounters contract response shape. */
export interface MoldLifeCounterPageResult {
  counters: MoldLifeCounterRecord[]
  total: number
  page: number
  pageSize: number
}

/** MesMoldRepository defines persistence for Mold / Tooling truth, facts, audit, and outbox records. */
export interface MesMoldRepository {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>

  saveMoldDesign(record: MoldDesignRecord): Promise<MoldDesignRecord>
  findMoldDesignById(tenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null>
  findMoldDesignByCode(tenantId: string, orgId: string | null | undefined, designCode: string): Promise<MoldDesignRecord | null>
  searchMoldDesigns(input: SearchMoldDesignsInput): Promise<MoldDesignSummaryPageResult>

  saveMasterMold(record: MasterMoldRecord): Promise<MasterMoldRecord>
  findMasterMoldById(tenantId: string, masterMoldId: string): Promise<MasterMoldRecord | null>
  findMasterMoldByCode(tenantId: string, orgId: string | null | undefined, masterMoldCode: string): Promise<MasterMoldRecord | null>
  searchMasterMolds(input: SearchMasterMoldsInput): Promise<MasterMoldSummaryPageResult>

  saveProductionMold(record: ProductionMoldRecord): Promise<ProductionMoldRecord>
  findProductionMoldById(tenantId: string, productionMoldId: string): Promise<ProductionMoldRecord | null>
  findProductionMoldByCode(tenantId: string, orgId: string | null | undefined, moldCode: string): Promise<ProductionMoldRecord | null>
  searchProductionMolds(input: SearchProductionMoldsInput): Promise<ProductionMoldSummaryPageResult>
  listProductionMoldsByDesign(input: ListProductionMoldsByDesignInput): Promise<ListProductionMoldsByDesignResult>

  getToolingCurrentPlacement(
    tenantId: string,
    toolingType: ToolingType,
    toolingId: string
  ): Promise<ToolingPlacementSummaryRecord | null>

  appendMoldMovement(record: MoldMovementRecord): Promise<MoldMovementRecord>
  findLastMoldMovement(tenantId: string, toolingType: ToolingType, toolingId: string): Promise<MoldMovementRecord | null>
  listMoldMovementsByTooling(tenantId: string, toolingType: ToolingType, toolingId: string): Promise<MoldMovementRecord[]>

  saveToolingInstallation(record: ToolingInstallationRecord): Promise<ToolingInstallationRecord>
  findToolingInstallationById(tenantId: string, toolingInstallationId: string): Promise<ToolingInstallationRecord | null>
  findActiveToolingInstallationByMold(tenantId: string, productionMoldId: string): Promise<ToolingInstallationRecord | null>
  listToolingInstallationsByMold(tenantId: string, productionMoldId: string): Promise<ToolingInstallationRecord[]>
  listActiveToolingInstallationsByWorkCenter(input: ListActiveToolingInstallationsByWorkCenterInput): Promise<ToolingInstallationRecord[]>
  listCurrentMoldsByWorkCenter(input: ListCurrentMoldsByWorkCenterInput): Promise<ListCurrentMoldsByWorkCenterResult>

  appendMoldUsageRecord(record: MoldUsageRecord): Promise<MoldUsageRecord>
  listMoldUsageRecordsByMold(tenantId: string, productionMoldId: string): Promise<MoldUsageRecord[]>
  findLastMoldUsageRecordByMold(tenantId: string, productionMoldId: string): Promise<MoldUsageRecord | null>
  getMoldUsageHistory(input: GetMoldUsageHistoryInput): Promise<MoldUsageHistoryResult>

  saveMoldLifeCounter(record: MoldLifeCounterRecord): Promise<MoldLifeCounterRecord>
  findMoldLifeCounterById(tenantId: string, moldLifeCounterId: string): Promise<MoldLifeCounterRecord | null>
  findMoldLifeCounterByProductionMold(tenantId: string, productionMoldId: string): Promise<MoldLifeCounterRecord | null>
  listMoldLifeCounters(input: ListMoldLifeCountersInput): Promise<MoldLifeCounterPageResult>

  appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord>
  appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord>

  saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord>
  findCommandIdempotencyRecord(tenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null>
}
