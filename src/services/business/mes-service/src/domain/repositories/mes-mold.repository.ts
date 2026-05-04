import {
  MasterMoldRecord,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesLocationRecord,
  MesOutboxEventRecord,
  MoldDesignRecord,
  MoldInstallationRecord,
  MoldLifeCounterRecord,
  MoldMovementEventRecord,
  MoldResourceType,
  MoldUsageEventRecord,
  MoldWarningEventRecord,
  MoldWarningLevel,
  MoldWarningStatus,
  MoldWarningType,
  PageResult,
  ProductionMoldInstanceRecord,
  ProductionMoldInstanceStatus,
  ResourcePositionRecord,
  WorkCenterRecord
} from '../models/mes-mold-records'

export interface SearchMoldDesignsInput {
  tenantId: string
  orgId?: string | null
  keyword?: string
  productFamilyRefId?: string
  manufacturingSpecRefId?: string
  itemId?: string
  materialType?: string
  functionRole?: string
  productionMethodTag?: string
  status?: string
  page: number
  pageSize: number
}

export interface SearchProductionMoldInstancesInput {
  tenantId: string
  orgId?: string | null
  moldDesignId?: string
  status?: ProductionMoldInstanceStatus
  warningLevel?: MoldWarningLevel
  supplierId?: string
  page: number
  pageSize: number
}

export interface SearchMoldWarningsInput {
  tenantId: string
  orgId?: string | null
  status?: MoldWarningStatus
  warningType?: MoldWarningType
  warningLevel?: MoldWarningLevel
  workCenterId?: string
  moldDesignId?: string
  raisedFrom?: string
  raisedTo?: string
  page: number
  pageSize: number
}

/** MesMoldRepository defines the persistence port for MES mold truth, facts, audit, and outbox records. */
export interface MesMoldRepository {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>

  saveMoldDesign(record: MoldDesignRecord): Promise<MoldDesignRecord>
  findMoldDesignById(tenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null>
  findMoldDesignByCode(tenantId: string, orgId: string | null | undefined, designCode: string): Promise<MoldDesignRecord | null>
  searchMoldDesigns(input: SearchMoldDesignsInput): Promise<PageResult<MoldDesignRecord>>

  saveMasterMold(record: MasterMoldRecord): Promise<MasterMoldRecord>
  findMasterMoldById(tenantId: string, masterMoldId: string): Promise<MasterMoldRecord | null>
  findMasterMoldByCode(tenantId: string, orgId: string | null | undefined, masterMoldCode: string): Promise<MasterMoldRecord | null>

  saveProductionMoldInstance(record: ProductionMoldInstanceRecord): Promise<ProductionMoldInstanceRecord>
  findProductionMoldInstanceById(tenantId: string, productionMoldInstanceId: string): Promise<ProductionMoldInstanceRecord | null>
  findProductionMoldInstanceByCode(tenantId: string, orgId: string | null | undefined, moldInstanceCode: string): Promise<ProductionMoldInstanceRecord | null>
  searchProductionMoldInstances(input: SearchProductionMoldInstancesInput): Promise<PageResult<ProductionMoldInstanceRecord>>

  saveMoldLifeCounter(record: MoldLifeCounterRecord): Promise<MoldLifeCounterRecord>
  findMoldLifeCounterByInstanceId(tenantId: string, productionMoldInstanceId: string): Promise<MoldLifeCounterRecord | null>

  findMesLocationById(tenantId: string, mesLocationId: string): Promise<MesLocationRecord | null>
  findWorkCenterById(tenantId: string, workCenterId: string): Promise<WorkCenterRecord | null>
  findResourcePositionById(tenantId: string, resourcePositionId: string): Promise<ResourcePositionRecord | null>

  appendMovementEvent(record: MoldMovementEventRecord): Promise<MoldMovementEventRecord>
  findLastMovementEvent(tenantId: string, moldResourceType: MoldResourceType, moldResourceId: string): Promise<MoldMovementEventRecord | null>
  listMovementEventsByResource(tenantId: string, moldResourceType: MoldResourceType, moldResourceId: string): Promise<MoldMovementEventRecord[]>

  saveMoldInstallation(record: MoldInstallationRecord): Promise<MoldInstallationRecord>
  findMoldInstallationById(tenantId: string, moldInstallationId: string): Promise<MoldInstallationRecord | null>
  findActiveInstallationByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldInstallationRecord | null>
  findActiveInstallationByPosition(tenantId: string, resourcePositionId: string): Promise<MoldInstallationRecord | null>
  listActiveInstallationsByWorkCenter(tenantId: string, workCenterId: string): Promise<MoldInstallationRecord[]>
  listInstallationsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldInstallationRecord[]>

  appendUsageEvent(record: MoldUsageEventRecord): Promise<MoldUsageEventRecord>
  listUsageEventsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldUsageEventRecord[]>
  findLastUsageEventByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldUsageEventRecord | null>

  saveMoldWarningEvent(record: MoldWarningEventRecord): Promise<MoldWarningEventRecord>
  findMoldWarningEventById(tenantId: string, moldWarningEventId: string): Promise<MoldWarningEventRecord | null>
  findOpenWarningByMoldAndType(tenantId: string, productionMoldInstanceId: string, warningType: MoldWarningType): Promise<MoldWarningEventRecord | null>
  findCurrentWarningByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldWarningEventRecord | null>
  searchMoldWarnings(input: SearchMoldWarningsInput): Promise<PageResult<MoldWarningEventRecord>>
  listWarningsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldWarningEventRecord[]>

  appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord>
  appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord>

  saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord>
  findCommandIdempotencyRecord(tenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null>
}
