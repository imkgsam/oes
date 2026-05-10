import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Prisma } from '../../../../prisma/generated/prisma'
import {
  ProductionSpecRecord,
  ProductionSpecResolveResult,
  ProductionSpecStatus,
  ProductionSpecSummaryPageResult
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
import { PrismaExecutionClient, PrismaService } from '../../prisma/prisma.service'

/** PrismaProductionSpecRepository persists the current ProductionSpec truth and shared MES command facts. */
@Injectable()
export class PrismaProductionSpecRepository implements ProductionSpecRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }

  async saveProductionSpec(record: ProductionSpecRecord): Promise<ProductionSpecRecord> {
    const saved = await this.client().productionSpec.upsert({
      where: { id: record.productionSpecId },
      create: toPrismaProductionSpec(record),
      update: toPrismaProductionSpec(record)
    })
    return fromPrismaProductionSpec(saved)
  }

  async findProductionSpecById(tenantId: string, productionSpecId: string): Promise<ProductionSpecRecord | null> {
    const row = await this.client().productionSpec.findFirst({ where: { id: productionSpecId, tenantId } })
    return row ? fromPrismaProductionSpec(row) : null
  }

  async findProductionSpecByCode(
    tenantId: string,
    orgId: string | null | undefined,
    specCode: string
  ): Promise<ProductionSpecRecord | null> {
    const row = await this.client().productionSpec.findFirst({
      where: { tenantId, orgId: orgId ?? null, specCode }
    })
    return row ? fromPrismaProductionSpec(row) : null
  }

  async searchProductionSpecs(input: SearchProductionSpecsInput): Promise<ProductionSpecSummaryPageResult> {
    const keyword = input.keyword?.trim()
    const where: Prisma.ProductionSpecWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.status ? { status: input.status } : input.includeRetired ? {} : { status: { not: ProductionSpecStatus.RETIRED } }),
      ...(input.itemId ? { itemRef: { path: ['itemId'], equals: input.itemId } } : {}),
      ...(keyword
        ? {
            OR: [
              { specCode: { contains: keyword, mode: 'insensitive' } },
              { name: { contains: keyword, mode: 'insensitive' } }
            ]
          }
        : {})
    }
    const [total, rows] = await Promise.all([
      this.client().productionSpec.count({ where }),
      this.client().productionSpec.findMany({
        where,
        orderBy: { specCode: 'asc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      })
    ])
    return {
      productionSpecs: rows.map((row) => toProductionSpecSummary(fromPrismaProductionSpec(row))),
      total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  async listProductionSpecsByIds(tenantId: string, productionSpecIds: string[]): Promise<ProductionSpecRecord[]> {
    const rows = await this.client().productionSpec.findMany({
      where: { tenantId, id: { in: productionSpecIds } },
      orderBy: { specCode: 'asc' }
    })
    return rows.map(fromPrismaProductionSpec)
  }

  async resolveProductionSpecsForMold(input: ResolveProductionSpecsForMoldInput): Promise<ProductionSpecResolveResult> {
    const refs = await this.collectProductionSpecRefs(input)
    const requestedIds = Array.from(new Set(refs.map((ref) => ref.productionSpecId).filter(Boolean)))
    if (requestedIds.length === 0) {
      return { resolvedSpecs: [], unavailableRefs: [] }
    }

    const specs = await this.listProductionSpecsByIds(input.tenantId, requestedIds)
    const specsById = new Map(specs.map((spec) => [spec.productionSpecId, spec]))
    const resolvedSpecs = []
    const unavailableRefs = []
    for (const productionSpecId of requestedIds) {
      const spec = specsById.get(productionSpecId)
      if (!spec) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_FOUND' as const })
        continue
      }
      if (input.orgId && (spec.orgId ?? null) !== input.orgId) {
        unavailableRefs.push({ refId: productionSpecId, reasonCode: 'NOT_VISIBLE' as const })
        continue
      }
      if (spec.status !== ProductionSpecStatus.ACTIVE) {
        unavailableRefs.push({
          refId: productionSpecId,
          reasonCode: spec.status === ProductionSpecStatus.RETIRED ? ('RETIRED' as const) : ('NOT_ACTIVE' as const)
        })
        continue
      }
      resolvedSpecs.push(toProductionSpecSummary(spec))
    }

    return { resolvedSpecs, unavailableRefs }
  }

  async appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord> {
    const saved = await this.client().mesAuditEnvelope.create({ data: toPrismaMesAuditEnvelope(record) })
    return fromPrismaMesAuditEnvelope(saved)
  }

  async appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord> {
    const saved = await this.client().mesOutboxEvent.create({ data: toPrismaMesOutboxEvent(record) })
    return fromPrismaMesOutboxEvent(saved)
  }

  async saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord> {
    const client = this.client()
    if (record.status === 'IN_PROGRESS') {
      await client.mesCommandIdempotency.createMany({
        data: [toPrismaMesCommandIdempotency(record)],
        skipDuplicates: true
      })
      const saved = await client.mesCommandIdempotency.findUnique({
        where: { tenantId_commandId: { tenantId: record.tenantId, commandId: record.commandId } }
      })
      return saved ? fromPrismaMesCommandIdempotency(saved) : record
    }

    const saved = await client.mesCommandIdempotency.update({
      where: { tenantId_commandId: { tenantId: record.tenantId, commandId: record.commandId } },
      data: {
        status: record.status,
        responseSnapshot: nullableJson(record.responseSnapshot),
        updatedAt: new Date(record.updatedAt)
      }
    })
    return fromPrismaMesCommandIdempotency(saved)
  }

  async findCommandIdempotencyRecord(tenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null> {
    const row = await this.client().mesCommandIdempotency.findUnique({
      where: { tenantId_commandId: { tenantId, commandId } }
    })
    return row ? fromPrismaMesCommandIdempotency(row) : null
  }

  /** collectProductionSpecRefs combines explicit refs with refs declared by a MoldDesign. */
  private async collectProductionSpecRefs(input: ResolveProductionSpecsForMoldInput): Promise<ProductionSpecRefRecord[]> {
    const explicitRefs = (input.productionSpecIds ?? []).map((productionSpecId) => ({ productionSpecId }))
    if (!input.moldDesignId) {
      return explicitRefs
    }
    const moldDesign = await this.client().moldDesign.findFirst({
      where: { id: input.moldDesignId, tenantId: input.tenantId }
    })
    if (!moldDesign || (moldDesign.orgId ?? null) !== (input.orgId ?? null)) {
      throw ExceptionFactory.application(MES_NOT_FOUND, { resource: 'MoldDesign', identifier: input.moldDesignId })
    }
    const moldRefs = moldDesign ? fromJson<ProductionSpecRefRecord[]>(moldDesign.productionSpecRefs) : []
    return [...explicitRefs, ...moldRefs]
  }

  /** client returns the ambient Prisma transaction client when one is active. */
  private client(): PrismaExecutionClient {
    return this.prisma.getExecutionClient()
  }
}

/** toPrismaProductionSpec maps one ProductionSpec record into Prisma create/update data. */
function toPrismaProductionSpec(record: ProductionSpecRecord): Prisma.ProductionSpecUncheckedCreateInput {
  return {
    id: record.productionSpecId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    orgScope: orgScope(record.orgId),
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    supersedesProductionSpecId: record.supersedesProductionSpecId ?? null,
    itemRef: toJson(record.itemRef),
    status: record.status,
    effectiveFrom: record.effectiveFrom ?? null,
    effectiveTo: record.effectiveTo ?? null,
    retiredAt: record.retiredAt ?? null,
    replacementProductionSpecId: record.replacementProductionSpecId ?? null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    version: record.version
  }
}

/** fromPrismaProductionSpec maps one Prisma row back into the current domain record shape. */
function fromPrismaProductionSpec(row: Prisma.ProductionSpecGetPayload<object>): ProductionSpecRecord {
  return {
    productionSpecId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    specCode: row.specCode,
    name: row.name,
    revisionCode: row.revisionCode,
    supersedesProductionSpecId: row.supersedesProductionSpecId,
    itemRef: fromJson<ProductionSpecRecord['itemRef']>(row.itemRef),
    status: row.status as ProductionSpecStatus,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    retiredAt: row.retiredAt,
    replacementProductionSpecId: row.replacementProductionSpecId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version
  }
}

/** toProductionSpecSummary projects one full spec record into the selector-friendly summary. */
function toProductionSpecSummary(record: ProductionSpecRecord) {
  return {
    productionSpecId: record.productionSpecId,
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    itemRef: record.itemRef,
    status: record.status
  }
}

/** toPrismaMesAuditEnvelope maps one audit envelope into Prisma create data. */
function toPrismaMesAuditEnvelope(record: MesAuditEnvelopeRecord): Prisma.MesAuditEnvelopeUncheckedCreateInput {
  return {
    id: record.mesAuditEnvelopeId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    service: record.service,
    module: record.module,
    eventType: record.eventType,
    occurredAt: new Date(record.occurredAt),
    result: record.result,
    operatorId: record.operatorId,
    operatorType: record.operatorType,
    traceId: record.traceId,
    commandId: record.commandId,
    reason: record.reason,
    resourceType: record.resourceType ?? null,
    resourceId: record.resourceId ?? null,
    beforeSnapshot: nullableJson(record.beforeSnapshot),
    afterSnapshot: nullableJson(record.afterSnapshot),
    details: toJson(record.details),
    createdAt: new Date(record.createdAt)
  }
}

/** fromPrismaMesAuditEnvelope maps one Prisma audit row into the shared MES audit shape. */
function fromPrismaMesAuditEnvelope(row: Prisma.MesAuditEnvelopeGetPayload<object>): MesAuditEnvelopeRecord {
  return {
    mesAuditEnvelopeId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    service: row.service,
    module: row.module,
    eventType: row.eventType,
    occurredAt: row.occurredAt.toISOString(),
    result: 'SUCCEEDED',
    operatorId: row.operatorId,
    operatorType: row.operatorType,
    traceId: row.traceId,
    commandId: row.commandId,
    reason: row.reason,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    beforeSnapshot: fromNullableJson<MesAuditEnvelopeRecord['beforeSnapshot']>(row.beforeSnapshot),
    afterSnapshot: fromNullableJson<MesAuditEnvelopeRecord['afterSnapshot']>(row.afterSnapshot),
    details: fromJson<MesAuditEnvelopeRecord['details']>(row.details),
    createdAt: row.createdAt.toISOString()
  }
}

/** toPrismaMesOutboxEvent maps one outbox event into Prisma create data. */
function toPrismaMesOutboxEvent(record: MesOutboxEventRecord): Prisma.MesOutboxEventUncheckedCreateInput {
  return {
    id: record.mesOutboxEventId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    eventType: record.eventType,
    aggregateType: record.aggregateType,
    aggregateId: record.aggregateId,
    payload: toJson(record.payload),
    traceId: record.traceId,
    commandId: record.commandId,
    occurredAt: new Date(record.occurredAt),
    publishedAt: record.publishedAt ? new Date(record.publishedAt) : null,
    status: record.status,
    createdAt: new Date(record.createdAt)
  }
}

/** fromPrismaMesOutboxEvent maps one Prisma outbox row into the shared MES outbox shape. */
function fromPrismaMesOutboxEvent(row: Prisma.MesOutboxEventGetPayload<object>): MesOutboxEventRecord {
  return {
    mesOutboxEventId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    eventType: row.eventType,
    aggregateType: row.aggregateType,
    aggregateId: row.aggregateId,
    payload: fromJson<MesOutboxEventRecord['payload']>(row.payload),
    traceId: row.traceId,
    commandId: row.commandId,
    occurredAt: row.occurredAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    status: row.status as MesOutboxEventRecord['status'],
    createdAt: row.createdAt.toISOString()
  }
}

/** toPrismaMesCommandIdempotency maps one idempotency record into Prisma create data. */
function toPrismaMesCommandIdempotency(record: MesCommandIdempotencyRecord): Prisma.MesCommandIdempotencyUncheckedCreateInput {
  return {
    id: record.mesCommandIdempotencyId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    commandId: record.commandId,
    commandName: record.commandName,
    requestHash: record.requestHash,
    status: record.status,
    responseSnapshot: nullableJson(record.responseSnapshot),
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  }
}

/** fromPrismaMesCommandIdempotency maps one Prisma idempotency row into the domain replay record. */
function fromPrismaMesCommandIdempotency(row: Prisma.MesCommandIdempotencyGetPayload<object>): MesCommandIdempotencyRecord {
  return {
    mesCommandIdempotencyId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    commandId: row.commandId,
    commandName: row.commandName,
    requestHash: row.requestHash,
    status: row.status as MesCommandIdempotencyRecord['status'],
    responseSnapshot: fromNullableJson<MesCommandIdempotencyRecord['responseSnapshot']>(row.responseSnapshot),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

/** nullableJson preserves domain nulls while satisfying Prisma JSON input constraints. */
function nullableJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined ? Prisma.JsonNull : toJson(value)
}

/** toJson converts JSON-safe domain snapshots into Prisma JSON input values. */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

/** fromJson restores a typed domain value from a Prisma JSON column. */
function fromJson<T>(value: unknown): T {
  return value as unknown as T
}

/** fromNullableJson restores nullable domain values from Prisma JSON columns. */
function fromNullableJson<T>(value: unknown): T | null {
  if (value === null || value === undefined || value === Prisma.JsonNull) {
    return null
  }
  return value as unknown as T
}

/** orgScope converts nullable org ownership into a deterministic uniqueness key. */
function orgScope(orgId: string | null | undefined): string {
  return orgId ?? ''
}
