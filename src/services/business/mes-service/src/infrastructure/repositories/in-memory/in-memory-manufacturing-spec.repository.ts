import { Injectable } from '@nestjs/common'
import { paginate } from '../../../application/support/mes-assertions'
import {
  ManufacturingSpecRecord,
  ManufacturingSpecStatus
} from '../../../domain/models/manufacturing-spec-records'
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
  MoldUsageEventRecord,
  MoldWarningEventRecord,
  ProductionMoldInstanceRecord,
  ResourcePositionRecord,
  WorkCenterRecord
} from '../../../domain/models/mes-mold-records'
import {
  ManufacturingSpecRepository,
  SearchManufacturingSpecsInput
} from '../../../domain/repositories/manufacturing-spec.repository'
import { MesInMemoryStore } from '../../store/mes-in-memory-store'

/** InMemoryManufacturingSpecRepository keeps ManufacturingSpec behavior tests deterministic without external infrastructure. */
@Injectable()
export class InMemoryManufacturingSpecRepository implements ManufacturingSpecRepository {
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

  async saveManufacturingSpec(record: ManufacturingSpecRecord): Promise<ManufacturingSpecRecord> {
    this.store.manufacturingSpecs.set(record.manufacturingSpecId, clone(record))
    return clone(record)
  }

  async findManufacturingSpecById(
    tenantId: string,
    manufacturingSpecId: string
  ): Promise<ManufacturingSpecRecord | null> {
    return cloneOrNull(matchTenant(this.store.manufacturingSpecs.get(manufacturingSpecId), tenantId))
  }

  async findManufacturingSpecByCode(
    tenantId: string,
    orgId: string | null | undefined,
    specCode: string
  ): Promise<ManufacturingSpecRecord | null> {
    return cloneOrNull(
      Array.from(this.store.manufacturingSpecs.values()).find(
        (record) => record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.specCode === specCode
      )
    )
  }

  async searchManufacturingSpecs(input: SearchManufacturingSpecsInput) {
    const keyword = input.keyword?.trim().toUpperCase()
    const records = Array.from(this.store.manufacturingSpecs.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !keyword || record.specCode.includes(keyword) || record.name.toUpperCase().includes(keyword))
      .filter((record) => !input.productFamilyRefId || record.productFamilyRef.refId === input.productFamilyRefId)
      .filter((record) => !input.itemId || record.itemRef.itemId === input.itemId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => input.includeRetired || record.status !== ManufacturingSpecStatus.RETIRED)
      .filter((record) =>
        (input.attributeFilters ?? []).every((filter) =>
          record.manufacturingAttributes.some(
            (attribute) =>
              attribute.attributeKey === filter.attributeKey && attribute.attributeValue === filter.attributeValue
          )
        )
      )
      .sort((left, right) => left.specCode.localeCompare(right.specCode))
    return clone(paginate(records, input.page, input.pageSize))
  }

  async listManufacturingSpecsByIds(
    tenantId: string,
    manufacturingSpecIds: string[]
  ): Promise<ManufacturingSpecRecord[]> {
    const idSet = new Set(manufacturingSpecIds)
    return clone(
      Array.from(this.store.manufacturingSpecs.values()).filter(
        (record) => record.tenantId === tenantId && idSet.has(record.manufacturingSpecId)
      )
    )
  }

  async findMoldDesignById(tenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null> {
    return cloneOrNull(matchTenant(this.store.moldDesigns.get(moldDesignId), tenantId))
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

/** idempotencyKey scopes command replay records to one tenant boundary. */
function idempotencyKey(tenantId: string, commandId: string): string {
  return `${tenantId}:${commandId}`
}

/** snapshotStore copies the in-memory store so command transactions can roll back failed writes. */
function snapshotStore(store: MesInMemoryStore): MesInMemoryStoreSnapshot {
  return {
    manufacturingSpecs: clone(Array.from(store.manufacturingSpecs.entries())),
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

/** restoreStore restores a transaction snapshot after an in-memory command failure. */
function restoreStore(store: MesInMemoryStore, snapshot: MesInMemoryStoreSnapshot): void {
  restoreMap(store.manufacturingSpecs, snapshot.manufacturingSpecs)
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

/** sameOrg compares optional organization scopes using null as the canonical empty scope. */
function sameOrg(recordOrgId: string | null | undefined, orgId: string | null | undefined): boolean {
  return (recordOrgId ?? null) === (orgId ?? null)
}

/** matchTenant returns a record only when it belongs to the requested tenant. */
function matchTenant<T extends { tenantId: string }>(record: T | undefined, tenantId: string): T | null {
  return record && record.tenantId === tenantId ? record : null
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
  manufacturingSpecs: Array<[string, ManufacturingSpecRecord]>
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
