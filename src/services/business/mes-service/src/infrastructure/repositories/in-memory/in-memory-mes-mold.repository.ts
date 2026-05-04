import { Injectable } from '@nestjs/common'
import {
  MasterMoldRecord,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesLocationRecord,
  MesOutboxEventRecord,
  MoldDesignRecord,
  MoldInstallationRecord,
  MoldInstallationStatus,
  MoldLifeCounterRecord,
  MoldMovementEventRecord,
  MoldResourceType,
  MoldUsageEventRecord,
  MoldWarningEventRecord,
  MoldWarningStatus,
  MoldWarningType,
  PageResult,
  ProductionMoldInstanceRecord,
  ResourcePositionRecord,
  WorkCenterRecord
} from '../../../domain/models/mes-mold-records'
import {
  MesMoldRepository,
  SearchMoldDesignsInput,
  SearchMoldWarningsInput,
  SearchProductionMoldInstancesInput
} from '../../../domain/repositories/mes-mold.repository'
import { paginate } from '../../../application/support/mes-assertions'
import { MesInMemoryStore } from '../../store/mes-in-memory-store'

/** InMemoryMesMoldRepository keeps MES mold behavior tests deterministic without external infrastructure. */
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

  async findMoldDesignByCode(
    tenantId: string,
    orgId: string | null | undefined,
    designCode: string
  ): Promise<MoldDesignRecord | null> {
    return cloneOrNull(
      Array.from(this.store.moldDesigns.values()).find(
        (record) => record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.designCode === designCode
      )
    )
  }

  async searchMoldDesigns(input: SearchMoldDesignsInput): Promise<PageResult<MoldDesignRecord>> {
    const keyword = input.keyword?.trim().toUpperCase()
    const records = Array.from(this.store.moldDesigns.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !keyword || record.designCode.includes(keyword) || record.name.toUpperCase().includes(keyword))
      .filter((record) => !input.productFamilyRefId || record.productFamilyRef.refId === input.productFamilyRefId)
      .filter(
        (record) =>
          !input.manufacturingSpecRefId ||
          record.manufacturingSpecRefs.some((ref) => ref.refId === input.manufacturingSpecRefId)
      )
      .filter((record) => !input.itemId || record.itemRef?.itemId === input.itemId)
      .filter((record) => !input.materialType || record.materialType === input.materialType)
      .filter((record) => !input.functionRole || record.functionRole === input.functionRole)
      .filter(
        (record) => !input.productionMethodTag || record.productionMethodTags.includes(input.productionMethodTag)
      )
      .filter((record) => !input.status || record.status === input.status)
      .sort((left, right) => left.designCode.localeCompare(right.designCode))
    return clone(paginate(records, input.page, input.pageSize))
  }

  async saveMasterMold(record: MasterMoldRecord): Promise<MasterMoldRecord> {
    this.store.masterMolds.set(record.masterMoldId, clone(record))
    return clone(record)
  }

  async findMasterMoldById(tenantId: string, masterMoldId: string): Promise<MasterMoldRecord | null> {
    return cloneOrNull(matchTenant(this.store.masterMolds.get(masterMoldId), tenantId))
  }

  async findMasterMoldByCode(
    tenantId: string,
    orgId: string | null | undefined,
    masterMoldCode: string
  ): Promise<MasterMoldRecord | null> {
    return cloneOrNull(
      Array.from(this.store.masterMolds.values()).find(
        (record) =>
          record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.masterMoldCode === masterMoldCode
      )
    )
  }

  async saveProductionMoldInstance(record: ProductionMoldInstanceRecord): Promise<ProductionMoldInstanceRecord> {
    this.store.productionMoldInstances.set(record.productionMoldInstanceId, clone(record))
    return clone(record)
  }

  async findProductionMoldInstanceById(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<ProductionMoldInstanceRecord | null> {
    return cloneOrNull(matchTenant(this.store.productionMoldInstances.get(productionMoldInstanceId), tenantId))
  }

  async findProductionMoldInstanceByCode(
    tenantId: string,
    orgId: string | null | undefined,
    moldInstanceCode: string
  ): Promise<ProductionMoldInstanceRecord | null> {
    return cloneOrNull(
      Array.from(this.store.productionMoldInstances.values()).find(
        (record) =>
          record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.moldInstanceCode === moldInstanceCode
      )
    )
  }

  async searchProductionMoldInstances(
    input: SearchProductionMoldInstancesInput
  ): Promise<PageResult<ProductionMoldInstanceRecord>> {
    const records = Array.from(this.store.productionMoldInstances.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !input.moldDesignId || record.moldDesignId === input.moldDesignId)
      .filter((record) => !input.status || record.currentStatus === input.status)
      .filter((record) => !input.warningLevel || record.warningLevel === input.warningLevel)
      .filter((record) => !input.supplierId || record.supplierRef?.supplierId === input.supplierId)
      .sort((left, right) => left.moldInstanceCode.localeCompare(right.moldInstanceCode))
    return clone(paginate(records, input.page, input.pageSize))
  }

  async saveMoldLifeCounter(record: MoldLifeCounterRecord): Promise<MoldLifeCounterRecord> {
    this.store.lifeCounters.set(record.productionMoldInstanceId, clone(record))
    return clone(record)
  }

  async findMoldLifeCounterByInstanceId(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldLifeCounterRecord | null> {
    return cloneOrNull(matchTenant(this.store.lifeCounters.get(productionMoldInstanceId), tenantId))
  }

  async findMesLocationById(tenantId: string, mesLocationId: string): Promise<MesLocationRecord | null> {
    return cloneOrNull(matchTenant(this.store.mesLocations.get(mesLocationId), tenantId))
  }

  async findWorkCenterById(tenantId: string, workCenterId: string): Promise<WorkCenterRecord | null> {
    return cloneOrNull(matchTenant(this.store.workCenters.get(workCenterId), tenantId))
  }

  async findResourcePositionById(tenantId: string, resourcePositionId: string): Promise<ResourcePositionRecord | null> {
    return cloneOrNull(matchTenant(this.store.resourcePositions.get(resourcePositionId), tenantId))
  }

  async appendMovementEvent(record: MoldMovementEventRecord): Promise<MoldMovementEventRecord> {
    this.store.movementEvents.push(clone(record))
    return clone(record)
  }

  async findLastMovementEvent(
    tenantId: string,
    moldResourceType: MoldResourceType,
    moldResourceId: string
  ): Promise<MoldMovementEventRecord | null> {
    return cloneOrNull(
      this.store.movementEvents
        .filter(
          (record) =>
            record.tenantId === tenantId &&
            record.moldResourceType === moldResourceType &&
            record.moldResourceId === moldResourceId
        )
        .sort((left, right) => right.movedAt.localeCompare(left.movedAt))[0]
    )
  }

  async listMovementEventsByResource(
    tenantId: string,
    moldResourceType: MoldResourceType,
    moldResourceId: string
  ): Promise<MoldMovementEventRecord[]> {
    return clone(
      this.store.movementEvents.filter(
        (record) =>
          record.tenantId === tenantId &&
          record.moldResourceType === moldResourceType &&
          record.moldResourceId === moldResourceId
      )
    )
  }

  async saveMoldInstallation(record: MoldInstallationRecord): Promise<MoldInstallationRecord> {
    this.store.installations.set(record.moldInstallationId, clone(record))
    return clone(record)
  }

  async findMoldInstallationById(tenantId: string, moldInstallationId: string): Promise<MoldInstallationRecord | null> {
    return cloneOrNull(matchTenant(this.store.installations.get(moldInstallationId), tenantId))
  }

  async findActiveInstallationByMold(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldInstallationRecord | null> {
    return cloneOrNull(
      Array.from(this.store.installations.values()).find(
        (record) =>
          record.tenantId === tenantId &&
          record.productionMoldInstanceId === productionMoldInstanceId &&
          record.installationStatus === MoldInstallationStatus.ACTIVE &&
          !record.unmountedAt
      )
    )
  }

  async findActiveInstallationByPosition(
    tenantId: string,
    resourcePositionId: string
  ): Promise<MoldInstallationRecord | null> {
    return cloneOrNull(
      Array.from(this.store.installations.values()).find(
        (record) =>
          record.tenantId === tenantId &&
          record.resourcePositionId === resourcePositionId &&
          record.installationStatus === MoldInstallationStatus.ACTIVE &&
          !record.unmountedAt
      )
    )
  }

  async listActiveInstallationsByWorkCenter(tenantId: string, workCenterId: string): Promise<MoldInstallationRecord[]> {
    return clone(
      Array.from(this.store.installations.values()).filter(
        (record) =>
          record.tenantId === tenantId &&
          record.workCenterId === workCenterId &&
          record.installationStatus === MoldInstallationStatus.ACTIVE &&
          !record.unmountedAt
      )
    )
  }

  async listInstallationsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldInstallationRecord[]> {
    return clone(
      Array.from(this.store.installations.values()).filter(
        (record) => record.tenantId === tenantId && record.productionMoldInstanceId === productionMoldInstanceId
      )
    )
  }

  async appendUsageEvent(record: MoldUsageEventRecord): Promise<MoldUsageEventRecord> {
    this.store.usageEvents.push(clone(record))
    return clone(record)
  }

  async listUsageEventsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldUsageEventRecord[]> {
    return clone(
      this.store.usageEvents.filter(
        (record) => record.tenantId === tenantId && record.productionMoldInstanceId === productionMoldInstanceId
      )
    )
  }

  async findLastUsageEventByMold(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldUsageEventRecord | null> {
    return cloneOrNull(
      this.store.usageEvents
        .filter((record) => record.tenantId === tenantId && record.productionMoldInstanceId === productionMoldInstanceId)
        .sort((left, right) => right.usedAt.localeCompare(left.usedAt))[0]
    )
  }

  async saveMoldWarningEvent(record: MoldWarningEventRecord): Promise<MoldWarningEventRecord> {
    const existingIndex = this.store.warningEvents.findIndex(
      (candidate) => candidate.moldWarningEventId === record.moldWarningEventId
    )
    if (existingIndex >= 0) {
      this.store.warningEvents[existingIndex] = clone(record)
    } else {
      this.store.warningEvents.push(clone(record))
    }
    return clone(record)
  }

  async findMoldWarningEventById(tenantId: string, moldWarningEventId: string): Promise<MoldWarningEventRecord | null> {
    return cloneOrNull(
      this.store.warningEvents.find(
        (record) => record.tenantId === tenantId && record.moldWarningEventId === moldWarningEventId
      )
    )
  }

  async findOpenWarningByMoldAndType(
    tenantId: string,
    productionMoldInstanceId: string,
    warningType: MoldWarningType
  ): Promise<MoldWarningEventRecord | null> {
    return cloneOrNull(
      this.store.warningEvents.find(
        (record) =>
          record.tenantId === tenantId &&
          record.productionMoldInstanceId === productionMoldInstanceId &&
          record.warningType === warningType &&
          record.status === MoldWarningStatus.OPEN
      )
    )
  }

  async findCurrentWarningByMold(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldWarningEventRecord | null> {
    return cloneOrNull(
      this.store.warningEvents
        .filter(
          (record) =>
            record.tenantId === tenantId &&
            record.productionMoldInstanceId === productionMoldInstanceId &&
            record.status === MoldWarningStatus.OPEN
        )
        .sort((left, right) => severityRank(right.warningLevel) - severityRank(left.warningLevel))[0]
    )
  }

  async searchMoldWarnings(input: SearchMoldWarningsInput): Promise<PageResult<MoldWarningEventRecord>> {
    const records = this.store.warningEvents
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.warningType || record.warningType === input.warningType)
      .filter((record) => !input.warningLevel || record.warningLevel === input.warningLevel)
      .filter((record) => !input.raisedFrom || record.raisedAt >= input.raisedFrom)
      .filter((record) => !input.raisedTo || record.raisedAt <= input.raisedTo)
      .filter((record) => {
        if (!input.moldDesignId && !input.workCenterId) {
          return true
        }
        const instance = this.store.productionMoldInstances.get(record.productionMoldInstanceId)
        return (
          (!input.moldDesignId || instance?.moldDesignId === input.moldDesignId) &&
          (!input.workCenterId || instance?.currentWorkCenterId === input.workCenterId)
        )
      })
      .sort((left, right) => right.raisedAt.localeCompare(left.raisedAt))
    return clone(paginate(records, input.page, input.pageSize))
  }

  async listWarningsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldWarningEventRecord[]> {
    return clone(
      this.store.warningEvents.filter(
        (record) => record.tenantId === tenantId && record.productionMoldInstanceId === productionMoldInstanceId
      )
    )
  }

  async appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord> {
    this.store.auditEnvelopes.push(clone(record))
    return clone(record)
  }

  async appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord> {
    this.store.outboxEvents.push(clone(record))
    return clone(record)
  }

  async saveCommandIdempotencyRecord(
    record: MesCommandIdempotencyRecord
  ): Promise<MesCommandIdempotencyRecord> {
    const key = idempotencyKey(record.tenantId, record.commandId)
    const existing = this.store.commandIdempotencyRecords.get(key)
    const saved = existing && existing.mesCommandIdempotencyId !== record.mesCommandIdempotencyId ? existing : record
    this.store.commandIdempotencyRecords.set(key, clone(saved))
    return clone(saved)
  }

  async findCommandIdempotencyRecord(
    tenantId: string,
    commandId: string
  ): Promise<MesCommandIdempotencyRecord | null> {
    return cloneOrNull(this.store.commandIdempotencyRecords.get(idempotencyKey(tenantId, commandId)))
  }
}

function idempotencyKey(tenantId: string, commandId: string): string {
  return `${tenantId}:${commandId}`
}

function snapshotStore(store: MesInMemoryStore): MesInMemoryStoreSnapshot {
  return {
    moldDesigns: clone(Array.from(store.moldDesigns.entries())),
    masterMolds: clone(Array.from(store.masterMolds.entries())),
    productionMoldInstances: clone(Array.from(store.productionMoldInstances.entries())),
    mesLocations: clone(Array.from(store.mesLocations.entries())),
    workCenters: clone(Array.from(store.workCenters.entries())),
    resourcePositions: clone(Array.from(store.resourcePositions.entries())),
    lifeCounters: clone(Array.from(store.lifeCounters.entries())),
    movementEvents: clone(store.movementEvents),
    installations: clone(Array.from(store.installations.entries())),
    usageEvents: clone(store.usageEvents),
    warningEvents: clone(store.warningEvents),
    auditEnvelopes: clone(store.auditEnvelopes),
    outboxEvents: clone(store.outboxEvents),
    commandIdempotencyRecords: clone(Array.from(store.commandIdempotencyRecords.entries()))
  }
}

function restoreStore(store: MesInMemoryStore, snapshot: MesInMemoryStoreSnapshot): void {
  restoreMap(store.moldDesigns, snapshot.moldDesigns)
  restoreMap(store.masterMolds, snapshot.masterMolds)
  restoreMap(store.productionMoldInstances, snapshot.productionMoldInstances)
  restoreMap(store.mesLocations, snapshot.mesLocations)
  restoreMap(store.workCenters, snapshot.workCenters)
  restoreMap(store.resourcePositions, snapshot.resourcePositions)
  restoreMap(store.lifeCounters, snapshot.lifeCounters)
  restoreArray(store.movementEvents, snapshot.movementEvents)
  restoreMap(store.installations, snapshot.installations)
  restoreArray(store.usageEvents, snapshot.usageEvents)
  restoreArray(store.warningEvents, snapshot.warningEvents)
  restoreArray(store.auditEnvelopes, snapshot.auditEnvelopes)
  restoreArray(store.outboxEvents, snapshot.outboxEvents)
  restoreMap(store.commandIdempotencyRecords, snapshot.commandIdempotencyRecords)
}

function restoreMap<K, V>(target: Map<K, V>, entries: Array<[K, V]>): void {
  target.clear()
  for (const [key, value] of entries) {
    target.set(key, clone(value))
  }
}

function restoreArray<T>(target: T[], values: T[]): void {
  target.splice(0, target.length, ...clone(values))
}

function sameOrg(recordOrgId: string | null | undefined, orgId: string | null | undefined): boolean {
  return (recordOrgId ?? null) === (orgId ?? null)
}

function matchTenant<T extends { tenantId: string }>(record: T | undefined, tenantId: string): T | null {
  return record && record.tenantId === tenantId ? record : null
}

function severityRank(level: string): number {
  return level === 'CRITICAL' ? 3 : level === 'WARNING' ? 2 : level === 'INFO' ? 1 : 0
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function cloneOrNull<T>(value: T | null | undefined): T | null {
  return value ? clone(value) : null
}

interface MesInMemoryStoreSnapshot {
  moldDesigns: Array<[string, MoldDesignRecord]>
  masterMolds: Array<[string, MasterMoldRecord]>
  productionMoldInstances: Array<[string, ProductionMoldInstanceRecord]>
  mesLocations: Array<[string, MesLocationRecord]>
  workCenters: Array<[string, WorkCenterRecord]>
  resourcePositions: Array<[string, ResourcePositionRecord]>
  lifeCounters: Array<[string, MoldLifeCounterRecord]>
  movementEvents: MoldMovementEventRecord[]
  installations: Array<[string, MoldInstallationRecord]>
  usageEvents: MoldUsageEventRecord[]
  warningEvents: MoldWarningEventRecord[]
  auditEnvelopes: MesAuditEnvelopeRecord[]
  outboxEvents: MesOutboxEventRecord[]
  commandIdempotencyRecords: Array<[string, MesCommandIdempotencyRecord]>
}
