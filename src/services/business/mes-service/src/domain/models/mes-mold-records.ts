/** MesLocationStatus describes the phase 1 MES physical location lifecycle. */
export enum MesLocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/** MoldFunctionRole captures whether a design is intended for master or production tooling. */
export enum MoldFunctionRole {
  MASTER = 'MASTER',
  PRODUCTION = 'PRODUCTION'
}

/** MoldOutputStructureType captures the frozen phase 1 mold output shape. */
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
  MANUFACTURING_SPEC = 'MANUFACTURING_SPEC'
}

/** MoldDesignStatus captures the small design lifecycle exposed by the query surface. */
export enum MoldDesignStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUPERSEDED = 'SUPERSEDED'
}

/** ProductionMoldInstanceStatus is the lifecycle truth and intentionally excludes long-lived IN_USE. */
export enum ProductionMoldInstanceStatus {
  RECEIVED = 'RECEIVED',
  PENDING_DRYING = 'PENDING_DRYING',
  PENDING_INSTALLATION = 'PENDING_INSTALLATION',
  INSTALLED = 'INSTALLED',
  PENDING_REPAIR = 'PENDING_REPAIR',
  UNDER_REPAIR = 'UNDER_REPAIR',
  DISABLED = 'DISABLED',
  SCRAPPED = 'SCRAPPED'
}

/** MoldResourceType distinguishes master molds from production mold instances on shared commands. */
export enum MoldResourceType {
  MASTER_MOLD = 'MASTER_MOLD',
  PRODUCTION_MOLD_INSTANCE = 'PRODUCTION_MOLD_INSTANCE'
}

/** MoldInstallationStatus captures active and closed installation facts. */
export enum MoldInstallationStatus {
  ACTIVE = 'ACTIVE',
  UNMOUNTED = 'UNMOUNTED',
  CLOSED_BY_SCRAP = 'CLOSED_BY_SCRAP'
}

/** MoldUsageMode captures the allowed phase 1 usage capture channels. */
export enum MoldUsageMode {
  MANUAL_CHECKLIST = 'MANUAL_CHECKLIST',
  PDA_SCAN = 'PDA_SCAN',
  BATCH_CONFIRM = 'BATCH_CONFIRM',
  BACK_OFFICE_ENTRY = 'BACK_OFFICE_ENTRY',
  AUTOMATED_CAPTURE = 'AUTOMATED_CAPTURE'
}

/** MoldLifeAdjustmentType captures authorized counter correction operations. */
export enum MoldLifeAdjustmentType {
  SET_USED_VALUE = 'SET_USED_VALUE',
  ADD_USED_VALUE = 'ADD_USED_VALUE',
  SET_LIMIT_VALUE = 'SET_LIMIT_VALUE',
  SET_WARNING_THRESHOLD = 'SET_WARNING_THRESHOLD'
}

/** MoldWarningType identifies the warning invariant that was crossed. */
export enum MoldWarningType {
  LIFE_THRESHOLD = 'LIFE_THRESHOLD',
  LIFE_EXCEEDED = 'LIFE_EXCEEDED',
  STATUS_EXCEPTION = 'STATUS_EXCEPTION'
}

/** MoldWarningLevel captures the readable warning severity. */
export enum MoldWarningLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

/** MoldWarningStatus captures human acknowledgement state for warning facts. */
export enum MoldWarningStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CLOSED = 'CLOSED'
}

/** MoldWarningAcknowledgementAction captures the small phase 1 remediation actions. */
export enum MoldWarningAcknowledgementAction {
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  ACKNOWLEDGE_AND_MARK_REPAIR = 'ACKNOWLEDGE_AND_MARK_REPAIR',
  ACKNOWLEDGE_AND_DISABLE = 'ACKNOWLEDGE_AND_DISABLE'
}

/** MoldDerivedUsageState is a read-model-only usage state and never a lifecycle status. */
export enum MoldDerivedUsageState {
  IDLE = 'IDLE',
  RECENTLY_USED = 'RECENTLY_USED',
  IN_USE_WINDOW = 'IN_USE_WINDOW'
}

/** MoldUsageHistoryEntryType classifies append-only mold facts for history queries. */
export enum MoldUsageHistoryEntryType {
  INSTALLATION = 'INSTALLATION',
  UNMOUNT = 'UNMOUNT',
  USAGE = 'USAGE',
  LIFE_ADJUSTMENT = 'LIFE_ADJUSTMENT',
  WARNING = 'WARNING',
  MOVE = 'MOVE',
  SCRAP = 'SCRAP'
}

/** MesOperatorContext carries the explicit operator context required by the MES contracts. */
export interface MesOperatorContext {
  operatorId: string
  operatorType: string
  orgId?: string | null
}

/** MesTraceContext carries the explicit trace context required by the MES contracts. */
export interface MesTraceContext {
  traceId: string
  requestId: string
}

/** MesAuditContext carries the explicit audit context required by every MES management command. */
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

/** MesCommandIdempotencyRecord stores completed command payload fingerprints and reusable command results. */
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

/** ManufacturingMasterDataRefRecord stores opaque master-data references plus display snapshots. */
export interface ManufacturingMasterDataRefRecord {
  refType: 'PRODUCT_FAMILY' | 'MANUFACTURING_SPEC'
  refId: string
  refCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** ItemRefRecord stores the optional item-master display snapshot without becoming the design binding. */
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

/** ExternalRefRecord stores optional opaque references to future MES or upstream execution objects. */
export interface ExternalRefRecord {
  refType: string
  refId: string
  refCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
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

/** PageResult wraps one phase 1 page envelope shared by repository search surfaces. */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
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
  productFamilyRef?: ManufacturingMasterDataRefRecord | null
  manufacturingSpecRef?: ManufacturingMasterDataRefRecord | null
  quantityPerUse: string
  componentRole?: string | null
  assemblyHint?: string | null
  isPrimaryOutput: boolean
}

/** MoldDesignRecord captures the MES tooling design record without owning external product truth. */
export interface MoldDesignRecord {
  moldDesignId: string
  tenantId: string
  orgId?: string | null
  designCode: string
  name: string
  revisionCode?: string | null
  supersedesDesignId?: string | null
  productFamilyRef: ManufacturingMasterDataRefRecord
  manufacturingSpecRefs: ManufacturingMasterDataRefRecord[]
  itemRef?: ItemRefRecord | null
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

/** MesLocationRecord captures MES-owned physical location truth and never WMS location truth. */
export interface MesLocationRecord {
  mesLocationId: string
  tenantId: string
  orgId?: string | null
  locationCode: string
  name: string
  locationType: string
  parentMesLocationId?: string | null
  relatedWorkCenterId?: string | null
  capacityProfileId?: string | null
  status: MesLocationStatus
  createdAt: string
  updatedAt: string
}

/** WorkCenterRecord captures a logical execution unit without becoming physical location truth. */
export interface WorkCenterRecord {
  workCenterId: string
  tenantId: string
  orgId?: string | null
  workCenterCode: string
  name: string
  workCenterType: string
  parentWorkCenterId?: string | null
  relatedMesLocationId?: string | null
  capacityProfileId?: string | null
  status: string
  createdAt: string
  updatedAt: string
}

/** ResourcePositionRecord captures a concrete mold slot under a work center. */
export interface ResourcePositionRecord {
  resourcePositionId: string
  tenantId: string
  orgId?: string | null
  workCenterId: string
  positionCode: string
  name: string
  positionType: string
  compatibleMoldDesignRefs: string[]
  status: string
  createdAt: string
  updatedAt: string
}

/** MasterMoldRecord captures master mold asset tracking without entering the production usage loop. */
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
  currentMesLocationId?: string | null
  qualitySummary?: string | null
  notes?: string | null
  scrappedAt?: string | null
  createdAt: string
  updatedAt: string
}

/** ProductionMoldInstanceRecord captures one production mold and its current projection fields. */
export interface ProductionMoldInstanceRecord {
  productionMoldInstanceId: string
  tenantId: string
  orgId?: string | null
  moldInstanceCode: string
  moldDesignId: string
  masterMoldId?: string | null
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  acceptedAt?: string | null
  currentStatus: ProductionMoldInstanceStatus
  currentMesLocationId?: string | null
  currentWorkCenterId?: string | null
  currentResourcePositionId?: string | null
  currentInstallationId?: string | null
  lifeUsedValue: string
  lifeLimitValue: string
  lifeUnit: string
  warningLevel: MoldWarningLevel
  scrappedAt?: string | null
  createdAt: string
  updatedAt: string
}

/** MoldMovementEventRecord captures one append-only movement fact. */
export interface MoldMovementEventRecord {
  moldMovementEventId: string
  tenantId: string
  orgId?: string | null
  moldResourceType: MoldResourceType
  moldResourceId: string
  fromMesLocationId?: string | null
  toMesLocationId: string
  movementReason: string
  movedAt: string
  operatorRef: OperatorRefRecord
  sourceCommandId: string
  auditRef: AuditRefRecord
}

/** MoldInstallationRecord captures one append-only installation interval fact. */
export interface MoldInstallationRecord {
  moldInstallationId: string
  tenantId: string
  orgId?: string | null
  productionMoldInstanceId: string
  workCenterId: string
  resourcePositionId: string
  installedAt: string
  unmountedAt?: string | null
  installedByRef: OperatorRefRecord
  unmountedByRef?: OperatorRefRecord | null
  installationStatus: MoldInstallationStatus
  setupSnapshot?: string | null
  operationRef?: ExternalRefRecord | null
  routingRef?: ExternalRefRecord | null
  workOrderRef?: ExternalRefRecord | null
  operationTaskRef?: ExternalRefRecord | null
  auditRef: AuditRefRecord
}

/** MoldUsageEventRecord captures one append-only production usage fact. */
export interface MoldUsageEventRecord {
  moldUsageEventId: string
  tenantId: string
  orgId?: string | null
  productionMoldInstanceId: string
  moldInstallationId: string
  workCenterId: string
  resourcePositionId?: string | null
  usageMode: MoldUsageMode
  usedAt: string
  usageQuantity: string
  lifeDelta: string
  lifeUnit: string
  lifeUsedValueAfter: string
  productFamilyRef?: ManufacturingMasterDataRefRecord | null
  manufacturingSpecRef?: ManufacturingMasterDataRefRecord | null
  wipUnitRef?: ExternalRefRecord | null
  physicalTraceId?: string | null
  workOrderRef?: ExternalRefRecord | null
  operationTaskRef?: ExternalRefRecord | null
  operatorRef: OperatorRefRecord
  captureSource: string
  auditRef: AuditRefRecord
}

/** MoldLifeCounterRecord captures the production mold's current lifetime counter projection. */
export interface MoldLifeCounterRecord {
  moldLifeCounterId: string
  tenantId: string
  orgId?: string | null
  productionMoldInstanceId: string
  lifeUnit: string
  usedValue: string
  limitValue: string
  warningThresholdValue: string
  lastUsageEventId?: string | null
  lastAdjustedAt?: string | null
  lastAdjustedByRef?: OperatorRefRecord | null
  adjustmentReason?: string | null
  updatedAt: string
}

/** MoldWarningEventRecord captures one append-only warning fact with acknowledgement projection fields. */
export interface MoldWarningEventRecord {
  moldWarningEventId: string
  tenantId: string
  orgId?: string | null
  productionMoldInstanceId: string
  warningType: MoldWarningType
  warningLevel: MoldWarningLevel
  triggeredByEventId?: string | null
  lifeUsedValue: string
  lifeLimitValue: string
  raisedAt: string
  acknowledgedAt?: string | null
  acknowledgedByRef?: OperatorRefRecord | null
  status: MoldWarningStatus
  auditRef: AuditRefRecord
}

/** MesAuditEnvelopeRecord captures the local audit envelope persisted with successful management commands. */
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

/** MoldDesignSummaryRecord is the query summary for a mold design. */
export interface MoldDesignSummaryRecord {
  moldDesignId: string
  designCode: string
  name: string
  revisionCode?: string | null
  productFamilyRef?: ManufacturingMasterDataRefRecord | null
}

/** MesLocationSummaryRecord is the query summary for current MES physical location. */
export type MesLocationSummaryRecord = Omit<MesLocationRecord, 'tenantId' | 'orgId' | 'createdAt' | 'updatedAt'>

/** WorkCenterSummaryRecord is the query summary for logical execution units. */
export type WorkCenterSummaryRecord = Omit<WorkCenterRecord, 'tenantId' | 'orgId' | 'createdAt' | 'updatedAt'>

/** ResourcePositionSummaryRecord is the query summary for mold slots. */
export type ResourcePositionSummaryRecord = Omit<ResourcePositionRecord, 'tenantId' | 'orgId' | 'createdAt' | 'updatedAt' | 'compatibleMoldDesignRefs'>

/** MoldInstallationSummaryRecord is the query projection for the currently active installation. */
export interface MoldInstallationSummaryRecord {
  moldInstallationId: string
  workCenterId: string
  workCenterCode?: string | null
  workCenterName?: string | null
  resourcePositionId: string
  positionCode?: string | null
  installedAt: string
  usageState: MoldDerivedUsageState
}

/** MoldLifeSummaryRecord is the query projection for the current lifetime counter. */
export interface MoldLifeSummaryRecord {
  lifeUnit: string
  usedValue: string
  limitValue: string
  warningThresholdValue: string
  remainingValue: string
  warningLevel: MoldWarningLevel
  lastUsageEventId?: string | null
  lastAdjustedAt?: string | null
}

/** MoldWarningSummaryRecord is the current warning summary embedded on instance queries. */
export interface MoldWarningSummaryRecord {
  moldWarningEventId: string
  warningType: MoldWarningType
  warningLevel: MoldWarningLevel
  status: MoldWarningStatus
  raisedAt: string
  acknowledgedAt?: string | null
}

/** ProductionMoldInstanceView is the primary query view for one production mold instance. */
export interface ProductionMoldInstanceView {
  productionMoldInstanceId: string
  tenantId: string
  orgId?: string | null
  moldInstanceCode: string
  moldDesignSummary: MoldDesignSummaryRecord
  masterMoldSummary?: {
    masterMoldId: string
    masterMoldCode: string
    moldDesignId: string
    currentStatus: string
  } | null
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  acceptedAt?: string | null
  currentStatus: ProductionMoldInstanceStatus
  currentMesLocationSummary?: MesLocationSummaryRecord | null
  currentInstallationSummary?: MoldInstallationSummaryRecord | null
  lifeSummary?: MoldLifeSummaryRecord | null
  warningSummary?: MoldWarningSummaryRecord | null
  scrappedAt?: string | null
  createdAt: string
  updatedAt: string
}

/** MoldCurrentLocationView is the query view for physical location plus active installation summary. */
export interface MoldCurrentLocationView {
  moldResourceType: MoldResourceType
  moldResourceId: string
  moldCode: string
  currentStatus: string
  currentMesLocationSummary?: MesLocationSummaryRecord | null
  currentInstallationSummary?: MoldInstallationSummaryRecord | null
  lastMovementEventId?: string | null
  lastMovedAt?: string | null
}

/** CurrentInstalledMoldView groups one active installation with instance, position, life, and warning summaries. */
export interface CurrentInstalledMoldView {
  productionMoldInstance: ProductionMoldInstanceView
  moldInstallation: MoldInstallationRecord
  resourcePositionSummary?: ResourcePositionSummaryRecord | null
  lifeSummary?: MoldLifeSummaryRecord | null
  warningSummary?: MoldWarningSummaryRecord | null
}

/** MoldLifeWarningView is the query view for one warning row. */
export interface MoldLifeWarningView extends MoldWarningEventRecord {
  productionMoldInstanceSummary: {
    productionMoldInstanceId: string
    moldInstanceCode: string
    moldDesignSummary: MoldDesignSummaryRecord
    currentStatus: ProductionMoldInstanceStatus
  }
}

/** MoldUsageHistoryEntryRecord is the flattened chronological read model for mold facts. */
export interface MoldUsageHistoryEntryRecord {
  entryType: MoldUsageHistoryEntryType
  entryId: string
  occurredAt: string
  workCenterSummary?: WorkCenterSummaryRecord | null
  resourcePositionSummary?: ResourcePositionSummaryRecord | null
  mesLocationSummary?: MesLocationSummaryRecord | null
  usageQuantity?: string | null
  lifeDelta?: string | null
  lifeUsedValueAfter?: string | null
  productFamilyRef?: ManufacturingMasterDataRefRecord | null
  manufacturingSpecRef?: ManufacturingMasterDataRefRecord | null
  wipUnitRef?: ExternalRefRecord | null
  physicalTraceId?: string | null
  operatorRef?: OperatorRefRecord | null
  auditRef?: AuditRefRecord | null
}

/** DailyMoldChecklistRecord is the printable daily read model for selected work centers. */
export interface DailyMoldChecklistRecord {
  checklistDate: string
  workCenters: Array<{
    workCenterSummary: WorkCenterSummaryRecord
    installedMolds: CurrentInstalledMoldView[]
    lifeWarnings: MoldLifeWarningView[]
    recentUsageSummary: Array<{
      moldUsageEventId: string
      productionMoldInstanceId: string
      moldInstanceCode: string
      usedAt: string
      usageQuantity: string
      lifeDelta: string
      lifeUnit: string
    }>
    exceptionNotes: string[]
  }>
  generatedAt: string
  generatedByRef: OperatorRefRecord
}
