import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ProductionSpecRecord,
  ProductionSpecStatus
} from '../../../domain/models/production-spec-records'
import {
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  ProductionSpecRefRecord
} from '../../../domain/models/mes-mold-records'
import {
  ProductionSpecRepository,
  ResolveProductionSpecsForMoldInput,
  SearchProductionSpecsInput
} from '../../../domain/repositories/production-spec.repository'
import { MES_NOT_FOUND } from '../../../common/errors/mes.errors'
import { MesInMemoryStore } from '../../store/mes-in-memory-store'

/** InMemoryProductionSpecRepository keeps ProductionSpec behavior deterministic without external infrastructure. */
@Injectable()
export class InMemoryProductionSpecRepository implements ProductionSpecRepository {
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

  async saveProductionSpec(record: ProductionSpecRecord): Promise<ProductionSpecRecord> {
    this.store.productionSpecs.set(record.productionSpecId, clone(record))
    return clone(record)
  }

  async findProductionSpecById(tenantId: string, productionSpecId: string): Promise<ProductionSpecRecord | null> {
    return cloneOrNull(matchTenant(this.store.productionSpecs.get(productionSpecId), tenantId))
  }

  async findProductionSpecByCode(
    tenantId: string,
    orgId: string | null | undefined,
    specCode: string
  ): Promise<ProductionSpecRecord | null> {
    return cloneOrNull(
      Array.from(this.store.productionSpecs.values()).find(
        (record) => record.tenantId === tenantId && sameOrg(record.orgId, orgId) && record.specCode === specCode
      )
    )
  }

  async searchProductionSpecs(input: SearchProductionSpecsInput) {
    const keyword = input.keyword?.trim().toUpperCase()
    const records = Array.from(this.store.productionSpecs.values())
      .filter((record) => record.tenantId === input.tenantId && (!input.orgId || sameOrg(record.orgId, input.orgId)))
      .filter((record) => !keyword || record.specCode.toUpperCase().includes(keyword) || record.name.toUpperCase().includes(keyword))
      .filter((record) => !input.itemId || record.itemRef.itemId === input.itemId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => input.includeRetired || record.status !== ProductionSpecStatus.RETIRED)
      .sort((left, right) => left.specCode.localeCompare(right.specCode))
    const page = paginate(records.map(toSummary), input.page, input.pageSize)
    return { productionSpecs: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async listProductionSpecsByIds(tenantId: string, productionSpecIds: string[]): Promise<ProductionSpecRecord[]> {
    const idSet = new Set(productionSpecIds)
    return clone(
      Array.from(this.store.productionSpecs.values()).filter(
        (record) => record.tenantId === tenantId && idSet.has(record.productionSpecId)
      )
    )
  }

  async resolveProductionSpecsForMold(input: ResolveProductionSpecsForMoldInput) {
    const explicitRefs = (input.productionSpecIds ?? []).map((productionSpecId) => ({ productionSpecId }))
    const moldDesign = input.moldDesignId ? this.store.moldDesigns.get(input.moldDesignId) : null
    if (input.moldDesignId && (!moldDesign || moldDesign.tenantId !== input.tenantId || !sameOrg(moldDesign.orgId, input.orgId))) {
      throw ExceptionFactory.application(MES_NOT_FOUND, { resource: 'MoldDesign', identifier: input.moldDesignId })
    }
    const moldRefs = moldDesign?.productionSpecRefs ?? []
    const ids = Array.from(new Set([...explicitRefs, ...moldRefs].map((ref: ProductionSpecRefRecord) => ref.productionSpecId)))
    const resolvedSpecs = []
    const unavailableRefs = []
    for (const productionSpecId of ids) {
      const spec = this.store.productionSpecs.get(productionSpecId)
      if (!spec || spec.tenantId !== input.tenantId) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_FOUND' as const })
      } else if (input.orgId && !sameOrg(spec.orgId, input.orgId)) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_VISIBLE' as const })
      } else if (spec.status !== ProductionSpecStatus.ACTIVE) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_ACTIVE' as const })
      } else {
        resolvedSpecs.push(toSummary(spec))
      }
    }
    return { resolvedSpecs, unavailableRefs }
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
}

/** toSummary projects a ProductionSpec into its query summary shape. */
function toSummary(record: ProductionSpecRecord) {
  return {
    productionSpecId: record.productionSpecId,
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    itemRef: record.itemRef,
    status: record.status
  }
}

/** idempotencyKey scopes command replay records to one tenant boundary. */
function idempotencyKey(tenantId: string, commandId: string): string {
  return `${tenantId}:${commandId}`
}

/** snapshotStore copies the in-memory store so command transactions can roll back failed writes. */
function snapshotStore(store: MesInMemoryStore): MesInMemoryStoreSnapshot {
  return {
    productionSpecs: clone(Array.from(store.productionSpecs.entries())),
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
  restoreMap(store.productionSpecs, snapshot.productionSpecs)
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
  productionSpecs: Array<[string, ProductionSpecRecord]>
  moldDesigns: Array<[string, import('../../../domain/models/mes-mold-records').MoldDesignRecord]>
  masterMolds: Array<[string, import('../../../domain/models/mes-mold-records').MasterMoldRecord]>
  productionMolds: Array<[string, import('../../../domain/models/mes-mold-records').ProductionMoldRecord]>
  lifeCounters: Array<[string, import('../../../domain/models/mes-mold-records').MoldLifeCounterRecord]>
  movements: import('../../../domain/models/mes-mold-records').MoldMovementRecord[]
  toolingInstallations: Array<[string, import('../../../domain/models/mes-mold-records').ToolingInstallationRecord]>
  usageRecords: import('../../../domain/models/mes-mold-records').MoldUsageRecord[]
  auditEnvelopes: MesAuditEnvelopeRecord[]
  outboxEvents: MesOutboxEventRecord[]
  commandIdempotencyRecords: Array<[string, MesCommandIdempotencyRecord]>
}
