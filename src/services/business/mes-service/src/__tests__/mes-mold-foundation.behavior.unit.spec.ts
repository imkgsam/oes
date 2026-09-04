import { status } from '@grpc/grpc-js'
import { MesMoldManagementService } from '../application/services/mes-mold-management.service'
import { MesMoldQueryService } from '../application/services/mes-mold-query.service'
import {
  CurrentMoldByWorkCenterRecord,
  MasterMoldRecord,
  MasterMoldStatus,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  MoldDesignRecord,
  MoldDesignStatus,
  MoldFunctionRole,
  MoldLifeAdjustmentType,
  MoldLifeCounterRecord,
  MoldMovementRecord,
  MoldOutputStructureType,
  MoldUsageHistoryEntryRecord,
  MoldUsageHistoryEntryType,
  MoldUsageRecord,
  MoldWarningLevel,
  ProductionMoldRecord,
  ProductionMoldStatus,
  ToolingInstallationRecord,
  ToolingInstallationStatus,
  ToolingPlacementSummaryRecord,
  ToolingPlacementType,
  ToolingType
} from '../domain/models/mes-mold-records'
import {
  ProductionSpecRecord,
  ProductionSpecResolveResult,
  ProductionSpecStatus,
  ProductionSpecSummaryPageResult
} from '../domain/models/production-spec-records'
import {
  ProductionSpecRepository,
  ResolveProductionSpecsForMoldInput,
  SearchProductionSpecsInput
} from '../domain/repositories/production-spec.repository'
import {
  GetMoldUsageHistoryInput,
  ListCurrentMoldsByWorkCenterInput,
  ListMoldLifeCountersInput,
  ListProductionMoldsByDesignInput,
  MesMoldRepository,
  SearchMoldDesignsInput,
  SearchProductionMoldsInput
} from '../domain/repositories/mes-mold.repository'

const tenantId = 'tenant-1'
const orgId = 'org-1'

/** commandContext creates the explicit MES command envelope required by mold/tooling writes. */
function commandContext(commandId: string) {
  return {
    tenantId,
    orgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: `request-${commandId}`
    },
    auditContext: {
      auditId: `audit-${commandId}`,
      reason: `reason-${commandId}`,
      source: 'jest'
    },
    commandId
  }
}

/** queryContext creates the explicit MES query envelope required by mold/tooling reads. */
function queryContext() {
  return {
    tenantId,
    orgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: 'query-request-1'
    }
  }
}

/** FakeMoldRepository stores mold/tooling records and facts in process for application Unit tests. */
class FakeMoldRepository implements MesMoldRepository {
  readonly designs = new Map<string, MoldDesignRecord>()
  readonly masterMolds = new Map<string, MasterMoldRecord>()
  readonly productionMolds = new Map<string, ProductionMoldRecord>()
  readonly movements: MoldMovementRecord[] = []
  readonly installations = new Map<string, ToolingInstallationRecord>()
  readonly usages: MoldUsageRecord[] = []
  readonly counters = new Map<string, MoldLifeCounterRecord>()
  readonly audits: MesAuditEnvelopeRecord[] = []
  readonly outbox: MesOutboxEventRecord[] = []
  readonly commandRecords = new Map<string, MesCommandIdempotencyRecord>()

  /** runInTransaction executes fake local transactions with rollback on thrown errors. */
  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const snapshot = {
      designs: structuredClone(Array.from(this.designs.entries())),
      masterMolds: structuredClone(Array.from(this.masterMolds.entries())),
      productionMolds: structuredClone(Array.from(this.productionMolds.entries())),
      movements: structuredClone(this.movements),
      installations: structuredClone(Array.from(this.installations.entries())),
      usages: structuredClone(this.usages),
      counters: structuredClone(Array.from(this.counters.entries())),
      audits: structuredClone(this.audits),
      outbox: structuredClone(this.outbox),
      commandRecords: structuredClone(Array.from(this.commandRecords.entries()))
    }
    try {
      return await callback()
    } catch (error) {
      this.designs.clear()
      snapshot.designs.forEach(([key, value]) => this.designs.set(key, value))
      this.masterMolds.clear()
      snapshot.masterMolds.forEach(([key, value]) => this.masterMolds.set(key, value))
      this.productionMolds.clear()
      snapshot.productionMolds.forEach(([key, value]) => this.productionMolds.set(key, value))
      this.movements.splice(0, this.movements.length, ...snapshot.movements)
      this.installations.clear()
      snapshot.installations.forEach(([key, value]) => this.installations.set(key, value))
      this.usages.splice(0, this.usages.length, ...snapshot.usages)
      this.counters.clear()
      snapshot.counters.forEach(([key, value]) => this.counters.set(key, value))
      this.audits.splice(0, this.audits.length, ...snapshot.audits)
      this.outbox.splice(0, this.outbox.length, ...snapshot.outbox)
      this.commandRecords.clear()
      snapshot.commandRecords.forEach(([key, value]) => this.commandRecords.set(key, value))
      throw error
    }
  }

  /** saveMoldDesign upserts one mold design. */
  async saveMoldDesign(record: MoldDesignRecord): Promise<MoldDesignRecord> {
    this.designs.set(record.moldDesignId, structuredClone(record))
    return structuredClone(record)
  }

  /** findMoldDesignById loads one mold design by tenant and id. */
  async findMoldDesignById(scopeTenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null> {
    const record = this.designs.get(moldDesignId)
    return record?.tenantId === scopeTenantId ? structuredClone(record) : null
  }

  /** findMoldDesignByCode loads one mold design by tenant, org, and normalized code. */
  async findMoldDesignByCode(scopeTenantId: string, scopeOrgId: string | null | undefined, designCode: string) {
    const record = Array.from(this.designs.values()).find(
      (candidate) =>
        candidate.tenantId === scopeTenantId &&
        (candidate.orgId ?? null) === (scopeOrgId ?? null) &&
        candidate.designCode === designCode
    )
    return record ? structuredClone(record) : null
  }

  /** searchMoldDesigns returns contract-shaped pages of compact design summaries. */
  async searchMoldDesigns(input: SearchMoldDesignsInput) {
    const filtered = Array.from(this.designs.values())
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.productionSpecId || record.productionSpecRefs.some((ref) => ref.productionSpecId === input.productionSpecId))
      .filter((record) => !input.itemModelId || record.primaryItemModelRef.itemModelId === input.itemModelId)
    const start = (input.page - 1) * input.pageSize
    return {
      moldDesigns: filtered.slice(start, start + input.pageSize).map(toDesignSummary),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** saveMasterMold upserts one master mold. */
  async saveMasterMold(record: MasterMoldRecord): Promise<MasterMoldRecord> {
    this.masterMolds.set(record.masterMoldId, structuredClone(record))
    return structuredClone(record)
  }

  /** findMasterMoldById loads one master mold. */
  async findMasterMoldById(scopeTenantId: string, masterMoldId: string): Promise<MasterMoldRecord | null> {
    const record = this.masterMolds.get(masterMoldId)
    return record?.tenantId === scopeTenantId ? structuredClone(record) : null
  }

  /** findMasterMoldByCode loads one master mold by code. */
  async findMasterMoldByCode(scopeTenantId: string, scopeOrgId: string | null | undefined, masterMoldCode: string) {
    const record = Array.from(this.masterMolds.values()).find(
      (candidate) =>
        candidate.tenantId === scopeTenantId &&
        (candidate.orgId ?? null) === (scopeOrgId ?? null) &&
        candidate.masterMoldCode === masterMoldCode
    )
    return record ? structuredClone(record) : null
  }

  /** searchMasterMolds returns contract-shaped pages of compact master mold summaries. */
  async searchMasterMolds(input: Parameters<MesMoldRepository['searchMasterMolds']>[0]) {
    const filtered = Array.from(this.masterMolds.values())
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => !input.moldDesignId || record.moldDesignId === input.moldDesignId)
      .filter((record) => !input.status || record.currentStatus === input.status)
      .filter((record) => !input.storageResourceId || record.currentStorageResourceRef?.storageResourceId === input.storageResourceId)
      .filter((record) => !input.carrierResourceId || record.currentCarrierResourceRef?.carrierResourceId === input.carrierResourceId)
    const start = (input.page - 1) * input.pageSize
    return {
      masterMolds: filtered.slice(start, start + input.pageSize).map((record) => this.toMasterMoldSummary(record)),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** saveProductionMold upserts one production mold and keeps its current installation projection fresh. */
  async saveProductionMold(record: ProductionMoldRecord): Promise<ProductionMoldRecord> {
    this.productionMolds.set(record.productionMoldId, structuredClone(record))
    return structuredClone(record)
  }

  /** findProductionMoldById loads one production mold. */
  async findProductionMoldById(scopeTenantId: string, productionMoldId: string): Promise<ProductionMoldRecord | null> {
    const record = this.productionMolds.get(productionMoldId)
    return record?.tenantId === scopeTenantId ? structuredClone(record) : null
  }

  /** findProductionMoldByCode loads one production mold by code. */
  async findProductionMoldByCode(scopeTenantId: string, scopeOrgId: string | null | undefined, moldCode: string) {
    const record = Array.from(this.productionMolds.values()).find(
      (candidate) =>
        candidate.tenantId === scopeTenantId &&
        (candidate.orgId ?? null) === (scopeOrgId ?? null) &&
        candidate.moldCode === moldCode
    )
    return record ? structuredClone(record) : null
  }

  /** searchProductionMolds returns contract-shaped pages of compact production mold summaries. */
  async searchProductionMolds(input: SearchProductionMoldsInput) {
    const filtered = Array.from(this.productionMolds.values())
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => !input.moldDesignId || record.moldDesignId === input.moldDesignId)
      .filter((record) => !input.status || record.currentStatus === input.status)
      .filter((record) => !input.storageResourceId || record.currentStorageResourceRef?.storageResourceId === input.storageResourceId)
      .filter((record) => !input.carrierResourceId || record.currentCarrierResourceRef?.carrierResourceId === input.carrierResourceId)
    const start = (input.page - 1) * input.pageSize
    return {
      productionMolds: filtered.slice(start, start + input.pageSize).map((record) => this.toProductionMoldSummary(record)),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** listProductionMoldsByDesign returns molds grouped under a visible design summary. */
  async listProductionMoldsByDesign(input: ListProductionMoldsByDesignInput) {
    const design = this.designs.get(input.moldDesignId)
    if (!design) {
      throw Object.assign(new Error('not found'), { definition: { rpcStatus: status.NOT_FOUND } })
    }
    const page = await this.searchProductionMolds({
      tenantId: input.tenantId,
      orgId: input.orgId,
      moldDesignId: input.moldDesignId,
      status: input.status,
      page: input.page,
      pageSize: input.pageSize
    })
    return {
      moldDesignSummary: toDesignSummary(design),
      productionMolds: page.productionMolds,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize
    }
  }

  /** getToolingCurrentPlacement returns the current storage, carrier, or installed placement. */
  async getToolingCurrentPlacement(scopeTenantId: string, toolingType: ToolingType, toolingId: string) {
    const mold = this.productionMolds.get(toolingId)
    if (toolingType !== ToolingType.MOLD || !mold || mold.tenantId !== scopeTenantId) {
      return null
    }
    return buildPlacement(mold)
  }

  /** appendMoldMovement stores one movement fact. */
  async appendMoldMovement(record: MoldMovementRecord): Promise<MoldMovementRecord> {
    this.movements.push(structuredClone(record))
    return structuredClone(record)
  }

  /** findLastMoldMovement returns the most recent movement fact for one tooling object. */
  async findLastMoldMovement(scopeTenantId: string, toolingType: ToolingType, toolingId: string) {
    return (
      structuredClone(
        this.movements.filter((record) => record.tenantId === scopeTenantId && record.toolingType === toolingType && record.toolingId === toolingId).at(-1)
      ) ?? null
    )
  }

  /** listMoldMovementsByTooling returns movement facts for one tooling object. */
  async listMoldMovementsByTooling(scopeTenantId: string, toolingType: ToolingType, toolingId: string) {
    return this.movements
      .filter((record) => record.tenantId === scopeTenantId && record.toolingType === toolingType && record.toolingId === toolingId)
      .map((record) => structuredClone(record))
  }

  /** saveToolingInstallation upserts one tooling installation and updates the mold projection. */
  async saveToolingInstallation(record: ToolingInstallationRecord): Promise<ToolingInstallationRecord> {
    this.installations.set(record.toolingInstallationId, structuredClone(record))
    const mold = this.productionMolds.get(record.toolingId)
    if (mold) {
      mold.currentInstallationSummary = record.status === ToolingInstallationStatus.ACTIVE ? structuredClone(record) : null
      this.productionMolds.set(mold.productionMoldId, structuredClone(mold))
    }
    return structuredClone(record)
  }

  /** findToolingInstallationById loads one tooling installation. */
  async findToolingInstallationById(scopeTenantId: string, toolingInstallationId: string) {
    const record = this.installations.get(toolingInstallationId)
    return record?.tenantId === scopeTenantId ? structuredClone(record) : null
  }

  /** findActiveToolingInstallationByMold loads the active installation for one production mold. */
  async findActiveToolingInstallationByMold(scopeTenantId: string, productionMoldId: string) {
    const record = Array.from(this.installations.values()).find(
      (candidate) =>
        candidate.tenantId === scopeTenantId &&
        candidate.toolingType === ToolingType.MOLD &&
        candidate.toolingId === productionMoldId &&
        candidate.status === ToolingInstallationStatus.ACTIVE
    )
    return record ? structuredClone(record) : null
  }

  /** listToolingInstallationsByMold returns all installations for one production mold. */
  async listToolingInstallationsByMold(scopeTenantId: string, productionMoldId: string) {
    return Array.from(this.installations.values())
      .filter((record) => record.tenantId === scopeTenantId && record.toolingId === productionMoldId)
      .map((record) => structuredClone(record))
  }

  /** listActiveToolingInstallationsByWorkCenter returns active installations for position sequencing. */
  async listActiveToolingInstallationsByWorkCenter(input: Parameters<MesMoldRepository['listActiveToolingInstallationsByWorkCenter']>[0]) {
    return Array.from(this.installations.values())
      .filter((record) => record.tenantId === input.tenantId && (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => record.status === ToolingInstallationStatus.ACTIVE)
      .filter((record) => record.workCenterRef.workCenterId === input.workCenterId)
      .sort((left, right) => (left.moldDetail?.moldPositionIndex ?? 0) - (right.moldDetail?.moldPositionIndex ?? 0))
      .map((record) => structuredClone(record))
  }

  /** listCurrentMoldsByWorkCenter returns active installation rows for one work center. */
  async listCurrentMoldsByWorkCenter(input: ListCurrentMoldsByWorkCenterInput) {
    const items = Array.from(this.installations.values())
      .filter((record) => record.tenantId === input.tenantId && (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => record.status === ToolingInstallationStatus.ACTIVE)
      .filter((record) => record.workCenterRef.workCenterId === input.workCenterId)
      .filter((record) => !input.workUnitId || record.workUnitRef?.workUnitId === input.workUnitId)
      .sort((left, right) => (left.moldDetail?.moldPositionIndex ?? 0) - (right.moldDetail?.moldPositionIndex ?? 0))
      .map((toolingInstallation): CurrentMoldByWorkCenterRecord => {
        const mold = this.productionMolds.get(toolingInstallation.toolingId)
        if (!mold) {
          throw new Error('missing mold')
        }
        return {
          productionMold: this.toProductionMoldSummary(mold),
          toolingInstallation: structuredClone(toolingInstallation),
          usageAllowed: mold.currentStatus === ProductionMoldStatus.READY,
          usageDisabledReason: mold.currentStatus === ProductionMoldStatus.READY ? null : `MOLD_${mold.currentStatus}`
        }
      })
    return { items }
  }

  /** appendMoldUsageRecord stores one usage fact. */
  async appendMoldUsageRecord(record: MoldUsageRecord): Promise<MoldUsageRecord> {
    this.usages.push(structuredClone(record))
    return structuredClone(record)
  }

  /** listMoldUsageRecordsByMold returns usage facts for one production mold. */
  async listMoldUsageRecordsByMold(scopeTenantId: string, productionMoldId: string) {
    return this.usages
      .filter((record) => record.tenantId === scopeTenantId && record.productionMoldId === productionMoldId)
      .map((record) => structuredClone(record))
  }

  /** findLastMoldUsageRecordByMold returns the most recent usage fact for one mold. */
  async findLastMoldUsageRecordByMold(scopeTenantId: string, productionMoldId: string) {
    return structuredClone(this.usages.filter((record) => record.tenantId === scopeTenantId && record.productionMoldId === productionMoldId).at(-1) ?? null)
  }

  /** getMoldUsageHistory returns flattened usage and lifecycle history entries. */
  async getMoldUsageHistory(input: GetMoldUsageHistoryInput) {
    const entries: MoldUsageHistoryEntryRecord[] = [
      ...this.movements
        .filter((record) => record.tenantId === input.tenantId && record.toolingId === input.productionMoldId)
        .map((record) => ({
          entryType: MoldUsageHistoryEntryType.MOVE,
          happenedAt: record.movedAt,
          productionMoldId: record.toolingId,
          summary: `Moved ${record.toolingId}`,
          auditRef: record.auditRef
        })),
      ...this.usages
        .filter((record) => record.tenantId === input.tenantId && record.productionMoldId === input.productionMoldId)
        .map((record) => ({
          entryType: MoldUsageHistoryEntryType.USAGE,
          happenedAt: record.usedAt,
          productionMoldId: record.productionMoldId,
          summary: `Used ${record.lifeDelta} ${record.lifeUnit}`,
          auditRef: record.auditRef
        }))
    ].filter((entry) => (!input.from || entry.happenedAt >= input.from) && (!input.to || entry.happenedAt <= input.to))
    return {
      entries,
      total: entries.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** saveMoldLifeCounter upserts one life counter. */
  async saveMoldLifeCounter(record: MoldLifeCounterRecord): Promise<MoldLifeCounterRecord> {
    this.counters.set(record.moldLifeCounterId, structuredClone(record))
    const mold = this.productionMolds.get(record.productionMoldId)
    if (mold) {
      mold.lifeCounterSummary = {
        moldLifeCounterId: record.moldLifeCounterId,
        lifeUnit: record.lifeUnit,
        usedValue: record.usedValue,
        limitValue: record.limitValue,
        warningThresholdValue: record.warningThresholdValue,
        lastUsageRecordId: record.lastUsageRecordId,
        lastAdjustedAt: record.lastAdjustedAt
      }
      this.productionMolds.set(mold.productionMoldId, structuredClone(mold))
    }
    return structuredClone(record)
  }

  /** findMoldLifeCounterByProductionMold loads one counter for a production mold. */
  async findMoldLifeCounterByProductionMold(scopeTenantId: string, productionMoldId: string) {
    const record = Array.from(this.counters.values()).find(
      (candidate) => candidate.tenantId === scopeTenantId && candidate.productionMoldId === productionMoldId
    )
    return record ? structuredClone(record) : null
  }

  /** findMoldLifeCounterById loads one life counter by tenant and id. */
  async findMoldLifeCounterById(scopeTenantId: string, moldLifeCounterId: string) {
    const record = this.counters.get(moldLifeCounterId)
    return record?.tenantId === scopeTenantId ? structuredClone(record) : null
  }

  /** listMoldLifeCounters returns contract-shaped pages of counters. */
  async listMoldLifeCounters(input: ListMoldLifeCountersInput) {
    const filtered = Array.from(this.counters.values())
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => !input.productionMoldId || record.productionMoldId === input.productionMoldId)
    const start = (input.page - 1) * input.pageSize
    return {
      counters: filtered.slice(start, start + input.pageSize).map((record) => structuredClone(record)),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** appendAuditEnvelope stores one command audit envelope. */
  async appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord> {
    this.audits.push(structuredClone(record))
    return structuredClone(record)
  }

  /** appendOutboxEvent stores one pending local event. */
  async appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord> {
    this.outbox.push(structuredClone(record))
    return structuredClone(record)
  }

  /** saveCommandIdempotencyRecord upserts one command replay record. */
  async saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord> {
    const existing = this.commandRecords.get(`${record.tenantId}:${record.commandId}`)
    if (existing && record.status === 'IN_PROGRESS') {
      return structuredClone(existing)
    }
    this.commandRecords.set(`${record.tenantId}:${record.commandId}`, structuredClone(record))
    return structuredClone(record)
  }

  /** findCommandIdempotencyRecord returns a stored command replay record. */
  async findCommandIdempotencyRecord(scopeTenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null> {
    return structuredClone(this.commandRecords.get(`${scopeTenantId}:${commandId}`) ?? null)
  }

  /** toProductionMoldSummary converts one mold into the compact query row. */
  private toProductionMoldSummary(record: ProductionMoldRecord) {
    const design = this.designs.get(record.moldDesignId)
    if (!design) {
      throw new Error('missing design')
    }
    return {
      productionMoldId: record.productionMoldId,
      moldCode: record.moldCode,
      moldDesignSummary: toDesignSummary(design),
      currentStatus: record.currentStatus,
      currentPlacementSummary: buildPlacement(record),
      lifeCounterSummary: record.lifeCounterSummary ?? null
    }
  }

  /** toMasterMoldSummary converts one master mold into the compact query row. */
  private toMasterMoldSummary(record: MasterMoldRecord) {
    const design = this.designs.get(record.moldDesignId)
    if (!design) {
      throw new Error('missing design')
    }
    return {
      masterMoldId: record.masterMoldId,
      masterMoldCode: record.masterMoldCode,
      moldDesignSummary: toDesignSummary(design),
      currentStatus: record.currentStatus,
      currentPlacementSummary: record.currentCarrierResourceRef
        ? { placementType: ToolingPlacementType.CARRIER_RESOURCE, carrierResourceRef: record.currentCarrierResourceRef }
        : { placementType: ToolingPlacementType.STORAGE_RESOURCE, storageResourceRef: record.currentStorageResourceRef ?? null }
    }
  }
}

/** FakeProductionSpecRepository exposes active/visible ProductionSpec resolution for mold design validation. */
class FakeProductionSpecRepository implements ProductionSpecRepository {
  readonly specs = new Map<string, ProductionSpecRecord>()
  readonly commandRecords = new Map<string, MesCommandIdempotencyRecord>()

  /** runInTransaction executes synchronously against the in-memory fake repository. */
  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return callback()
  }

  /** saveProductionSpec upserts one spec record for the fake resolver. */
  async saveProductionSpec(record: ProductionSpecRecord): Promise<ProductionSpecRecord> {
    this.specs.set(record.productionSpecId, structuredClone(record))
    return structuredClone(record)
  }

  /** findProductionSpecById loads one spec by tenant and id. */
  async findProductionSpecById(scopeTenantId: string, productionSpecId: string): Promise<ProductionSpecRecord | null> {
    const record = this.specs.get(productionSpecId)
    return record?.tenantId === scopeTenantId ? structuredClone(record) : null
  }

  /** findProductionSpecByCode loads one spec by tenant, org, and code. */
  async findProductionSpecByCode(scopeTenantId: string, scopeOrgId: string | null | undefined, specCode: string): Promise<ProductionSpecRecord | null> {
    const record = Array.from(this.specs.values()).find(
      (candidate) =>
        candidate.tenantId === scopeTenantId &&
        (candidate.orgId ?? null) === (scopeOrgId ?? null) &&
        candidate.specCode === specCode
    )
    return record ? structuredClone(record) : null
  }

  /** searchProductionSpecs returns compact fake ProductionSpec pages. */
  async searchProductionSpecs(input: SearchProductionSpecsInput): Promise<ProductionSpecSummaryPageResult> {
    const filtered = Array.from(this.specs.values())
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => !input.status || record.status === input.status)
    return {
      productionSpecs: filtered.map(toSpecSummary),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** listProductionSpecsByIds loads visible fake ProductionSpec records. */
  async listProductionSpecsByIds(scopeTenantId: string, productionSpecIds: string[]): Promise<ProductionSpecRecord[]> {
    return productionSpecIds
      .map((id) => this.specs.get(id))
      .filter((record): record is ProductionSpecRecord => !!record && record.tenantId === scopeTenantId)
      .map((record) => structuredClone(record))
  }

  /** resolveProductionSpecsForMold returns active specs and per-ref unavailability. */
  async resolveProductionSpecsForMold(input: ResolveProductionSpecsForMoldInput): Promise<ProductionSpecResolveResult> {
    const resolvedSpecs: ProductionSpecResolveResult['resolvedSpecs'] = []
    const unavailableRefs: ProductionSpecResolveResult['unavailableRefs'] = []
    for (const productionSpecId of input.productionSpecIds ?? []) {
      const record = this.specs.get(productionSpecId)
      if (!record || record.tenantId !== input.tenantId) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_FOUND' })
      } else if ((record.orgId ?? null) !== (input.orgId ?? null)) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_VISIBLE' })
      } else if (record.status !== ProductionSpecStatus.ACTIVE) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_ACTIVE' })
      } else {
        resolvedSpecs.push(toSpecSummary(record))
      }
    }
    return { resolvedSpecs, unavailableRefs }
  }

  /** appendAuditEnvelope is unused by mold tests but required by the repository port. */
  async appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord> {
    return record
  }

  /** appendOutboxEvent is unused by mold tests but required by the repository port. */
  async appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord> {
    return record
  }

  /** saveCommandIdempotencyRecord stores fake command records for port completeness. */
  async saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord> {
    this.commandRecords.set(`${record.tenantId}:${record.commandId}`, structuredClone(record))
    return structuredClone(record)
  }

  /** findCommandIdempotencyRecord returns fake command records for port completeness. */
  async findCommandIdempotencyRecord(scopeTenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null> {
    return structuredClone(this.commandRecords.get(`${scopeTenantId}:${commandId}`) ?? null)
  }
}

/** toDesignSummary converts one design into the compact query row. */
function toDesignSummary(record: MoldDesignRecord) {
  return {
    moldDesignId: record.moldDesignId,
    designCode: record.designCode,
    name: record.name,
    revisionCode: record.revisionCode,
    status: record.status,
    primaryItemModelRef: record.primaryItemModelRef
  }
}

/** toSpecSummary converts one fake ProductionSpec into the compact resolver row. */
function toSpecSummary(record: ProductionSpecRecord) {
  return {
    productionSpecId: record.productionSpecId,
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode,
    itemRef: record.itemRef,
    status: record.status
  }
}

/** buildPlacement derives the contract current-placement summary from a production mold projection. */
function buildPlacement(record: ProductionMoldRecord): ToolingPlacementSummaryRecord {
  if (record.currentInstallationSummary?.status === ToolingInstallationStatus.ACTIVE) {
    return {
      placementType: record.currentInstallationSummary.workUnitRef
        ? ToolingPlacementType.WORK_UNIT
        : ToolingPlacementType.WORK_CENTER,
      workCenterRef: record.currentInstallationSummary.workCenterRef,
      workUnitRef: record.currentInstallationSummary.workUnitRef ?? null,
      toolingInstallationId: record.currentInstallationSummary.toolingInstallationId,
      moldInstallationDetail: record.currentInstallationSummary.moldDetail ?? null
    }
  }
  if (record.currentCarrierResourceRef) {
    return {
      placementType: ToolingPlacementType.CARRIER_RESOURCE,
      carrierResourceRef: record.currentCarrierResourceRef
    }
  }
  return {
    placementType: ToolingPlacementType.STORAGE_RESOURCE,
    storageResourceRef: record.currentStorageResourceRef ?? null
  }
}

/** createHarness wires application services to the isolated fake repository. */
function createHarness() {
  const repository = new FakeMoldRepository()
  const productionSpecRepository = new FakeProductionSpecRepository()
  productionSpecRepository.specs.set('spec-1', {
    productionSpecId: 'spec-1',
    tenantId,
    orgId,
    specCode: 'BODY-A',
    name: 'Body A',
    revisionCode: 'R1',
    supersedesProductionSpecId: null,
    itemRef: {
      itemId: 'item-1'
    },
    status: ProductionSpecStatus.ACTIVE,
    effectiveFrom: null,
    effectiveTo: null,
    retiredAt: null,
    replacementProductionSpecId: null,
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
    version: 1
  })
  productionSpecRepository.specs.set('spec-draft', {
    productionSpecId: 'spec-draft',
    tenantId,
    orgId,
    specCode: 'BODY-DRAFT',
    name: 'Body Draft',
    revisionCode: 'R1',
    supersedesProductionSpecId: null,
    itemRef: {
      itemId: 'item-2'
    },
    status: ProductionSpecStatus.DRAFT,
    effectiveFrom: null,
    effectiveTo: null,
    retiredAt: null,
    replacementProductionSpecId: null,
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
    version: 1
  })
  productionSpecRepository.specs.set('spec-other-org', {
    productionSpecId: 'spec-other-org',
    tenantId,
    orgId: 'org-2',
    specCode: 'BODY-OTHER',
    name: 'Body Other',
    revisionCode: 'R1',
    supersedesProductionSpecId: null,
    itemRef: {
      itemId: 'item-3'
    },
    status: ProductionSpecStatus.ACTIVE,
    effectiveFrom: null,
    effectiveTo: null,
    retiredAt: null,
    replacementProductionSpecId: null,
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
    version: 1
  })
  return {
    repository,
    productionSpecRepository,
    management: new MesMoldManagementService(repository, productionSpecRepository),
    query: new MesMoldQueryService(repository)
  }
}

/** registerDesign exercises the current MoldDesign command surface. */
async function registerDesign(management: MesMoldManagementService) {
  return management.registerMoldDesign({
    ...commandContext('cmd-design-1'),
    moldDesignId: 'design-1',
    designCode: 'body-a-design',
    name: 'Body A Design',
    revisionCode: 'R1',
    primaryItemModelRef: {
      itemModelId: 'item-model-body-a',
      modelCodeSnapshot: 'BODY-A',
      modelNameSnapshot: 'Body A'
    },
    productionSpecRefs: [
      {
        productionSpecId: 'spec-1',
        specCodeSnapshot: 'BODY-A',
        displayNameSnapshot: 'Body A'
      }
    ],
    materialType: 'GYPSUM',
    functionRole: MoldFunctionRole.PRODUCTION,
    productionMethodTags: ['HIGH_PRESSURE'],
    outputStructureType: MoldOutputStructureType.SINGLE,
    outputs: [
      {
        sequenceNo: 1,
        outputCode: 'BODY-A',
        outputKind: 'PRODUCTION_SPEC',
        productionSpecRef: {
          productionSpecId: 'spec-1'
        },
        itemModelRef: {
          itemModelId: 'item-model-body-a'
        },
        quantityPerUse: '1',
        isPrimaryOutput: true
      }
    ],
    defaultLifeLimit: '100',
    defaultLifeUnit: 'CASTING_CYCLE'
  })
}

describe('mes-service mold/tooling application behavior Unit', () => {
  it('production mold field loop pre-registers, confirms arrival, installs by index, readies, records usage, and reindexes on removal', async () => {
    const { management, query } = createHarness()

    await registerDesign(management)

    const firstMold = await management.registerProductionMold({
      ...commandContext('cmd-loop-mold-1'),
      productionMoldId: 'loop-mold-1',
      moldCode: 'loop-mold-1',
      moldDesignId: 'design-1',
      initialStorageResourceRef: {
        storageResourceId: 'storage-ready'
      }
    })
    expect(firstMold.currentStatus).toBe('PRE_REGISTERED')

    const arrivedFirst = await (management as any).confirmProductionMoldArrival({
      ...commandContext('cmd-loop-arrival-1'),
      productionMoldId: 'loop-mold-1',
      arrivedAt: '2026-05-10T00:30:00.000Z'
    })
    expect(arrivedFirst.productionMold.currentStatus).toBe(ProductionMoldStatus.AVAILABLE)

    const firstInstallation = await management.installTooling({
      ...commandContext('cmd-loop-install-1'),
      toolingType: ToolingType.MOLD,
      toolingId: 'loop-mold-1',
      workCenterRef: {
        workCenterId: 'wc-loop'
      },
      installedAt: '2026-05-10T01:00:00.000Z'
    } as any)
    expect((firstInstallation.toolingInstallation.moldDetail as any).moldPositionIndex).toBe(1)
    expect((await query.getProductionMold({ ...queryContext(), productionMoldId: 'loop-mold-1' })).currentStatus).toBe(
      ProductionMoldStatus.MAINTENANCE
    )

    await expect(
      management.recordMoldUsageBatch({
        ...commandContext('cmd-loop-usage-before-ready'),
        workCenterRef: {
          workCenterId: 'wc-loop'
        },
        usedAt: '2026-05-10T01:20:00.000Z',
        lines: [
          {
            isSubmitted: true,
            productionMoldId: 'loop-mold-1',
            toolingInstallationId: firstInstallation.toolingInstallation.toolingInstallationId,
            usageQuantity: '1'
          }
        ]
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })

    const readyFirst = await (management as any).confirmInstalledMoldReady({
      ...commandContext('cmd-loop-ready-1'),
      productionMoldId: 'loop-mold-1',
      toolingInstallationId: firstInstallation.toolingInstallation.toolingInstallationId,
      confirmedAt: '2026-05-10T01:30:00.000Z'
    })
    expect(readyFirst.productionMold.currentStatus).toBe('READY')

    const usage = await management.recordMoldUsageBatch({
      ...commandContext('cmd-loop-usage-ready'),
      workCenterRef: {
        workCenterId: 'wc-loop'
      },
      usedAt: '2026-05-10T02:00:00.000Z',
      lines: [
        {
          isSubmitted: true,
          productionMoldId: 'loop-mold-1',
          toolingInstallationId: firstInstallation.toolingInstallation.toolingInstallationId,
          usageQuantity: '2'
        }
      ]
    })
    expect(usage.moldLifeCounters[0]?.usedValue).toBe('2')

    const secondMold = await management.registerProductionMold({
      ...commandContext('cmd-loop-mold-2'),
      productionMoldId: 'loop-mold-2',
      moldCode: 'loop-mold-2',
      moldDesignId: 'design-1',
      initialStorageResourceRef: {
        storageResourceId: 'storage-ready'
      }
    })
    expect(secondMold.currentStatus).toBe('PRE_REGISTERED')
    await (management as any).confirmProductionMoldArrival({
      ...commandContext('cmd-loop-arrival-2'),
      productionMoldId: 'loop-mold-2'
    })

    const secondInstallation = await management.installTooling({
      ...commandContext('cmd-loop-install-2'),
      toolingType: ToolingType.MOLD,
      toolingId: 'loop-mold-2',
      workCenterRef: {
        workCenterId: 'wc-loop'
      },
      moldPositionIndex: 1
    } as any)
    expect((secondInstallation.toolingInstallation.moldDetail as any).moldPositionIndex).toBe(1)

    const afterInsert = await query.listCurrentMoldsByWorkCenter({
      ...queryContext(),
      workCenterId: 'wc-loop'
    })
    expect(
      afterInsert.items.map((item) => ({
        moldId: item.productionMold.productionMoldId,
        index: (item.toolingInstallation.moldDetail as any).moldPositionIndex
      }))
    ).toEqual([
      { moldId: 'loop-mold-2', index: 1 },
      { moldId: 'loop-mold-1', index: 2 }
    ])

    await management.unmountTooling({
      ...commandContext('cmd-loop-unmount-2'),
      toolingInstallationId: secondInstallation.toolingInstallation.toolingInstallationId
    })

    const afterRemoval = await query.listCurrentMoldsByWorkCenter({
      ...queryContext(),
      workCenterId: 'wc-loop'
    })
    expect(
      afterRemoval.items.map((item) => ({
        moldId: item.productionMold.productionMoldId,
        index: (item.toolingInstallation.moldDetail as any).moldPositionIndex
      }))
    ).toEqual([{ moldId: 'loop-mold-1', index: 1 }])
  })

  it('management lifecycle / registers design, master mold, production mold, moves, installs, uses, adjusts, unmounts, and scraps', async () => {
    const { management, repository, query } = createHarness()

    const design = await registerDesign(management)
    expect(design).toMatchObject({
      designCode: 'BODY-A-DESIGN',
      primaryItemModelRef: {
        itemModelId: 'item-model-body-a'
      },
      status: MoldDesignStatus.ACTIVE
    })
    await expect(registerDesign(management)).resolves.toEqual(design)
    await expect(
      management.registerMoldDesign({
        ...commandContext('cmd-design-1'),
        designCode: 'different',
        name: 'Different',
        primaryItemModelRef: {
          itemModelId: 'item-model-body-a'
        },
        materialType: 'GYPSUM',
        functionRole: MoldFunctionRole.PRODUCTION,
        outputStructureType: MoldOutputStructureType.SINGLE,
        outputs: [
          {
            sequenceNo: 1,
            outputCode: 'BODY-A',
            outputKind: 'PRODUCTION_SPEC',
            quantityPerUse: '1',
            isPrimaryOutput: true
          }
        ]
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.ALREADY_EXISTS } })
    await expect(
      management.registerMoldDesign({
        ...commandContext('cmd-design-draft-spec'),
        designCode: 'draft-spec-design',
        name: 'Draft Spec Design',
        primaryItemModelRef: {
          itemModelId: 'item-model-body-draft'
        },
        productionSpecRefs: [{ productionSpecId: 'spec-draft' }],
        materialType: 'GYPSUM',
        functionRole: MoldFunctionRole.PRODUCTION,
        outputStructureType: MoldOutputStructureType.SINGLE,
        outputs: [
          {
            sequenceNo: 1,
            outputCode: 'BODY-DRAFT',
            outputKind: 'PRODUCTION_SPEC',
            productionSpecRef: { productionSpecId: 'spec-draft' },
            itemModelRef: { itemModelId: 'item-model-body-draft' },
            quantityPerUse: '1',
            isPrimaryOutput: true
          }
        ]
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })
    await expect(
      management.registerMoldDesign({
        ...commandContext('cmd-design-cross-org-spec'),
        designCode: 'cross-org-spec-design',
        name: 'Cross Org Spec Design',
        primaryItemModelRef: {
          itemModelId: 'item-model-body-other'
        },
        productionSpecRefs: [{ productionSpecId: 'spec-other-org' }],
        materialType: 'GYPSUM',
        functionRole: MoldFunctionRole.PRODUCTION,
        outputStructureType: MoldOutputStructureType.SINGLE,
        outputs: [
          {
            sequenceNo: 1,
            outputCode: 'BODY-OTHER',
            outputKind: 'PRODUCTION_SPEC',
            productionSpecRef: { productionSpecId: 'spec-other-org' },
            itemModelRef: { itemModelId: 'item-model-body-other' },
            quantityPerUse: '1',
            isPrimaryOutput: true
          }
        ]
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })

    const master = await management.registerMasterMold({
      ...commandContext('cmd-master-1'),
      masterMoldId: 'master-1',
      masterMoldCode: 'master-body-a-1',
      moldDesignId: 'design-1',
      initialStorageResourceRef: {
        storageResourceId: 'storage-master'
      }
    })
    expect(master.currentStorageResourceRef?.storageResourceId).toBe('storage-master')
    expect(master.currentStatus).toBe(MasterMoldStatus.AVAILABLE)

    repository.designs.set('design-other-org', {
      ...design,
      moldDesignId: 'design-other-org',
      designCode: 'BODY-OTHER-ORG',
      orgId: 'org-2'
    })
    await expect(
      management.registerMasterMold({
        ...commandContext('cmd-master-cross-org-design'),
        masterMoldCode: 'master-cross-org',
        moldDesignId: 'design-other-org',
        initialStorageResourceRef: {
          storageResourceId: 'storage-master'
        }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })
    await expect(
      management.registerMoldDesign({
        ...commandContext('cmd-design-cross-org-supersedes'),
        designCode: 'cross-org-supersedes',
        name: 'Cross Org Supersedes',
        primaryItemModelRef: {
          itemModelId: 'item-model-body-a'
        },
        supersedesMoldDesignId: 'design-other-org',
        productionSpecRefs: [{ productionSpecId: 'spec-1' }],
        materialType: 'GYPSUM',
        functionRole: MoldFunctionRole.PRODUCTION,
        outputStructureType: MoldOutputStructureType.SINGLE,
        outputs: [
          {
            sequenceNo: 1,
            outputCode: 'BODY-A',
            outputKind: 'PRODUCTION_SPEC',
            productionSpecRef: { productionSpecId: 'spec-1' },
            itemModelRef: { itemModelId: 'item-model-body-a' },
            quantityPerUse: '1',
            isPrimaryOutput: true
          }
        ]
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })

    const productionMold = await management.registerProductionMold({
      ...commandContext('cmd-mold-1'),
      productionMoldId: 'mold-1',
      moldCode: 'pm-body-a-1',
      moldDesignId: 'design-1',
      sourceMasterMoldId: 'master-1',
      initialStorageResourceRef: {
        storageResourceId: 'storage-ready'
      }
    })
    expect(productionMold.currentStatus).toBe(ProductionMoldStatus.PRE_REGISTERED)
    expect(productionMold.acceptedAt).toBeNull()
    expect(productionMold.lifeCounterSummary?.usedValue).toBe('0')

    await expect(
      management.registerProductionMold({
        ...commandContext('cmd-mold-cross-org-design'),
        moldCode: 'pm-cross-org-design',
        moldDesignId: 'design-other-org',
        initialStorageResourceRef: {
          storageResourceId: 'storage-ready'
        }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })

    await expect(
      management.moveTooling({
        ...commandContext('cmd-move-before-arrival'),
        toolingType: ToolingType.MOLD,
        toolingId: 'mold-1',
        toCarrierResourceRef: {
          carrierResourceId: 'carrier-1'
        },
        movementReason: 'ready for line',
        movedAt: '2026-05-10T00:00:00.000Z'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })

    await expect(
      management.installTooling({
        ...commandContext('cmd-install-before-arrival'),
        toolingType: ToolingType.MOLD,
        toolingId: 'mold-1',
        workCenterRef: {
          workCenterId: 'wc-1'
        }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })

    const arrived = await management.confirmProductionMoldArrival({
      ...commandContext('cmd-arrival-1'),
      productionMoldId: 'mold-1',
      arrivedAt: '2026-05-10T00:45:00.000Z'
    })
    expect(arrived.productionMold.currentStatus).toBe(ProductionMoldStatus.AVAILABLE)
    expect(arrived.productionMold.acceptedAt).toBeNull()

    const moved = await management.moveTooling({
      ...commandContext('cmd-move-1'),
      toolingType: ToolingType.MOLD,
      toolingId: 'mold-1',
      toCarrierResourceRef: {
        carrierResourceId: 'carrier-1'
      },
      movementReason: 'ready for line',
      movedAt: '2026-05-10T00:00:00.000Z'
    })
    expect(moved.placement.placementType).toBe(ToolingPlacementType.CARRIER_RESOURCE)
    expect(repository.movements.some((movement) => movement.toolingId === 'mold-1')).toBe(true)

    const installed = await management.installTooling({
      ...commandContext('cmd-install-1'),
      toolingType: ToolingType.MOLD,
      toolingId: 'mold-1',
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitId: 'wu-1'
      },
      installedAt: '2026-05-10T01:00:00.000Z',
      moldPositionIndex: 1
    })
    expect(installed.toolingInstallation.toolingType).toBe(ToolingType.MOLD)
    expect(installed.toolingInstallation.moldDetail?.moldPositionIndex).toBe(1)
    expect(installed.toolingInstallation.moldDetail?.toolingInstallationId).toBe(installed.toolingInstallation.toolingInstallationId)
    expect((await repository.findProductionMoldById(tenantId, 'mold-1'))?.currentStatus).toBe(ProductionMoldStatus.MAINTENANCE)

    await expect(
      management.recordMoldUsage({
        ...commandContext('cmd-usage-before-ready'),
        productionMoldId: 'mold-1',
        toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
        workCenterRef: {
          workCenterId: 'wc-1'
        },
        usageQuantity: '1',
        lifeUnit: 'CASTING_CYCLE'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })

    const ready = await management.confirmInstalledMoldReady({
      ...commandContext('cmd-ready-1'),
      productionMoldId: 'mold-1',
      toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
      readyAt: '2026-05-10T01:30:00.000Z'
    })
    expect(ready.productionMold.currentStatus).toBe(ProductionMoldStatus.READY)

    const usage = await management.recordMoldUsage({
      ...commandContext('cmd-usage-1'),
      productionMoldId: 'mold-1',
      toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitId: 'wu-1'
      },
      usedAt: '2026-05-10T02:00:00.000Z',
      usageQuantity: '12',
      lifeUnit: 'CASTING_CYCLE',
      productionSpecRef: {
        productionSpecId: 'spec-1'
      }
    })
    expect(usage.moldLifeCounter.usedValue).toBe('12')
    expect(usage.moldUsageRecord.lifeDelta).toBe('12')
    expect(usage.moldUsageRecord.productionSpecRef?.productionSpecId).toBe('spec-1')

    const batch = await management.recordMoldUsageBatch({
      ...commandContext('cmd-usage-batch-1'),
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitId: 'wu-1'
      },
      usedAt: '2026-05-10T02:30:00.000Z',
      lifeUnit: 'CASTING_CYCLE',
      captureSource: 'WEB_DAILY_CHECKLIST',
      lines: [
        {
          isSubmitted: true,
          productionMoldId: 'mold-1',
          toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
          usageQuantity: '5',
          productionSpecRef: {
            productionSpecId: 'spec-1'
          }
        },
        {
          isSubmitted: false,
          productionMoldId: 'mold-1',
          toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
          usageQuantity: '99'
        }
      ]
    })
    expect(batch.moldUsageRecords).toHaveLength(1)
    expect(batch.moldUsageRecords[0]?.lifeDelta).toBe('5')
    expect(batch.moldLifeCounters[0]?.usedValue).toBe('17')

    const usageCountBeforeInvalidBatch = repository.usages.length
    await expect(
      management.recordMoldUsageBatch({
        ...commandContext('cmd-usage-batch-invalid'),
        workCenterRef: {
          workCenterId: 'wc-1'
        },
        usedAt: '2026-05-10T02:45:00.000Z',
        lifeUnit: 'CASTING_CYCLE',
        lines: [
          {
            isSubmitted: true,
            productionMoldId: 'mold-1',
            toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
            usageQuantity: '1'
          },
          {
            isSubmitted: true,
            productionMoldId: 'missing-mold',
            toolingInstallationId: 'missing-installation',
            usageQuantity: '1'
          }
        ]
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })
    expect(repository.usages).toHaveLength(usageCountBeforeInvalidBatch)
    expect((await repository.findMoldLifeCounterByProductionMold(tenantId, 'mold-1'))?.usedValue).toBe('17')

    const otherOrgCommand = {
      ...commandContext('cmd-other-org'),
      orgId: 'org-2',
      operatorContext: {
        operatorId: 'operator-2',
        operatorType: 'HUMAN',
        orgId: 'org-2'
      }
    }
    await expect(
      management.installTooling({
        ...otherOrgCommand,
        commandId: 'cmd-cross-org-install',
        toolingType: ToolingType.MOLD,
        toolingId: 'mold-1',
        workCenterRef: {
          workCenterId: 'wc-2'
        }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })
    await expect(
      management.recordMoldUsage({
        ...otherOrgCommand,
        commandId: 'cmd-cross-org-usage',
        productionMoldId: 'mold-1',
        toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
        workCenterRef: {
          workCenterId: 'wc-1'
        },
        workUnitRef: {
          workUnitId: 'wu-1'
        },
        usageQuantity: '1',
        lifeUnit: 'CASTING_CYCLE'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })
    await expect(
      query.getToolingCurrentPlacement({
        ...queryContext(),
        orgId: 'org-2',
        operatorContext: {
          operatorId: 'operator-2',
          operatorType: 'HUMAN',
          orgId: 'org-2'
        },
        toolingType: ToolingType.MOLD,
        toolingId: 'mold-1'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })

    const adjusted = await management.adjustMoldLifeCounter({
      ...commandContext('cmd-adjust-1'),
      moldLifeCounterId: usage.moldLifeCounter.moldLifeCounterId,
      adjustmentType: MoldLifeAdjustmentType.ADD_USED_VALUE,
      value: '3'
    })
    expect(adjusted.moldLifeCounter.usedValue).toBe('20')
    expect(adjusted.moldLifeCounter.adjustmentReason).toBe('reason-cmd-adjust-1')

    await expect(
      management.adjustMoldLifeCounter({
        ...otherOrgCommand,
        commandId: 'cmd-cross-org-adjust',
        moldLifeCounterId: usage.moldLifeCounter.moldLifeCounterId,
        adjustmentType: MoldLifeAdjustmentType.ADD_USED_VALUE,
        value: '1'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })

    const currentByWorkCenter = await query.listCurrentMoldsByWorkCenter({
      ...queryContext(),
      workCenterId: 'wc-1'
    })
    expect(currentByWorkCenter.items).toHaveLength(1)
    expect(currentByWorkCenter.items[0]?.usageAllowed).toBe(true)

    const markedForScrap = await management.markProductionMoldForScrap({
      ...commandContext('cmd-mark-scrap-1'),
      productionMoldId: 'mold-1',
      markedAt: '2026-05-10T02:50:00.000Z'
    })
    expect(markedForScrap.productionMold.currentStatus).toBe(ProductionMoldStatus.SCRAP_PENDING)
    expect(markedForScrap.productionMold.currentInstallationSummary?.toolingInstallationId).toBe(installed.toolingInstallation.toolingInstallationId)

    const currentAfterMark = await query.listCurrentMoldsByWorkCenter({
      ...queryContext(),
      workCenterId: 'wc-1'
    })
    expect(currentAfterMark.items[0]?.productionMold.currentStatus).toBe(ProductionMoldStatus.SCRAP_PENDING)
    expect(currentAfterMark.items[0]?.usageAllowed).toBe(false)

    await expect(
      management.recordMoldUsage({
        ...commandContext('cmd-usage-scrap-pending'),
        productionMoldId: 'mold-1',
        toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
        workCenterRef: {
          workCenterId: 'wc-1'
        },
        usageQuantity: '1',
        lifeUnit: 'CASTING_CYCLE'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })

    const unmounted = await management.unmountTooling({
      ...commandContext('cmd-unmount-1'),
      toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
      unmountedAt: '2026-05-10T03:00:00.000Z'
    })
    expect(unmounted.toolingInstallation.status).toBe(ToolingInstallationStatus.UNMOUNTED)
    expect((await repository.findProductionMoldById(tenantId, 'mold-1'))?.currentStatus).toBe(ProductionMoldStatus.SCRAPPED)

    await expect(
      management.unmountTooling({
        ...otherOrgCommand,
        commandId: 'cmd-cross-org-unmount',
        toolingInstallationId: installed.toolingInstallation.toolingInstallationId
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })

    await expect(
      management.markProductionMoldForScrap({
        ...otherOrgCommand,
        commandId: 'cmd-cross-org-scrap',
        productionMoldId: 'mold-1',
        markedAt: '2026-05-10T04:00:00.000Z'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.NOT_FOUND } })
    await expect(
      management.adjustMoldLifeCounter({
        ...commandContext('cmd-adjust-scrapped'),
        moldLifeCounterId: usage.moldLifeCounter.moldLifeCounterId,
        adjustmentType: MoldLifeAdjustmentType.ADD_USED_VALUE,
        value: '1'
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })
    expect(repository.audits.length).toBeGreaterThanOrEqual(9)
    expect(repository.outbox.some((event) => event.eventType === 'ProductionMoldScrapped')).toBe(true)
  })

  it('queries / exposes current contract envelopes for selectors, placement, history, and counters', async () => {
    const { management, query } = createHarness()
    await registerDesign(management)
    await management.registerProductionMold({
      ...commandContext('cmd-mold-1'),
      productionMoldId: 'mold-1',
      moldCode: 'pm-body-a-1',
      moldDesignId: 'design-1',
      initialStorageResourceRef: {
        storageResourceId: 'storage-ready'
      }
    })
    await management.confirmProductionMoldArrival({
      ...commandContext('cmd-arrival-1'),
      productionMoldId: 'mold-1'
    })
    await management.moveTooling({
      ...commandContext('cmd-move-1'),
      toolingType: ToolingType.MOLD,
      toolingId: 'mold-1',
      toStorageResourceRef: {
        storageResourceId: 'storage-line'
      }
    })

    const design = await query.getMoldDesign({
      ...queryContext(),
      moldDesignId: 'design-1'
    })
    expect(design.moldDesignId).toBe('design-1')

    const designs = await query.listMoldDesigns({
      ...queryContext(),
      productionSpecId: 'spec-1',
      page: 1,
      pageSize: 10
    })
    expect(designs.moldDesigns).toHaveLength(1)

    const mold = await query.getProductionMold({
      ...queryContext(),
      productionMoldId: 'mold-1'
    })
    expect(mold.productionMoldId).toBe('mold-1')

    const molds = await query.listProductionMolds({
      ...queryContext(),
      storageResourceId: 'storage-line',
      page: 1,
      pageSize: 10
    })
    expect(molds.productionMolds.map((item) => item.productionMoldId)).toEqual(['mold-1'])

    const byDesign = await query.listProductionMoldsByDesign({
      ...queryContext(),
      moldDesignId: 'design-1',
      page: 1,
      pageSize: 10
    })
    expect(byDesign.moldDesignSummary.moldDesignId).toBe('design-1')
    expect(byDesign.productionMolds).toHaveLength(1)

    const placement = await query.getToolingCurrentPlacement({
      ...queryContext(),
      toolingType: ToolingType.MOLD,
      toolingId: 'mold-1'
    })
    expect(placement.placement.placementType).toBe(ToolingPlacementType.STORAGE_RESOURCE)

    const history = await query.getMoldUsageHistory({
      ...queryContext(),
      productionMoldId: 'mold-1',
      page: 1,
      pageSize: 10
    })
    expect(history.entries.map((entry) => entry.entryType)).toEqual([MoldUsageHistoryEntryType.MOVE])

    const counters = await query.listMoldLifeCounters({
      ...queryContext(),
      productionMoldId: 'mold-1',
      page: 1,
      pageSize: 10
    })
    expect(counters.counters[0]?.productionMoldId).toBe('mold-1')
  })
})
