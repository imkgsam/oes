import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../prisma/generated/prisma'
import {
  ManufacturingSpecAttributeFilterRecord,
  ManufacturingSpecRecord,
  ManufacturingSpecStatus
} from '../../../domain/models/manufacturing-spec-records'
import {
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  MoldDesignOutputRecord,
  MoldDesignRecord,
  PageResult
} from '../../../domain/models/mes-mold-records'
import {
  ManufacturingSpecRepository,
  SearchManufacturingSpecsInput
} from '../../../domain/repositories/manufacturing-spec.repository'
import { PrismaExecutionClient, PrismaService } from '../../prisma/prisma.service'

/** PrismaManufacturingSpecRepository persists MES ManufacturingSpec truth, audit, outbox, and idempotency records. */
@Injectable()
export class PrismaManufacturingSpecRepository implements ManufacturingSpecRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }

  async saveManufacturingSpec(record: ManufacturingSpecRecord): Promise<ManufacturingSpecRecord> {
    const saved = await this.client().manufacturingSpec.upsert({
      where: { id: record.manufacturingSpecId },
      create: toPrismaManufacturingSpec(record),
      update: toPrismaManufacturingSpec(record)
    })
    return fromPrismaManufacturingSpec(saved)
  }

  async findManufacturingSpecById(
    tenantId: string,
    manufacturingSpecId: string
  ): Promise<ManufacturingSpecRecord | null> {
    const row = await this.client().manufacturingSpec.findFirst({ where: { id: manufacturingSpecId, tenantId } })
    return row ? fromPrismaManufacturingSpec(row) : null
  }

  async findManufacturingSpecByCode(
    tenantId: string,
    orgId: string | null | undefined,
    specCode: string
  ): Promise<ManufacturingSpecRecord | null> {
    const row = await this.client().manufacturingSpec.findFirst({
      where: { tenantId, orgId: orgId ?? null, specCode }
    })
    return row ? fromPrismaManufacturingSpec(row) : null
  }

  async searchManufacturingSpecs(input: SearchManufacturingSpecsInput): Promise<PageResult<ManufacturingSpecRecord>> {
    const where: Prisma.ManufacturingSpecWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.status ? { status: input.status } : input.includeRetired ? {} : { status: { not: ManufacturingSpecStatus.RETIRED } }),
      ...(input.itemId ? { itemRef: { path: ['itemId'], equals: input.itemId } } : {}),
      ...(input.productFamilyRefId ? { productFamilyRef: { path: ['refId'], equals: input.productFamilyRefId } } : {}),
      ...(input.keyword
        ? {
            OR: [
              { specCode: { contains: input.keyword.toUpperCase() } },
              { name: { contains: input.keyword, mode: 'insensitive' } }
            ]
          }
        : {})
    }
    const rows = await this.client().manufacturingSpec.findMany({
      where,
      orderBy: { specCode: 'asc' }
    })
    const filtered = filterByAttributes(rows.map(fromPrismaManufacturingSpec), input.attributeFilters ?? [])
    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  async listManufacturingSpecsByIds(
    tenantId: string,
    manufacturingSpecIds: string[]
  ): Promise<ManufacturingSpecRecord[]> {
    const rows = await this.client().manufacturingSpec.findMany({
      where: { tenantId, id: { in: manufacturingSpecIds } },
      orderBy: { specCode: 'asc' }
    })
    return rows.map(fromPrismaManufacturingSpec)
  }

  async findMoldDesignById(tenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null> {
    const row = await this.client().moldDesign.findFirst({
      where: { id: moldDesignId, tenantId },
      include: { outputs: { orderBy: { sequenceNo: 'asc' } } }
    })
    return row ? fromPrismaMoldDesign(row) : null
  }

  async appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord> {
    const saved = await this.client().mesAuditEnvelope.create({ data: toPrismaMesAuditEnvelope(record) })
    return fromPrismaMesAuditEnvelope(saved)
  }

  async appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord> {
    const saved = await this.client().mesOutboxEvent.create({ data: toPrismaMesOutboxEvent(record) })
    return fromPrismaMesOutboxEvent(saved)
  }

  async saveCommandIdempotencyRecord(
    record: MesCommandIdempotencyRecord
  ): Promise<MesCommandIdempotencyRecord> {
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

  async findCommandIdempotencyRecord(
    tenantId: string,
    commandId: string
  ): Promise<MesCommandIdempotencyRecord | null> {
    const row = await this.client().mesCommandIdempotency.findUnique({
      where: { tenantId_commandId: { tenantId, commandId } }
    })
    return row ? fromPrismaMesCommandIdempotency(row) : null
  }

  /** client returns the ambient Prisma transaction client when one is active. */
  private client(): PrismaExecutionClient {
    return this.prisma.getExecutionClient()
  }
}

/** filterByAttributes applies key/value filters that PostgreSQL JSON path queries cannot express portably here. */
function filterByAttributes(
  records: ManufacturingSpecRecord[],
  filters: ManufacturingSpecAttributeFilterRecord[]
): ManufacturingSpecRecord[] {
  return records.filter((record) =>
    filters.every((filter) =>
      record.manufacturingAttributes.some(
        (attribute) => attribute.attributeKey === filter.attributeKey && attribute.attributeValue === filter.attributeValue
      )
    )
  )
}

/** toPrismaManufacturingSpec maps one ManufacturingSpec record into Prisma create/update data. */
function toPrismaManufacturingSpec(record: ManufacturingSpecRecord): Prisma.ManufacturingSpecUncheckedCreateInput {
  return {
    id: record.manufacturingSpecId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    supersedesSpecId: record.supersedesSpecId ?? null,
    productFamilyRef: toJson(record.productFamilyRef),
    itemRef: toJson(record.itemRef),
    manufacturingAttributes: toJson(record.manufacturingAttributes),
    routeIntentRef: nullableJson(record.routeIntentRef),
    status: record.status,
    effectiveFrom: record.effectiveFrom ?? null,
    effectiveTo: record.effectiveTo ?? null,
    retiredAt: record.retiredAt ?? null,
    replacementSpecId: record.replacementSpecId ?? null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    version: record.version
  }
}

/** fromPrismaManufacturingSpec maps one Prisma row back into the domain record shape. */
function fromPrismaManufacturingSpec(row: Prisma.ManufacturingSpecGetPayload<object>): ManufacturingSpecRecord {
  return {
    manufacturingSpecId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    specCode: row.specCode,
    name: row.name,
    revisionCode: row.revisionCode,
    supersedesSpecId: row.supersedesSpecId,
    productFamilyRef: fromJson<ManufacturingSpecRecord['productFamilyRef']>(row.productFamilyRef),
    itemRef: fromJson<ManufacturingSpecRecord['itemRef']>(row.itemRef),
    manufacturingAttributes: fromJson<ManufacturingSpecRecord['manufacturingAttributes']>(row.manufacturingAttributes),
    routeIntentRef: fromNullableJson<ManufacturingSpecRecord['routeIntentRef']>(row.routeIntentRef),
    status: row.status as ManufacturingSpecStatus,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    retiredAt: row.retiredAt,
    replacementSpecId: row.replacementSpecId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version
  }
}

type MoldDesignWithOutputs = Prisma.MoldDesignGetPayload<{ include: { outputs: true } }>

/** fromPrismaMoldDesign maps a persisted MoldDesign row into the record shape needed for spec reference resolution. */
function fromPrismaMoldDesign(row: MoldDesignWithOutputs): MoldDesignRecord {
  return {
    moldDesignId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    designCode: row.designCode,
    name: row.name,
    revisionCode: row.revisionCode,
    supersedesDesignId: row.supersedesDesignId,
    productFamilyRef: fromJson<MoldDesignRecord['productFamilyRef']>(row.productFamilyRef),
    manufacturingSpecRefs: fromJson<MoldDesignRecord['manufacturingSpecRefs']>(row.manufacturingSpecRefs),
    itemRef: fromNullableJson<MoldDesignRecord['itemRef']>(row.itemRef),
    materialType: row.materialType,
    functionRole: row.functionRole as MoldDesignRecord['functionRole'],
    productionMethodTags: row.productionMethodTags,
    outputStructureType: row.outputStructureType as MoldDesignRecord['outputStructureType'],
    outputs: row.outputs.map((output) => ({
      moldDesignOutputId: output.id,
      tenantId: output.tenantId,
      orgId: output.orgId,
      moldDesignId: output.moldDesignId,
      sequenceNo: output.sequenceNo,
      outputCode: output.outputCode,
      outputKind: output.outputKind as MoldDesignOutputRecord['outputKind'],
      productFamilyRef: fromNullableJson<MoldDesignOutputRecord['productFamilyRef']>(output.productFamilyRef),
      manufacturingSpecRef: fromNullableJson<MoldDesignOutputRecord['manufacturingSpecRef']>(output.manufacturingSpecRef),
      options: fromJson<MoldDesignOutputRecord['options']>(output.options),
      quantityPerUse: output.quantityPerUse,
      componentRole: output.componentRole,
      assemblyHint: output.assemblyHint,
      isPrimaryOutput: output.isPrimaryOutput
    })),
    defaultLifeLimit: row.defaultLifeLimit,
    defaultLifeUnit: row.defaultLifeUnit,
    status: row.status as MoldDesignRecord['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
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
function toPrismaMesCommandIdempotency(
  record: MesCommandIdempotencyRecord
): Prisma.MesCommandIdempotencyUncheckedCreateInput {
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

/** fromPrismaMesCommandIdempotency maps one Prisma idempotency row into the shared MES command shape. */
function fromPrismaMesCommandIdempotency(
  row: Prisma.MesCommandIdempotencyGetPayload<object>
): MesCommandIdempotencyRecord {
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

/** nullableJson maps optional JSON snapshots into Prisma JSON null semantics. */
function nullableJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined ? Prisma.JsonNull : toJson(value)
}

/** toJson converts a domain snapshot into Prisma JSON input. */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

/** fromJson casts a Prisma JSON value back to the requested domain shape. */
function fromJson<T>(value: unknown): T {
  return value as unknown as T
}

/** fromNullableJson casts optional Prisma JSON values while preserving null. */
function fromNullableJson<T>(value: unknown): T | null {
  if (value === null || value === undefined || value === Prisma.JsonNull) {
    return null
  }
  return value as unknown as T
}
