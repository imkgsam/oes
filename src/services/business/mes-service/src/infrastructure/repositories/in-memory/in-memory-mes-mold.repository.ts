import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  CurrentMoldByWorkCenterRecord,
  MasterMoldRecord,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  MoldDesignRecord,
  MoldDesignSummaryRecord,
  MoldLifeCounterRecord,
  MoldMovementRecord,
  MoldUsageHistoryEntryRecord,
  MoldUsageHistoryEntryType,
  MoldUsageRecord,
  MoldWarningLevel,
  ProductionMoldRecord,
  ProductionMoldStatus,
  ProductionMoldSummaryRecord,
  ToolingInstallationRecord,
  ToolingInstallationStatus,
  ToolingPlacementSummaryRecord,
  ToolingPlacementType,
  ToolingType
} from '../../../domain/models/mes-mold-records'
import {
  GetMoldUsageHistoryInput,
  ListCurrentMoldsByWorkCenterInput,
  ListMoldLifeCountersInput,
  ListProductionMoldsByDesignInput,
  MesMoldRepository,
  SearchMoldDesignsInput,
  SearchMasterMoldsInput,
  SearchProductionMoldsInput
} from '../../../domain/repositories/mes-mold.repository'
import { MES_NOT_FOUND } from '../../../common/errors/mes.errors'
import { MesInMemoryStore } from '../../store/mes-in-memory-store'

/** InMemoryMesMoldRepository keeps Mold / Tooling repository behavior deterministic without external infrastructure. */
@Injectable()
export class InMemoryMesMoldRepository implements MesMoldRepository {
  constructor(private readonly store: MesInMemoryStore = new MesInMemoryStore()) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const snapshot = snapshotStore(this.store)
    try {
      return await callback()
    } catch (error) {
      restoreStore(this.store, snapshot)
      throw error
    }
  }

  async saveMoldDesign(record: MoldDesignRecord): Promise<MoldDesignRecord> {
    this.store.moldDesigns.set(record.moldDesignId, clone(record))
    return clone(record)
  }

  async findMoldDesignById(tenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null> {
    return cloneOrNull(matchTenant(this.store.moldDesigns.get(moldDesignId), tenantId))
  }

  async findMoldDesignByCode(tenantId: string, orgId: string | null | undefined, designCode: string) {
    return cloneOrNull(
      Array.from(this.store.moldDesigns.values()).find(
        (record) => record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.designCode === designCode
      )
    )
  }

  async searchMoldDesigns(input: SearchMoldDesignsInput) {
    const keyword = input.keyword?.trim().toUpperCase()
    const records = Array.from(this.store.moldDesigns.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !keyword || record.designCode.toUpperCase().includes(keyword) || record.name.toUpperCase().includes(keyword))
      .filter((record) => !input.productionSpecId || record.productionSpecRefs.some((ref) => ref.productionSpecId === input.productionSpecId))
      .filter((record) => !input.itemModelId || record.primaryItemModelRef.itemModelId === input.itemModelId)
      .filter((record) => !input.status || record.status === input.status)
      .sort((left, right) => left.designCode.localeCompare(right.designCode))
    const page = paginate(records.map(toMoldDesignSummary), input.page, input.pageSize)
    return { moldDesigns: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async saveMasterMold(record: MasterMoldRecord): Promise<MasterMoldRecord> {
    this.store.masterMolds.set(record.masterMoldId, clone(record))
    return clone(record)
  }

  async findMasterMoldById(tenantId: string, masterMoldId: string): Promise<MasterMoldRecord | null> {
    return cloneOrNull(matchTenant(this.store.masterMolds.get(masterMoldId), tenantId))
  }

  async findMasterMoldByCode(tenantId: string, orgId: string | null | undefined, masterMoldCode: string) {
    return cloneOrNull(
      Array.from(this.store.masterMolds.values()).find(
        (record) => record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.masterMoldCode === masterMoldCode
      )
    )
  }

  async searchMasterMolds(input: SearchMasterMoldsInput) {
    const keyword = input.keyword?.trim().toUpperCase()
    const records = Array.from(this.store.masterMolds.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !keyword || record.masterMoldCode.toUpperCase().includes(keyword))
      .filter((record) => !input.moldDesignId || record.moldDesignId === input.moldDesignId)
      .filter((record) => !input.status || record.currentStatus === input.status)
      .filter((record) => !input.storageResourceId || record.currentStorageResourceRef?.storageResourceId === input.storageResourceId)
      .filter((record) => !input.carrierResourceId || record.currentCarrierResourceRef?.carrierResourceId === input.carrierResourceId)
      .sort((left, right) => left.masterMoldCode.localeCompare(right.masterMoldCode))
    const page = paginate(records.map((record) => this.toMasterMoldSummary(record)), input.page, input.pageSize)
    return { masterMolds: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async saveProductionMold(record: ProductionMoldRecord): Promise<ProductionMoldRecord> {
    this.store.productionMolds.set(record.productionMoldId, clone(record))
    return clone(record)
  }

  async findProductionMoldById(tenantId: string, productionMoldId: string): Promise<ProductionMoldRecord | null> {
    return cloneOrNull(matchTenant(this.store.productionMolds.get(productionMoldId), tenantId))
  }

  async findProductionMoldByCode(tenantId: string, orgId: string | null | undefined, moldCode: string) {
    return cloneOrNull(
      Array.from(this.store.productionMolds.values()).find(
        (record) => record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.moldCode === moldCode
      )
    )
  }

  async searchProductionMolds(input: SearchProductionMoldsInput) {
    const records = Array.from(this.store.productionMolds.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !input.moldDesignId || record.moldDesignId === input.moldDesignId)
      .filter((record) => !input.status || record.currentStatus === input.status)
      .filter((record) => !input.storageResourceId || record.currentStorageResourceRef?.storageResourceId === input.storageResourceId)
      .filter((record) => !input.carrierResourceId || record.currentCarrierResourceRef?.carrierResourceId === input.carrierResourceId)
      .sort((left, right) => left.moldCode.localeCompare(right.moldCode))
    const summaries = records.map((record) => this.toProductionMoldSummary(record))
    const filtered = input.warningLevel
      ? summaries.filter((summary) => summary.lifeCounterSummary?.warningLevel === input.warningLevel)
      : summaries
    const page = paginate(filtered, input.page, input.pageSize)
    return { productionMolds: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async listProductionMoldsByDesign(input: ListProductionMoldsByDesignInput) {
    const design = this.store.moldDesigns.get(input.moldDesignId)
    if (!design || design.tenantId !== input.tenantId || !sameOrg(design.orgId, input.orgId)) {
      throw ExceptionFactory.application(MES_NOT_FOUND, { resource: 'MoldDesign', identifier: input.moldDesignId })
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
      moldDesignSummary: toMoldDesignSummary(design),
      productionMolds: page.productionMolds,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize
    }
  }

  async getToolingCurrentPlacement(tenantId: string, toolingType: ToolingType, toolingId: string): Promise<ToolingPlacementSummaryRecord | null> {
    if (toolingType !== ToolingType.MOLD) {
      return null
    }
    const mold = this.store.productionMolds.get(toolingId)
    if (!mold || mold.tenantId !== tenantId) {
      return null
    }
    if (mold.currentInstallationSummary) {
      return {
        placementType: mold.currentInstallationSummary.workUnitRef ? ToolingPlacementType.WORK_UNIT : ToolingPlacementType.WORK_CENTER,
        workCenterRef: mold.currentInstallationSummary.workCenterRef,
        workUnitRef: mold.currentInstallationSummary.workUnitRef ?? null,
        toolingInstallationId: mold.currentInstallationSummary.toolingInstallationId,
        moldInstallationDetail: mold.currentInstallationSummary.moldDetail ?? null
      }
    }
    if (mold.currentCarrierResourceRef) {
      return { placementType: ToolingPlacementType.CARRIER_RESOURCE, carrierResourceRef: clone(mold.currentCarrierResourceRef) }
    }
    return { placementType: ToolingPlacementType.STORAGE_RESOURCE, storageResourceRef: clone(mold.currentStorageResourceRef ?? null) }
  }

  async appendMoldMovement(record: MoldMovementRecord): Promise<MoldMovementRecord> {
    this.store.movements.push(clone(record))
    return clone(record)
  }

  async findLastMoldMovement(tenantId: string, toolingType: ToolingType, toolingId: string) {
    return cloneOrNull(
      this.store.movements
        .filter((record) => record.tenantId === tenantId && record.toolingType === toolingType && record.toolingId === toolingId)
        .sort((left, right) => right.movedAt.localeCompare(left.movedAt))[0]
    )
  }

  async listMoldMovementsByTooling(tenantId: string, toolingType: ToolingType, toolingId: string): Promise<MoldMovementRecord[]> {
    return clone(
      this.store.movements.filter((record) => record.tenantId === tenantId && record.toolingType === toolingType && record.toolingId === toolingId)
    )
  }

  async saveToolingInstallation(record: ToolingInstallationRecord): Promise<ToolingInstallationRecord> {
    this.store.toolingInstallations.set(record.toolingInstallationId, clone(record))
    return clone(record)
  }

  async findToolingInstallationById(tenantId: string, toolingInstallationId: string) {
    return cloneOrNull(matchTenant(this.store.toolingInstallations.get(toolingInstallationId), tenantId))
  }

  async findActiveToolingInstallationByMold(tenantId: string, productionMoldId: string) {
    return cloneOrNull(
      Array.from(this.store.toolingInstallations.values()).find(
        (record) =>
          record.tenantId === tenantId &&
          record.toolingType === ToolingType.MOLD &&
          record.toolingId === productionMoldId &&
          record.status === ToolingInstallationStatus.ACTIVE &&
          !record.unmountedAt
      )
    )
  }

  async listToolingInstallationsByMold(tenantId: string, productionMoldId: string): Promise<ToolingInstallationRecord[]> {
    return clone(
      Array.from(this.store.toolingInstallations.values()).filter(
        (record) => record.tenantId === tenantId && record.toolingType === ToolingType.MOLD && record.toolingId === productionMoldId
      )
    )
  }

  async listCurrentMoldsByWorkCenter(input: ListCurrentMoldsByWorkCenterInput) {
    const items: CurrentMoldByWorkCenterRecord[] = []
    for (const installation of this.store.toolingInstallations.values()) {
      if (
        installation.tenantId !== input.tenantId ||
        installation.status !== ToolingInstallationStatus.ACTIVE ||
        installation.workCenterRef.workCenterId !== input.workCenterId ||
        (input.orgId && !sameOrg(installation.orgId, input.orgId)) ||
        (input.workUnitId && installation.workUnitRef?.workUnitId !== input.workUnitId)
      ) {
        continue
      }
      const mold = this.store.productionMolds.get(installation.toolingId)
      if (mold) {
        items.push({
          productionMold: this.toProductionMoldSummary(mold),
          toolingInstallation: clone(installation),
          usageAllowed: mold.currentStatus === ProductionMoldStatus.INSTALLED,
          usageDisabledReason: mold.currentStatus === ProductionMoldStatus.INSTALLED ? null : `MOLD_${mold.currentStatus}`
        })
      }
    }
    return { items }
  }

  async appendMoldUsageRecord(record: MoldUsageRecord): Promise<MoldUsageRecord> {
    this.store.usageRecords.push(clone(record))
    return clone(record)
  }

  async listMoldUsageRecordsByMold(tenantId: string, productionMoldId: string): Promise<MoldUsageRecord[]> {
    return clone(this.store.usageRecords.filter((record) => record.tenantId === tenantId && record.productionMoldId === productionMoldId))
  }

  async findLastMoldUsageRecordByMold(tenantId: string, productionMoldId: string) {
    return cloneOrNull(
      this.store.usageRecords
        .filter((record) => record.tenantId === tenantId && record.productionMoldId === productionMoldId)
        .sort((left, right) => right.usedAt.localeCompare(left.usedAt))[0]
    )
  }

  async getMoldUsageHistory(input: GetMoldUsageHistoryInput) {
    const entries = [
      ...Array.from(this.store.toolingInstallations.values())
        .filter((record) => record.tenantId === input.tenantId && record.toolingType === ToolingType.MOLD && record.toolingId === input.productionMoldId)
        .filter((record) => (!input.orgId || sameOrg(record.orgId, input.orgId)))
        .flatMap<MoldUsageHistoryEntryRecord>((record) => [
          {
            entryType: MoldUsageHistoryEntryType.INSTALL,
            happenedAt: record.installedAt,
            productionMoldId: record.toolingId,
            summary: `Tooling installed at ${record.workCenterRef.workCenterId}`,
            auditRef: record.auditRef
          },
          ...(record.unmountedAt
            ? [
                {
                  entryType: MoldUsageHistoryEntryType.UNMOUNT,
                  happenedAt: record.unmountedAt,
                  productionMoldId: record.toolingId,
                  summary: 'Tooling unmounted',
                  auditRef: record.auditRef
                }
              ]
            : [])
        ]),
      ...this.store.movements
        .filter((record) => record.tenantId === input.tenantId && record.toolingType === ToolingType.MOLD && record.toolingId === input.productionMoldId)
        .filter((record) => (!input.orgId || sameOrg(record.orgId, input.orgId)))
        .map<MoldUsageHistoryEntryRecord>((record) => ({
          entryType: MoldUsageHistoryEntryType.MOVE,
          happenedAt: record.movedAt,
          productionMoldId: record.toolingId,
          summary: 'Tooling moved',
          auditRef: record.auditRef
        })),
      ...Array.from(this.store.lifeCounters.values())
        .filter((record) => record.tenantId === input.tenantId && record.productionMoldId === input.productionMoldId && !!record.lastAdjustedAt)
        .filter((record) => (!input.orgId || sameOrg(record.orgId, input.orgId)))
        .map<MoldUsageHistoryEntryRecord>((record) => ({
          entryType: MoldUsageHistoryEntryType.LIFE_ADJUSTMENT,
          happenedAt: record.lastAdjustedAt!,
          productionMoldId: record.productionMoldId,
          summary: 'Mold life counter adjusted',
          auditRef: null
        })),
      ...Array.from(this.store.productionMolds.values())
        .filter((record) => record.tenantId === input.tenantId && record.productionMoldId === input.productionMoldId && !!record.scrappedAt)
        .filter((record) => (!input.orgId || sameOrg(record.orgId, input.orgId)))
        .map<MoldUsageHistoryEntryRecord>((record) => ({
          entryType: MoldUsageHistoryEntryType.SCRAP,
          happenedAt: record.scrappedAt!,
          productionMoldId: record.productionMoldId,
          summary: 'Production mold scrapped',
          auditRef: null
        })),
      ...this.store.usageRecords
      .filter((record) => record.tenantId === input.tenantId && record.productionMoldId === input.productionMoldId)
      .filter((record) => (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .map<MoldUsageHistoryEntryRecord>((record) => ({
        entryType: MoldUsageHistoryEntryType.USAGE,
        happenedAt: record.usedAt,
        productionMoldId: record.productionMoldId,
        summary: `Mold usage ${record.usageQuantity} ${record.lifeUnit}`,
        auditRef: record.auditRef
      }))
    ]
      .filter((entry) => (!input.from || entry.happenedAt >= input.from) && (!input.to || entry.happenedAt <= input.to))
      .sort((left, right) => left.happenedAt.localeCompare(right.happenedAt))
    const page = paginate(entries, input.page, input.pageSize)
    return { entries: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async saveMoldLifeCounter(record: MoldLifeCounterRecord): Promise<MoldLifeCounterRecord> {
    this.store.lifeCounters.set(record.moldLifeCounterId, clone(record))
    return clone(record)
  }

  async findMoldLifeCounterById(tenantId: string, moldLifeCounterId: string) {
    return cloneOrNull(matchTenant(this.store.lifeCounters.get(moldLifeCounterId), tenantId))
  }

  async findMoldLifeCounterByProductionMold(tenantId: string, productionMoldId: string) {
    return cloneOrNull(
      Array.from(this.store.lifeCounters.values()).find(
        (record) => record.tenantId === tenantId && record.productionMoldId === productionMoldId
      )
    )
  }

  async listMoldLifeCounters(input: ListMoldLifeCountersInput) {
    const records = Array.from(this.store.lifeCounters.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !input.productionMoldId || record.productionMoldId === input.productionMoldId)
      .filter((record) => !input.warningLevel || deriveWarningLevel(record) === input.warningLevel)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    const page = paginate(records, input.page, input.pageSize)
    return { counters: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord> {
    this.store.auditEnvelopes.push(clone(record))
    return clone(record)
  }

  async appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord> {
    this.store.outboxEvents.push(clone(record))
    return clone(record)
  }

  async saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord> {
    const key = idempotencyKey(record.tenantId, record.commandId)
    const existing = this.store.commandIdempotencyRecords.get(key)
    const saved = existing && existing.mesCommandIdempotencyId !== record.mesCommandIdempotencyId ? existing : record
    this.store.commandIdempotencyRecords.set(key, clone(saved))
    return clone(saved)
  }

  async findCommandIdempotencyRecord(tenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null> {
    return cloneOrNull(this.store.commandIdempotencyRecords.get(idempotencyKey(tenantId, commandId)))
  }

  /** toProductionMoldSummary enriches one production mold with design and counter summaries. */
  private toProductionMoldSummary(record: ProductionMoldRecord): ProductionMoldSummaryRecord {
    const design = this.store.moldDesigns.get(record.moldDesignId)
    const counter = Array.from(this.store.lifeCounters.values()).find((candidate) => candidate.productionMoldId === record.productionMoldId)
    return {
      productionMoldId: record.productionMoldId,
      moldCode: record.moldCode,
      moldDesignSummary: design ? toMoldDesignSummary(design) : {
        moldDesignId: record.moldDesignId,
        designCode: '',
        name: '',
        revisionCode: null,
        status: 'INACTIVE' as MoldDesignSummaryRecord['status']
      },
      currentStatus: record.currentStatus as ProductionMoldStatus,
      currentPlacementSummary: record.currentInstallationSummary
        ? {
            placementType: record.currentInstallationSummary.workUnitRef ? ToolingPlacementType.WORK_UNIT : ToolingPlacementType.WORK_CENTER,
            workCenterRef: record.currentInstallationSummary.workCenterRef,
            workUnitRef: record.currentInstallationSummary.workUnitRef ?? null,
            toolingInstallationId: record.currentInstallationSummary.toolingInstallationId,
            moldInstallationDetail: record.currentInstallationSummary.moldDetail ?? null
          }
        : record.currentCarrierResourceRef
          ? { placementType: ToolingPlacementType.CARRIER_RESOURCE, carrierResourceRef: record.currentCarrierResourceRef }
          : { placementType: ToolingPlacementType.STORAGE_RESOURCE, storageResourceRef: record.currentStorageResourceRef ?? null },
      lifeCounterSummary: counter ? toMoldLifeCounterSummary(counter) : record.lifeCounterSummary ?? null
    }
  }

  /** toMasterMoldSummary enriches one master mold with its design and placement summaries. */
  private toMasterMoldSummary(record: MasterMoldRecord) {
    const design = this.store.moldDesigns.get(record.moldDesignId)
    return {
      masterMoldId: record.masterMoldId,
      masterMoldCode: record.masterMoldCode,
      moldDesignSummary: design ? toMoldDesignSummary(design) : {
        moldDesignId: record.moldDesignId,
        designCode: '',
        name: '',
        revisionCode: null,
        status: 'INACTIVE' as MoldDesignSummaryRecord['status']
      },
      currentStatus: record.currentStatus,
      currentPlacementSummary: record.currentCarrierResourceRef
        ? { placementType: ToolingPlacementType.CARRIER_RESOURCE, carrierResourceRef: record.currentCarrierResourceRef }
        : { placementType: ToolingPlacementType.STORAGE_RESOURCE, storageResourceRef: record.currentStorageResourceRef ?? null }
    }
  }
}

/** toMoldDesignSummary projects one design into a list/query summary row. */
function toMoldDesignSummary(record: MoldDesignRecord): MoldDesignSummaryRecord {
  return {
    moldDesignId: record.moldDesignId,
    designCode: record.designCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    status: record.status,
    primaryItemModelRef: record.primaryItemModelRef
  }
}

/** toMoldLifeCounterSummary projects one counter into a mold summary shape. */
function toMoldLifeCounterSummary(record: MoldLifeCounterRecord) {
  const remainingValue =
    record.limitValue === null || record.limitValue === undefined
      ? null
      : (Number(record.limitValue) - Number(record.usedValue)).toString()
  return {
    moldLifeCounterId: record.moldLifeCounterId,
    lifeUnit: record.lifeUnit,
    usedValue: record.usedValue,
    limitValue: record.limitValue ?? null,
    warningThresholdValue: record.warningThresholdValue ?? null,
    remainingValue,
    warningLevel: deriveWarningLevel(record),
    lastUsageRecordId: record.lastUsageRecordId ?? null,
    lastAdjustedAt: record.lastAdjustedAt ?? null
  }
}

/** deriveWarningLevel computes the read-side warning bucket from the counter thresholds. */
function deriveWarningLevel(record: MoldLifeCounterRecord): MoldWarningLevel {
  const used = Number(record.usedValue)
  const limit = record.limitValue === null || record.limitValue === undefined ? Number.NaN : Number(record.limitValue)
  const threshold = record.warningThresholdValue === null || record.warningThresholdValue === undefined ? Number.NaN : Number(record.warningThresholdValue)
  if (Number.isFinite(limit) && used >= limit) {
    return MoldWarningLevel.CRITICAL
  }
  if (Number.isFinite(threshold) && used >= threshold) {
    return MoldWarningLevel.WARNING
  }
  return MoldWarningLevel.INFO
}

/** snapshotStore copies the in-memory store so command transactions can roll back failed writes. */
function snapshotStore(store: MesInMemoryStore): MesInMemoryStoreSnapshot {
  return {
    moldDesigns: clone(Array.from(store.moldDesigns.entries())),
    masterMolds: clone(Array.from(store.masterMolds.entries())),
    productionMolds: clone(Array.from(store.productionMolds.entries())),
    lifeCounters: clone(Array.from(store.lifeCounters.entries())),
    movements: clone(store.movements),
    toolingInstallations: clone(Array.from(store.toolingInstallations.entries())),
    usageRecords: clone(store.usageRecords),
    auditEnvelopes: clone(store.auditEnvelopes),
    outboxEvents: clone(store.outboxEvents),
    commandIdempotencyRecords: clone(Array.from(store.commandIdempotencyRecords.entries()))
  }
}

/** restoreStore restores a transaction snapshot after an in-memory command failure. */
function restoreStore(store: MesInMemoryStore, snapshot: MesInMemoryStoreSnapshot): void {
  restoreMap(store.moldDesigns, snapshot.moldDesigns)
  restoreMap(store.masterMolds, snapshot.masterMolds)
  restoreMap(store.productionMolds, snapshot.productionMolds)
  restoreMap(store.lifeCounters, snapshot.lifeCounters)
  restoreArray(store.movements, snapshot.movements)
  restoreMap(store.toolingInstallations, snapshot.toolingInstallations)
  restoreArray(store.usageRecords, snapshot.usageRecords)
  restoreArray(store.auditEnvelopes, snapshot.auditEnvelopes)
  restoreArray(store.outboxEvents, snapshot.outboxEvents)
  restoreMap(store.commandIdempotencyRecords, snapshot.commandIdempotencyRecords)
}

/** restoreMap replaces a target map with cloned snapshot entries. */
function restoreMap<K, V>(target: Map<K, V>, entries: Array<[K, V]>): void {
  target.clear()
  for (const [key, value] of entries) {
    target.set(key, clone(value))
  }
}

/** restoreArray replaces a target array with cloned snapshot values. */
function restoreArray<T>(target: T[], values: T[]): void {
  target.splice(0, target.length, ...clone(values))
}

/** idempotencyKey scopes command replay records to one tenant boundary. */
function idempotencyKey(tenantId: string, commandId: string): string {
  return `${tenantId}:${commandId}`
}

/** sameOrg compares optional organization scopes using null as the canonical empty scope. */
function sameOrg(recordOrgId: string | null | undefined, orgId: string | null | undefined): boolean {
  return (recordOrgId ?? null) === (orgId ?? null)
}

/** matchTenant returns a record only when it belongs to the requested tenant. */
function matchTenant<T extends { tenantId: string }>(record: T | undefined, tenantId: string): T | null {
  return record && record.tenantId === tenantId ? record : null
}

/** paginate slices an already sorted in-memory result set. */
function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
}

/** clone creates a JSON-safe copy of an in-memory record. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** cloneOrNull creates a JSON-safe copy while preserving null empty results. */
function cloneOrNull<T>(value: T | null | undefined): T | null {
  return value ? clone(value) : null
}

interface MesInMemoryStoreSnapshot {
  moldDesigns: Array<[string, MoldDesignRecord]>
  masterMolds: Array<[string, MasterMoldRecord]>
  productionMolds: Array<[string, ProductionMoldRecord]>
  lifeCounters: Array<[string, MoldLifeCounterRecord]>
  movements: MoldMovementRecord[]
  toolingInstallations: Array<[string, ToolingInstallationRecord]>
  usageRecords: MoldUsageRecord[]
  auditEnvelopes: MesAuditEnvelopeRecord[]
  outboxEvents: MesOutboxEventRecord[]
  commandIdempotencyRecords: Array<[string, MesCommandIdempotencyRecord]>
}
