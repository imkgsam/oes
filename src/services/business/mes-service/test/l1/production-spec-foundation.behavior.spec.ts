import { status } from '@grpc/grpc-js'
import { ManufacturableItemLookupPort } from '../../src/application/ports/manufacturable-item-lookup.port'
import { ProductionSpecManagementService } from '../../src/application/services/production-spec-management.service'
import { ProductionSpecQueryService } from '../../src/application/services/production-spec-query.service'
import {
  ProductionSpecRecord,
  ProductionSpecResolveResult,
  ProductionSpecStatus,
  ProductionSpecSummaryPageResult
} from '../../src/domain/models/production-spec-records'
import { MesAuditEnvelopeRecord, MesCommandIdempotencyRecord, MesOutboxEventRecord } from '../../src/domain/models/mes-mold-records'
import {
  ProductionSpecRepository,
  ResolveProductionSpecsForMoldInput,
  SearchProductionSpecsInput
} from '../../src/domain/repositories/production-spec.repository'

const tenantId = 'tenant-1'
const orgId = 'org-1'

/** commandContext creates the explicit MES command envelope required by application-layer writes. */
function commandContext(commandId: string, targetOrgId = orgId) {
  return {
    tenantId,
    orgId: targetOrgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId: targetOrgId
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

/** queryContext creates the explicit MES query envelope required by read-side calls. */
function queryContext(targetOrgId = orgId) {
  return {
    tenantId,
    orgId: targetOrgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId: targetOrgId
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: 'query-request-1'
    }
  }
}

/** StubItemLookup lets the spec tests drive item-master eligibility without crossing service boundaries. */
class StubItemLookup implements ManufacturableItemLookupPort {
  readonly items = new Map<string, { manufacturable: boolean; physical: boolean; active: boolean }>()

  /** getManufacturableItem returns the small item-master eligibility projection MES is allowed to use. */
  async getManufacturableItem(scopeTenantId: string, itemId: string) {
    const item = this.items.get(`${scopeTenantId}:${itemId}`)
    if (!item) {
      return null
    }
    return {
      itemId,
      itemCode: `ITEM-${itemId}`,
      itemName: `Item ${itemId}`,
      active: item.active,
      manufacturable: item.manufacturable,
      physical: item.physical
    }
  }
}

/** FakeSpecRepository stores spec records, audit, outbox, and idempotency records in process for L1 behavior tests. */
class FakeSpecRepository implements ProductionSpecRepository {
  readonly specs = new Map<string, ProductionSpecRecord>()
  readonly audits: MesAuditEnvelopeRecord[] = []
  readonly outbox: MesOutboxEventRecord[] = []
  readonly commandRecords = new Map<string, MesCommandIdempotencyRecord>()
  moldDesignRefs = new Map<string, string[]>()

  /** runInTransaction executes synchronously against the in-memory fake repository. */
  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return callback()
  }

  /** saveProductionSpec upserts one spec record. */
  async saveProductionSpec(record: ProductionSpecRecord): Promise<ProductionSpecRecord> {
    this.specs.set(record.productionSpecId, structuredClone(record))
    return structuredClone(record)
  }

  /** findProductionSpecById loads one spec by tenant and id. */
  async findProductionSpecById(scopeTenantId: string, productionSpecId: string): Promise<ProductionSpecRecord | null> {
    const record = this.specs.get(productionSpecId)
    return record?.tenantId === scopeTenantId ? structuredClone(record) : null
  }

  /** findProductionSpecByCode loads one spec by tenant, org, and normalized code. */
  async findProductionSpecByCode(
    scopeTenantId: string,
    scopeOrgId: string | null | undefined,
    specCode: string
  ): Promise<ProductionSpecRecord | null> {
    const record = Array.from(this.specs.values()).find(
      (candidate) =>
        candidate.tenantId === scopeTenantId &&
        (candidate.orgId ?? null) === (scopeOrgId ?? null) &&
        candidate.specCode === specCode
    )
    return record ? structuredClone(record) : null
  }

  /** searchProductionSpecs returns contract-shaped pages of compact spec summaries. */
  async searchProductionSpecs(input: SearchProductionSpecsInput): Promise<ProductionSpecSummaryPageResult> {
    const filtered = Array.from(this.specs.values())
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => (record.orgId ?? null) === (input.orgId ?? null))
      .filter((record) => input.includeRetired || record.status !== ProductionSpecStatus.RETIRED)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.itemId || record.itemRef.itemId === input.itemId)
      .filter((record) => !input.keyword || `${record.specCode} ${record.name}`.includes(input.keyword.toUpperCase()))
    const start = (input.page - 1) * input.pageSize
    return {
      productionSpecs: filtered.slice(start, start + input.pageSize).map(toSummary),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** listProductionSpecsByIds loads visible records for partial reference resolution. */
  async listProductionSpecsByIds(scopeTenantId: string, productionSpecIds: string[]): Promise<ProductionSpecRecord[]> {
    return productionSpecIds
      .map((id) => this.specs.get(id))
      .filter((record): record is ProductionSpecRecord => !!record && record.tenantId === scopeTenantId)
      .map((record) => structuredClone(record))
  }

  /** resolveProductionSpecsForMold resolves active specs and records per-ref unavailability. */
  async resolveProductionSpecsForMold(input: ResolveProductionSpecsForMoldInput): Promise<ProductionSpecResolveResult> {
    const ids = new Set(input.productionSpecIds ?? [])
    if (input.moldDesignId) {
      const refs = this.moldDesignRefs.get(input.moldDesignId)
      if (!refs) {
        throw Object.assign(new Error('not found'), { definition: { rpcStatus: status.NOT_FOUND } })
      }
      refs.forEach((id) => ids.add(id))
    }
    const resolvedSpecs: ProductionSpecResolveResult['resolvedSpecs'] = []
    const unavailableRefs: ProductionSpecResolveResult['unavailableRefs'] = []
    for (const id of ids) {
      const record = this.specs.get(id)
      if (!record || record.tenantId !== input.tenantId) {
        unavailableRefs.push({ refId: id, reasonCode: 'NOT_FOUND' })
      } else if ((record.orgId ?? null) !== (input.orgId ?? null)) {
        unavailableRefs.push({ refId: id, reasonCode: 'NOT_VISIBLE' })
      } else if (record.status === ProductionSpecStatus.RETIRED) {
        unavailableRefs.push({ refId: id, reasonCode: 'RETIRED' })
      } else if (record.status !== ProductionSpecStatus.ACTIVE) {
        unavailableRefs.push({ refId: id, reasonCode: 'NOT_ACTIVE' })
      } else {
        resolvedSpecs.push(toSummary(record))
      }
    }
    return { resolvedSpecs, unavailableRefs }
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
}

/** createHarness wires the application services to isolated fakes. */
function createHarness() {
  const repository = new FakeSpecRepository()
  const itemLookup = new StubItemLookup()
  itemLookup.items.set(`${tenantId}:item-ok`, { active: true, manufacturable: true, physical: true })
  itemLookup.items.set(`${tenantId}:item-service`, { active: true, manufacturable: true, physical: false })
  itemLookup.items.set(`${tenantId}:item-buy`, { active: true, manufacturable: false, physical: true })
  itemLookup.items.set(`${tenantId}:item-inactive`, { active: false, manufacturable: true, physical: true })
  return {
    repository,
    itemLookup,
    management: new ProductionSpecManagementService(repository, itemLookup),
    query: new ProductionSpecQueryService(repository)
  }
}

/** createSpec exercises the public create use case with current ProductionSpec naming. */
async function createSpec(management: ProductionSpecManagementService, commandId = 'cmd-create-1') {
  return management.createProductionSpec({
    ...commandContext(commandId),
    productionSpecId: 'spec-1',
    specCode: 'body-a-300',
    name: 'Body A 300',
    revisionCode: 'R1',
    itemRef: {
      itemId: 'item-ok'
    },
    effectiveFrom: '2026-05-05T00:00:00.000Z'
  })
}

/** toSummary converts a full record into the contract compact selector shape. */
function toSummary(record: ProductionSpecRecord) {
  return {
    productionSpecId: record.productionSpecId,
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode,
    itemRef: record.itemRef,
    status: record.status
  }
}

describe('mes-service production spec application behavior L1', () => {
  it('management lifecycle / creates, validates item eligibility, updates, activates, retires, and replays idempotent commands', async () => {
    const { management, repository } = createHarness()

    const created = await createSpec(management)
    expect(created).toMatchObject({
      productionSpecId: 'spec-1',
      specCode: 'BODY-A-300',
      status: ProductionSpecStatus.DRAFT,
      version: 1
    })
    expect(created.itemRef.itemCodeSnapshot).toBe('ITEM-item-ok')
    expect(repository.audits).toHaveLength(1)
    expect(repository.outbox[0]?.eventType).toBe('ProductionSpecCreated')

    await expect(
      management.createProductionSpec({
        ...commandContext('cmd-duplicate-id'),
        productionSpecId: 'spec-1',
        specCode: 'body-a-301',
        name: 'Duplicate id',
        itemRef: { itemId: 'item-ok' }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.ALREADY_EXISTS } })
    expect((await repository.findProductionSpecById(tenantId, 'spec-1'))?.specCode).toBe('BODY-A-300')

    const derivedOrg = await management.createProductionSpec({
      ...commandContext('cmd-derived-org'),
      orgId: undefined,
      productionSpecId: 'spec-derived-org',
      specCode: 'body-derived-org',
      name: 'Derived org',
      itemRef: { itemId: 'item-ok' }
    })
    expect(derivedOrg.orgId).toBe(orgId)
    expect(repository.audits.find((audit) => audit.commandId === 'cmd-derived-org')?.orgId).toBe(orgId)
    expect(repository.outbox.find((event) => event.commandId === 'cmd-derived-org')?.orgId).toBe(orgId)

    await expect(createSpec(management, 'cmd-duplicate-code')).rejects.toMatchObject({
      definition: { rpcStatus: status.ALREADY_EXISTS }
    })
    await expect(
      management.createProductionSpec({
        ...commandContext('cmd-non-physical'),
        specCode: 'body-non-physical',
        name: 'Bad physical',
        itemRef: { itemId: 'item-service' }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })
    await expect(
      management.createProductionSpec({
        ...commandContext('cmd-non-buildable'),
        specCode: 'body-non-buildable',
        name: 'Bad buildable',
        itemRef: { itemId: 'item-buy' }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })
    await expect(
      management.createProductionSpec({
        ...commandContext('cmd-inactive-item'),
        specCode: 'body-inactive',
        name: 'Inactive item',
        itemRef: { itemId: 'item-inactive' }
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.FAILED_PRECONDITION } })

    const updated = await management.updateProductionSpec({
      ...commandContext('cmd-update-1'),
      productionSpecId: 'spec-1',
      expectedVersion: 1,
      name: 'Body A 300 Updated',
      effectiveTo: '2027-01-01T00:00:00.000Z'
    })
    expect(updated.version).toBe(2)
    expect(updated.name).toBe('Body A 300 Updated')

    await expect(
      management.activateProductionSpec({
        ...commandContext('cmd-activate-stale'),
        productionSpecId: 'spec-1',
        expectedVersion: 1
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.ABORTED } })

    const activated = await management.activateProductionSpec({
      ...commandContext('cmd-activate-1'),
      productionSpecId: 'spec-1',
      expectedVersion: 2,
      activatedAt: '2026-05-06T00:00:00.000Z'
    })
    expect(activated.status).toBe(ProductionSpecStatus.ACTIVE)

    const replayedActivation = await management.activateProductionSpec({
      ...commandContext('cmd-activate-1'),
      traceContext: {
        traceId: 'trace-retry',
        requestId: 'request-retry'
      },
      auditContext: {
        auditId: 'audit-retry',
        reason: 'retry with new envelope',
        source: 'jest'
      },
      productionSpecId: 'spec-1',
      expectedVersion: 2,
      activatedAt: '2026-05-06T00:00:00.000Z'
    })
    expect(replayedActivation).toEqual(activated)
    expect(repository.outbox.filter((event) => event.commandId === 'cmd-activate-1')).toHaveLength(1)

    const retired = await management.retireProductionSpec({
      ...commandContext('cmd-retire-1'),
      productionSpecId: 'spec-1',
      expectedVersion: 3,
      retiredAt: '2026-05-07T00:00:00.000Z'
    })
    expect(retired.status).toBe(ProductionSpecStatus.RETIRED)
    expect(retired.replacementProductionSpecId).toBeNull()
  })

  it('queries / returns explicit envelopes and resolves active specs for mold references with partial unavailable refs', async () => {
    const { management, query, repository } = createHarness()
    await createSpec(management)
    await management.activateProductionSpec({
      ...commandContext('cmd-activate-1'),
      productionSpecId: 'spec-1',
      expectedVersion: 1
    })
    await management.createProductionSpec({
      ...commandContext('cmd-create-draft'),
      productionSpecId: 'spec-draft',
      specCode: 'body-a-400',
      name: 'Body A 400',
      itemRef: { itemId: 'item-ok' }
    })
    repository.moldDesignRefs.set('design-1', ['spec-1', 'spec-draft', 'spec-missing'])

    const found = await query.getProductionSpec({
      ...queryContext(),
      productionSpecId: 'spec-1'
    })
    expect(found.productionSpecId).toBe('spec-1')

    const page = await query.listProductionSpecs({
      ...queryContext(),
      status: ProductionSpecStatus.ACTIVE,
      page: 1,
      pageSize: 10
    })
    expect(page.productionSpecs.map((spec) => spec.productionSpecId)).toEqual(['spec-1'])

    const resolved = await query.resolveProductionSpecsForMold({
      ...queryContext(),
      moldDesignId: 'design-1'
    })
    expect(resolved.resolvedSpecs.map((spec) => spec.productionSpecId)).toEqual(['spec-1'])
    expect(resolved.unavailableRefs).toEqual([
      { refId: 'spec-draft', reasonCode: 'NOT_ACTIVE' },
      { refId: 'spec-missing', reasonCode: 'NOT_FOUND' }
    ])

    await expect(
      query.resolveProductionSpecsForMold({
        ...queryContext()
      })
    ).rejects.toMatchObject({ definition: { rpcStatus: status.INVALID_ARGUMENT } })
  })
})
