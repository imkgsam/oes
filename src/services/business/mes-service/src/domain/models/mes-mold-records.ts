/** MoldFunctionRole captures whether a design is intended for master or production tooling. */
export enum MoldFunctionRole {
  MASTER = 'MASTER',
  PRODUCTION = 'PRODUCTION'
}

/** MoldOutputStructureType captures the frozen first-slice mold output shape. */
export enum MoldOutputStructureType {
  SINGLE = 'SINGLE',
  TWIN = 'TWIN',
  MULTI = 'MULTI',
  COMPONENT_COMBINATION = 'COMPONENT_COMBINATION'
}

/** MoldDesignOutputKind identifies the semantic owner boundary of one theoretical output. */
export enum MoldDesignOutputKind {
  PRODUCT = 'PRODUCT',
  COMPONENT = 'COMPONENT',
  PRODUCTION_SPEC = 'PRODUCTION_SPEC'
}

/** MoldDesignStatus captures the small design lifecycle exposed by the contract. */
export enum MoldDesignStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUPERSEDED = 'SUPERSEDED'
}

/** ProductionMoldStatus captures the current lifecycle for a production mold. */
export enum ProductionMoldStatus {
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  AVAILABLE = 'AVAILABLE',
  INSTALLED = 'INSTALLED',
  MAINTENANCE = 'MAINTENANCE',
  DISABLED = 'DISABLED',
  SCRAPPED = 'SCRAPPED'
}

/** ToolingType distinguishes tooling families while this slice only supports molds. */
export enum ToolingType {
  MOLD = 'MOLD'
}

/** ToolingInstallationStatus captures active and closed tooling installation facts. */
export enum ToolingInstallationStatus {
  ACTIVE = 'ACTIVE',
  UNMOUNTED = 'UNMOUNTED',
  CLOSED_BY_SCRAP = 'CLOSED_BY_SCRAP'
}

/** ToolingPlacementType names the current placement projection for a tooling object. */
export enum ToolingPlacementType {
  STORAGE_RESOURCE = 'STORAGE_RESOURCE',
  CARRIER_RESOURCE = 'CARRIER_RESOURCE',
  WORK_CENTER = 'WORK_CENTER',
  WORK_UNIT = 'WORK_UNIT'
}

/** MoldLifeAdjustmentType captures authorized life counter correction operations. */
export enum MoldLifeAdjustmentType {
  SET_USED_VALUE = 'SET_USED_VALUE',
  ADD_USED_VALUE = 'ADD_USED_VALUE',
  SET_LIMIT_VALUE = 'SET_LIMIT_VALUE',
  SET_WARNING_THRESHOLD = 'SET_WARNING_THRESHOLD'
}

/** MoldWarningLevel captures the readable life counter warning severity. */
export enum MoldWarningLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

/** MoldUsageHistoryEntryType classifies flattened mold facts for history queries. */
export enum MoldUsageHistoryEntryType {
  INSTALL = 'INSTALL',
  UNMOUNT = 'UNMOUNT',
  USAGE = 'USAGE',
  LIFE_ADJUSTMENT = 'LIFE_ADJUSTMENT',
  MOVE = 'MOVE',
  SCRAP = 'SCRAP'
}

/** MesOperatorContext carries the explicit operator context required by MES contracts. */
export interface MesOperatorContext {
  operatorId: string
  operatorType: string
  orgId?: string | null
}

/** MesTraceContext carries the explicit trace context required by MES contracts. */
export interface MesTraceContext {
  traceId: string
  requestId: string
}

/** MesAuditContext carries the explicit audit context required by every MES command. */
export interface MesAuditContext {
  auditId: string
  reason: string
  source: string
}

/** MesQueryContext carries the shared read-path scope and execution context. */
export interface MesQueryContext {
  tenantId: string
  orgId?: string | null
  operatorContext: MesOperatorContext
  traceContext: MesTraceContext
}

/** MesCommandContext carries the shared write-path scope, trace, audit, and idempotency context. */
export interface MesCommandContext extends MesQueryContext {
  auditContext: MesAuditContext
  commandId: string
}

/** MesCommandIdempotencyRecord stores command fingerprints and reusable command results. */
export interface MesCommandIdempotencyRecord {
  mesCommandIdempotencyId: string
  tenantId: string
  orgId?: string | null
  commandId: string
  commandName: string
  requestHash: string
  status: 'IN_PROGRESS' | 'SUCCEEDED'
  responseSnapshot?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

/** OperatorRefRecord stores the actor snapshot attached to append-only facts. */
export interface OperatorRefRecord {
  operatorId: string
  displayNameSnapshot?: string | null
}

/** AuditRefRecord links one fact back to the local audit envelope and command id. */
export interface AuditRefRecord {
  auditId: string
  commandId: string
  reason: string
}

/** ItemRefRecord stores an item-master reference and optional display snapshots. */
export interface ItemRefRecord {
  itemId: string
  itemCodeSnapshot?: string | null
  itemNameSnapshot?: string | null
}

/** SupplierRefRecord stores supplier identity references without copying SRM truth. */
export interface SupplierRefRecord {
  supplierId: string
  supplierCodeSnapshot?: string | null
  supplierDisplayNameSnapshot?: string | null
}

/** PurchaseRefRecord stores procurement document references without copying procurement truth. */
export interface PurchaseRefRecord {
  purchaseSourceType: 'PURCHASE_ORDER' | 'PURCHASE_RECEIPT' | 'EXTERNAL_DOCUMENT' | 'MANUAL'
  purchaseSourceId?: string | null
  purchaseNoSnapshot?: string | null
}

/** ProductionSpecRefRecord stores a production spec reference and display snapshots. */
export interface ProductionSpecRefRecord {
  productionSpecId: string
  specCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** StorageResourceRefRecord stores a fixed or semi-fixed storage resource reference. */
export interface StorageResourceRefRecord {
  storageResourceId: string
  resourceCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** CarrierResourceRefRecord stores a movable carrier resource reference. */
export interface CarrierResourceRefRecord {
  carrierResourceId: string
  resourceCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** WorkCenterRefRecord stores an execution-unit reference and display snapshots. */
export interface WorkCenterRefRecord {
  workCenterId: string
  workCenterCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** WorkUnitRefRecord stores a work point reference and display snapshots. */
export interface WorkUnitRefRecord {
  workUnitId: string
  workUnitCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** ProductionUnitRefRecord stores an optional production unit reference for usage facts. */
export interface ProductionUnitRefRecord {
  productionUnitId: string
  unitCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** TraceSubjectRefRecord stores an optional trace identity reference for usage facts. */
export interface TraceSubjectRefRecord {
  traceSubjectId: string
  traceCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** MoldDesignOutputOptionRecord captures one selectable output variant for mold usage. */
export interface MoldDesignOutputOptionRecord {
  moldDesignOutputOptionId: string
  tenantId: string
  orgId?: string | null
  moldDesignId: string
  moldDesignOutputId: string
  optionCode: string
  label: string
  productionSpecRef?: ProductionSpecRefRecord | null
  quantityPerUse?: string | null
  isDefault: boolean
}

/** MoldDesignOutputRecord captures one theoretical output row owned by a mold design. */
export interface MoldDesignOutputRecord {
  moldDesignOutputId: string
  tenantId: string
  orgId?: string | null
  moldDesignId: string
  sequenceNo: number
  outputCode: string
  outputKind: MoldDesignOutputKind
  productionSpecRef?: ProductionSpecRefRecord | null
  quantityPerUse: string
  componentRole?: string | null
  assemblyHint?: string | null
  isPrimaryOutput: boolean
  options: MoldDesignOutputOptionRecord[]
}

/** MoldDesignSummaryRecord is the compact read model for a mold design. */
export interface MoldDesignSummaryRecord {
  moldDesignId: string
  designCode: string
  name: string
  revisionCode?: string | null
  status: MoldDesignStatus
}

/** MoldDesignRecord captures the MES tooling design record without owning external item truth. */
export interface MoldDesignRecord {
  moldDesignId: string
  tenantId: string
  orgId?: string | null
  designCode: string
  name: string
  revisionCode?: string | null
  supersedesMoldDesignId?: string | null
  itemRef?: ItemRefRecord | null
  productionSpecRefs: ProductionSpecRefRecord[]
  materialType: string
  functionRole: MoldFunctionRole
  productionMethodTags: string[]
  outputStructureType: MoldOutputStructureType
  outputs: MoldDesignOutputRecord[]
  defaultLifeLimit?: string | null
  defaultLifeUnit?: string | null
  status: MoldDesignStatus
  createdAt: string
  updatedAt: string
}

/** MasterMoldSummaryRecord is the compact read model for a master mold. */
export interface MasterMoldSummaryRecord {
  masterMoldId: string
  masterMoldCode: string
  moldDesignId: string
  currentStatus: string
}

/** MasterMoldRecord captures master mold asset tracking outside production usage. */
export interface MasterMoldRecord {
  masterMoldId: string
  tenantId: string
  orgId?: string | null
  masterMoldCode: string
  moldDesignId: string
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  currentStatus: string
  currentStorageResourceRef?: StorageResourceRefRecord | null
  currentCarrierResourceRef?: CarrierResourceRefRecord | null
  qualitySummary?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

/** MoldInstallationDetailRecord captures mold-specific fields under a tooling installation. */
export interface MoldInstallationDetailRecord {
  toolingInstallationId: string
  moldPosition?: string | null
  cavityPosition?: string | null
  cavityMapping?: string | null
  setupParameters?: string | null
}

/** ToolingInstallationRecord captures a tooling installation interval fact. */
export interface ToolingInstallationRecord {
  toolingInstallationId: string
  tenantId: string
  orgId?: string | null
  toolingType: ToolingType
  toolingId: string
  workCenterRef: WorkCenterRefRecord
  workUnitRef?: WorkUnitRefRecord | null
  installedAt: string
  unmountedAt?: string | null
  installedByRef?: OperatorRefRecord | null
  unmountedByRef?: OperatorRefRecord | null
  status: ToolingInstallationStatus
  moldDetail?: MoldInstallationDetailRecord | null
  auditRef: AuditRefRecord
}

/** MoldLifeCounterSummaryRecord is the current life counter projection used by mold queries. */
export interface MoldLifeCounterSummaryRecord {
  moldLifeCounterId: string
  lifeUnit: string
  usedValue: string
  limitValue?: string | null
  warningThresholdValue?: string | null
  remainingValue?: string | null
  warningLevel?: MoldWarningLevel | null
  lastUsageRecordId?: string | null
  lastAdjustedAt?: string | null
}

/** ToolingPlacementSummaryRecord describes the current storage, carrier, or installation placement. */
export interface ToolingPlacementSummaryRecord {
  placementType: ToolingPlacementType
  storageResourceRef?: StorageResourceRefRecord | null
  carrierResourceRef?: CarrierResourceRefRecord | null
  workCenterRef?: WorkCenterRefRecord | null
  workUnitRef?: WorkUnitRefRecord | null
  toolingInstallationId?: string | null
  moldInstallationDetail?: MoldInstallationDetailRecord | null
}

/** ProductionMoldSummaryRecord is the compact read model for a production mold. */
export interface ProductionMoldSummaryRecord {
  productionMoldId: string
  moldCode: string
  moldDesignSummary: MoldDesignSummaryRecord
  currentStatus: ProductionMoldStatus
  currentPlacementSummary?: ToolingPlacementSummaryRecord | null
  lifeCounterSummary?: MoldLifeCounterSummaryRecord | null
}

/** ProductionMoldRecord captures one production mold and its current projection fields. */
export interface ProductionMoldRecord {
  productionMoldId: string
  tenantId: string
  orgId?: string | null
  moldCode: string
  moldDesignId: string
  sourceMasterMoldId?: string | null
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  acceptedAt?: string | null
  currentStatus: ProductionMoldStatus
  currentStorageResourceRef?: StorageResourceRefRecord | null
  currentCarrierResourceRef?: CarrierResourceRefRecord | null
  currentInstallationSummary?: ToolingInstallationRecord | null
  lifeCounterSummary?: MoldLifeCounterSummaryRecord | null
  scrappedAt?: string | null
  createdAt: string
  updatedAt: string
}

/** MoldMovementRecord captures one append-only tooling movement fact. */
export interface MoldMovementRecord {
  moldMovementId: string
  tenantId: string
  orgId?: string | null
  toolingType: ToolingType
  toolingId: string
  fromStorageResourceRef?: StorageResourceRefRecord | null
  fromCarrierResourceRef?: CarrierResourceRefRecord | null
  toStorageResourceRef?: StorageResourceRefRecord | null
  toCarrierResourceRef?: CarrierResourceRefRecord | null
  movementReason?: string | null
  movedAt: string
  operatorRef: OperatorRefRecord
  auditRef: AuditRefRecord
}

/** MoldUsageRecord captures one append-only mold usage and life counter fact. */
export interface MoldUsageRecord {
  moldUsageRecordId: string
  tenantId: string
  orgId?: string | null
  productionMoldId: string
  toolingInstallationId?: string | null
  workCenterRef: WorkCenterRefRecord
  workUnitRef?: WorkUnitRefRecord | null
  usedAt: string
  usageQuantity: string
  lifeDelta: string
  lifeUnit: string
  productionSpecRef?: ProductionSpecRefRecord | null
  productionUnitRef?: ProductionUnitRefRecord | null
  traceSubjectRef?: TraceSubjectRefRecord | null
  operatorRef: OperatorRefRecord
  captureSource?: string | null
  auditRef: AuditRefRecord
  moldDesignOutputId?: string | null
  moldDesignOutputOptionId?: string | null
}

/** MoldLifeCounterRecord captures an independent production mold life counter. */
export interface MoldLifeCounterRecord {
  moldLifeCounterId: string
  tenantId: string
  orgId?: string | null
  productionMoldId: string
  lifeUnit: string
  usedValue: string
  limitValue?: string | null
  warningThresholdValue?: string | null
  lastUsageRecordId?: string | null
  lastAdjustedAt?: string | null
  lastAdjustedByRef?: OperatorRefRecord | null
  adjustmentReason?: string | null
  updatedAt: string
}

/** MoldUsageHistoryEntryRecord is the flattened chronological read model for mold facts. */
export interface MoldUsageHistoryEntryRecord {
  entryType: MoldUsageHistoryEntryType
  happenedAt: string
  productionMoldId: string
  summary: string
  auditRef?: AuditRefRecord | null
}

/** CurrentMoldByWorkCenterRecord groups one active installation with mold and counter summaries. */
export interface CurrentMoldByWorkCenterRecord {
  productionMold: ProductionMoldSummaryRecord
  toolingInstallation: ToolingInstallationRecord
}

/** DailyMoldChecklistRecord is the printable daily read model for selected work centers. */
export interface DailyMoldChecklistRecord {
  checklistDate: string
  workCenterId: string
  items: CurrentMoldByWorkCenterRecord[]
}

/** MesAuditEnvelopeRecord captures the local audit envelope persisted with successful commands. */
export interface MesAuditEnvelopeRecord {
  mesAuditEnvelopeId: string
  tenantId: string
  orgId?: string | null
  service: string
  module: string
  eventType: string
  occurredAt: string
  result: 'SUCCEEDED'
  operatorId: string
  operatorType: string
  traceId: string
  commandId: string
  reason: string
  resourceType?: string | null
  resourceId?: string | null
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
  details: Record<string, unknown>
  createdAt: string
}

/** MesOutboxEventRecord captures one local integration event pending publication. */
export interface MesOutboxEventRecord {
  mesOutboxEventId: string
  tenantId: string
  orgId?: string | null
  eventType: string
  aggregateType: string
  aggregateId: string
  payload: Record<string, unknown>
  traceId: string
  commandId: string
  occurredAt: string
  publishedAt?: string | null
  status: 'PENDING' | 'PUBLISHED' | 'FAILED'
  createdAt: string
}
