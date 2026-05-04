import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../prisma/generated/prisma'
import {
  MasterMoldRecord,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesLocationRecord,
  MesOutboxEventRecord,
  MoldDesignOutputRecord,
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
import { PrismaExecutionClient, PrismaService } from '../../prisma/prisma.service'

/** PrismaMesMoldRepository persists MES mold current projections, append-only facts, audit, and outbox records. */
@Injectable()
export class PrismaMesMoldRepository implements MesMoldRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }

  async saveMoldDesign(record: MoldDesignRecord): Promise<MoldDesignRecord> {
    const client = this.client()
    await client.moldDesign.upsert({
      where: { id: record.moldDesignId },
      create: toPrismaMoldDesign(record),
      update: toPrismaMoldDesign(record)
    })
    await client.moldDesignOutput.deleteMany({ where: { moldDesignId: record.moldDesignId } })
    if (record.outputs.length) {
      await client.moldDesignOutput.createMany({
        data: record.outputs.map(toPrismaMoldDesignOutput)
      })
    }
    return this.findMoldDesignById(record.tenantId, record.moldDesignId).then((found) => found ?? record)
  }

  async findMoldDesignById(tenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null> {
    const row = await this.client().moldDesign.findFirst({
      where: { id: moldDesignId, tenantId },
      include: { outputs: { orderBy: { sequenceNo: 'asc' } } }
    })
    return row ? fromPrismaMoldDesign(row) : null
  }

  async findMoldDesignByCode(
    tenantId: string,
    orgId: string | null | undefined,
    designCode: string
  ): Promise<MoldDesignRecord | null> {
    const row = await this.client().moldDesign.findFirst({
      where: { tenantId, orgId: orgId ?? null, designCode },
      include: { outputs: { orderBy: { sequenceNo: 'asc' } } }
    })
    return row ? fromPrismaMoldDesign(row) : null
  }

  async searchMoldDesigns(input: SearchMoldDesignsInput): Promise<PageResult<MoldDesignRecord>> {
    const where: Prisma.MoldDesignWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.materialType ? { materialType: input.materialType } : {}),
      ...(input.functionRole ? { functionRole: input.functionRole } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.itemId ? { itemRef: { path: ['itemId'], equals: input.itemId } } : {}),
      ...(input.productFamilyRefId ? { productFamilyRef: { path: ['refId'], equals: input.productFamilyRefId } } : {}),
      ...(input.productionMethodTag ? { productionMethodTags: { has: input.productionMethodTag } } : {}),
      ...(input.keyword
        ? {
            OR: [
              { designCode: { contains: input.keyword.toUpperCase() } },
              { name: { contains: input.keyword, mode: 'insensitive' } }
            ]
          }
        : {})
    }
    const rows = await this.client().moldDesign.findMany({
      where,
      include: { outputs: { orderBy: { sequenceNo: 'asc' } } },
      orderBy: { designCode: 'asc' }
    })
    const filtered = input.manufacturingSpecRefId
      ? rows.filter((row) =>
          fromJson<Array<{ refId?: string }>>(row.manufacturingSpecRefs).some(
            (ref) => ref.refId === input.manufacturingSpecRefId
          )
        )
      : rows
    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize).map(fromPrismaMoldDesign),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  async saveMasterMold(record: MasterMoldRecord): Promise<MasterMoldRecord> {
    const saved = await this.client().masterMold.upsert({
      where: { id: record.masterMoldId },
      create: toPrismaMasterMold(record),
      update: toPrismaMasterMold(record)
    })
    return fromPrismaMasterMold(saved)
  }

  async findMasterMoldById(tenantId: string, masterMoldId: string): Promise<MasterMoldRecord | null> {
    const row = await this.client().masterMold.findFirst({ where: { id: masterMoldId, tenantId } })
    return row ? fromPrismaMasterMold(row) : null
  }

  async findMasterMoldByCode(
    tenantId: string,
    orgId: string | null | undefined,
    masterMoldCode: string
  ): Promise<MasterMoldRecord | null> {
    const row = await this.client().masterMold.findFirst({ where: { tenantId, orgId: orgId ?? null, masterMoldCode } })
    return row ? fromPrismaMasterMold(row) : null
  }

  async saveProductionMoldInstance(record: ProductionMoldInstanceRecord): Promise<ProductionMoldInstanceRecord> {
    const saved = await this.client().productionMoldInstance.upsert({
      where: { id: record.productionMoldInstanceId },
      create: toPrismaProductionMoldInstance(record),
      update: toPrismaProductionMoldInstance(record)
    })
    return fromPrismaProductionMoldInstance(saved)
  }

  async findProductionMoldInstanceById(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<ProductionMoldInstanceRecord | null> {
    const row = await this.client().productionMoldInstance.findFirst({
      where: { id: productionMoldInstanceId, tenantId }
    })
    return row ? fromPrismaProductionMoldInstance(row) : null
  }

  async findProductionMoldInstanceByCode(
    tenantId: string,
    orgId: string | null | undefined,
    moldInstanceCode: string
  ): Promise<ProductionMoldInstanceRecord | null> {
    const row = await this.client().productionMoldInstance.findFirst({
      where: { tenantId, orgId: orgId ?? null, moldInstanceCode }
    })
    return row ? fromPrismaProductionMoldInstance(row) : null
  }

  async searchProductionMoldInstances(
    input: SearchProductionMoldInstancesInput
  ): Promise<PageResult<ProductionMoldInstanceRecord>> {
    const where: Prisma.ProductionMoldInstanceWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.moldDesignId ? { moldDesignId: input.moldDesignId } : {}),
      ...(input.status ? { currentStatus: input.status } : {}),
      ...(input.warningLevel ? { warningLevel: input.warningLevel } : {}),
      ...(input.supplierId ? { supplierRef: { path: ['supplierId'], equals: input.supplierId } } : {})
    }
    const [total, rows] = await Promise.all([
      this.client().productionMoldInstance.count({ where }),
      this.client().productionMoldInstance.findMany({
        where,
        orderBy: { moldInstanceCode: 'asc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      })
    ])
    return {
      items: rows.map(fromPrismaProductionMoldInstance),
      total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  async saveMoldLifeCounter(record: MoldLifeCounterRecord): Promise<MoldLifeCounterRecord> {
    const saved = await this.client().moldLifeCounter.upsert({
      where: { productionMoldInstanceId: record.productionMoldInstanceId },
      create: toPrismaMoldLifeCounter(record),
      update: toPrismaMoldLifeCounter(record)
    })
    return fromPrismaMoldLifeCounter(saved)
  }

  async findMoldLifeCounterByInstanceId(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldLifeCounterRecord | null> {
    const row = await this.client().moldLifeCounter.findFirst({ where: { tenantId, productionMoldInstanceId } })
    return row ? fromPrismaMoldLifeCounter(row) : null
  }

  async findMesLocationById(tenantId: string, mesLocationId: string): Promise<MesLocationRecord | null> {
    const row = await this.client().mesLocation.findFirst({ where: { id: mesLocationId, tenantId } })
    return row ? fromPrismaMesLocation(row) : null
  }

  async findWorkCenterById(tenantId: string, workCenterId: string): Promise<WorkCenterRecord | null> {
    const row = await this.client().workCenter.findFirst({ where: { id: workCenterId, tenantId } })
    return row ? fromPrismaWorkCenter(row) : null
  }

  async findResourcePositionById(tenantId: string, resourcePositionId: string): Promise<ResourcePositionRecord | null> {
    const row = await this.client().resourcePosition.findFirst({ where: { id: resourcePositionId, tenantId } })
    return row ? fromPrismaResourcePosition(row) : null
  }

  async appendMovementEvent(record: MoldMovementEventRecord): Promise<MoldMovementEventRecord> {
    const saved = await this.client().moldMovementEvent.create({ data: toPrismaMoldMovementEvent(record) })
    return fromPrismaMoldMovementEvent(saved)
  }

  async findLastMovementEvent(
    tenantId: string,
    moldResourceType: MoldResourceType,
    moldResourceId: string
  ): Promise<MoldMovementEventRecord | null> {
    const row = await this.client().moldMovementEvent.findFirst({
      where: { tenantId, moldResourceType, moldResourceId },
      orderBy: { movedAt: 'desc' }
    })
    return row ? fromPrismaMoldMovementEvent(row) : null
  }

  async listMovementEventsByResource(
    tenantId: string,
    moldResourceType: MoldResourceType,
    moldResourceId: string
  ): Promise<MoldMovementEventRecord[]> {
    const rows = await this.client().moldMovementEvent.findMany({
      where: { tenantId, moldResourceType, moldResourceId },
      orderBy: { movedAt: 'asc' }
    })
    return rows.map(fromPrismaMoldMovementEvent)
  }

  async saveMoldInstallation(record: MoldInstallationRecord): Promise<MoldInstallationRecord> {
    const saved = await this.client().moldInstallation.upsert({
      where: { id: record.moldInstallationId },
      create: toPrismaMoldInstallation(record),
      update: toPrismaMoldInstallation(record)
    })
    return fromPrismaMoldInstallation(saved)
  }

  async findMoldInstallationById(tenantId: string, moldInstallationId: string): Promise<MoldInstallationRecord | null> {
    const row = await this.client().moldInstallation.findFirst({ where: { id: moldInstallationId, tenantId } })
    return row ? fromPrismaMoldInstallation(row) : null
  }

  async findActiveInstallationByMold(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldInstallationRecord | null> {
    const row = await this.client().moldInstallation.findFirst({
      where: {
        tenantId,
        productionMoldInstanceId,
        installationStatus: MoldInstallationStatus.ACTIVE,
        unmountedAt: null
      }
    })
    return row ? fromPrismaMoldInstallation(row) : null
  }

  async findActiveInstallationByPosition(
    tenantId: string,
    resourcePositionId: string
  ): Promise<MoldInstallationRecord | null> {
    const row = await this.client().moldInstallation.findFirst({
      where: {
        tenantId,
        resourcePositionId,
        installationStatus: MoldInstallationStatus.ACTIVE,
        unmountedAt: null
      }
    })
    return row ? fromPrismaMoldInstallation(row) : null
  }

  async listActiveInstallationsByWorkCenter(tenantId: string, workCenterId: string): Promise<MoldInstallationRecord[]> {
    const rows = await this.client().moldInstallation.findMany({
      where: { tenantId, workCenterId, installationStatus: MoldInstallationStatus.ACTIVE, unmountedAt: null },
      orderBy: { installedAt: 'asc' }
    })
    return rows.map(fromPrismaMoldInstallation)
  }

  async listInstallationsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldInstallationRecord[]> {
    const rows = await this.client().moldInstallation.findMany({
      where: { tenantId, productionMoldInstanceId },
      orderBy: { installedAt: 'asc' }
    })
    return rows.map(fromPrismaMoldInstallation)
  }

  async appendUsageEvent(record: MoldUsageEventRecord): Promise<MoldUsageEventRecord> {
    const saved = await this.client().moldUsageEvent.create({ data: toPrismaMoldUsageEvent(record) })
    return fromPrismaMoldUsageEvent(saved)
  }

  async listUsageEventsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldUsageEventRecord[]> {
    const rows = await this.client().moldUsageEvent.findMany({
      where: { tenantId, productionMoldInstanceId },
      orderBy: { usedAt: 'asc' }
    })
    return rows.map(fromPrismaMoldUsageEvent)
  }

  async findLastUsageEventByMold(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldUsageEventRecord | null> {
    const row = await this.client().moldUsageEvent.findFirst({
      where: { tenantId, productionMoldInstanceId },
      orderBy: { usedAt: 'desc' }
    })
    return row ? fromPrismaMoldUsageEvent(row) : null
  }

  async saveMoldWarningEvent(record: MoldWarningEventRecord): Promise<MoldWarningEventRecord> {
    const saved = await this.client().moldWarningEvent.upsert({
      where: { id: record.moldWarningEventId },
      create: toPrismaMoldWarningEvent(record),
      update: toPrismaMoldWarningEvent(record)
    })
    return fromPrismaMoldWarningEvent(saved)
  }

  async findMoldWarningEventById(tenantId: string, moldWarningEventId: string): Promise<MoldWarningEventRecord | null> {
    const row = await this.client().moldWarningEvent.findFirst({ where: { id: moldWarningEventId, tenantId } })
    return row ? fromPrismaMoldWarningEvent(row) : null
  }

  async findOpenWarningByMoldAndType(
    tenantId: string,
    productionMoldInstanceId: string,
    warningType: MoldWarningType
  ): Promise<MoldWarningEventRecord | null> {
    const row = await this.client().moldWarningEvent.findFirst({
      where: { tenantId, productionMoldInstanceId, warningType, status: MoldWarningStatus.OPEN }
    })
    return row ? fromPrismaMoldWarningEvent(row) : null
  }

  async findCurrentWarningByMold(
    tenantId: string,
    productionMoldInstanceId: string
  ): Promise<MoldWarningEventRecord | null> {
    const rows = await this.client().moldWarningEvent.findMany({
      where: { tenantId, productionMoldInstanceId, status: MoldWarningStatus.OPEN },
      orderBy: { raisedAt: 'desc' }
    })
    return rows.map(fromPrismaMoldWarningEvent).sort((left, right) => severityRank(right.warningLevel) - severityRank(left.warningLevel))[0] ?? null
  }

  async searchMoldWarnings(input: SearchMoldWarningsInput): Promise<PageResult<MoldWarningEventRecord>> {
    const where: Prisma.MoldWarningEventWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.warningType ? { warningType: input.warningType } : {}),
      ...(input.warningLevel ? { warningLevel: input.warningLevel } : {}),
      ...(input.raisedFrom || input.raisedTo
        ? {
            raisedAt: {
              ...(input.raisedFrom ? { gte: new Date(input.raisedFrom) } : {}),
              ...(input.raisedTo ? { lte: new Date(input.raisedTo) } : {})
            }
          }
        : {})
    }
    const rows = await this.client().moldWarningEvent.findMany({
      where,
      orderBy: { raisedAt: 'desc' }
    })
    const filtered = []
    for (const row of rows.map(fromPrismaMoldWarningEvent)) {
      if (!input.workCenterId && !input.moldDesignId) {
        filtered.push(row)
        continue
      }
      const instance = await this.findProductionMoldInstanceById(input.tenantId, row.productionMoldInstanceId)
      if (
        (!input.workCenterId || instance?.currentWorkCenterId === input.workCenterId) &&
        (!input.moldDesignId || instance?.moldDesignId === input.moldDesignId)
      ) {
        filtered.push(row)
      }
    }
    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  async listWarningsByMold(tenantId: string, productionMoldInstanceId: string): Promise<MoldWarningEventRecord[]> {
    const rows = await this.client().moldWarningEvent.findMany({
      where: { tenantId, productionMoldInstanceId },
      orderBy: { raisedAt: 'asc' }
    })
    return rows.map(fromPrismaMoldWarningEvent)
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

  private client(): PrismaExecutionClient {
    return this.prisma.getExecutionClient()
  }
}

type MoldDesignWithOutputs = Prisma.MoldDesignGetPayload<{ include: { outputs: true } }>

function toPrismaMoldDesign(record: MoldDesignRecord): Prisma.MoldDesignUncheckedCreateInput {
  return {
    id: record.moldDesignId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    designCode: record.designCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    supersedesDesignId: record.supersedesDesignId ?? null,
    productFamilyRef: toJson(record.productFamilyRef),
    manufacturingSpecRefs: toJson(record.manufacturingSpecRefs),
    itemRef: nullableJson(record.itemRef),
    materialType: record.materialType,
    functionRole: record.functionRole,
    productionMethodTags: record.productionMethodTags,
    outputStructureType: record.outputStructureType,
    defaultLifeLimit: record.defaultLifeLimit ?? null,
    defaultLifeUnit: record.defaultLifeUnit ?? null,
    status: record.status,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  }
}

function toPrismaMoldDesignOutput(record: MoldDesignOutputRecord): Prisma.MoldDesignOutputCreateManyInput {
  return {
    id: record.moldDesignOutputId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    moldDesignId: record.moldDesignId,
    sequenceNo: record.sequenceNo,
    outputCode: record.outputCode,
    outputKind: record.outputKind,
    productFamilyRef: nullableJson(record.productFamilyRef),
    manufacturingSpecRef: nullableJson(record.manufacturingSpecRef),
    quantityPerUse: record.quantityPerUse,
    componentRole: record.componentRole ?? null,
    assemblyHint: record.assemblyHint ?? null,
    isPrimaryOutput: record.isPrimaryOutput
  }
}

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

function toPrismaMasterMold(record: MasterMoldRecord): Prisma.MasterMoldUncheckedCreateInput {
  return {
    id: record.masterMoldId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    masterMoldCode: record.masterMoldCode,
    moldDesignId: record.moldDesignId,
    supplierRef: nullableJson(record.supplierRef),
    purchaseRef: nullableJson(record.purchaseRef),
    receivedAt: record.receivedAt ?? null,
    currentStatus: record.currentStatus,
    currentMesLocationId: record.currentMesLocationId ?? null,
    qualitySummary: record.qualitySummary ?? null,
    notes: record.notes ?? null,
    scrappedAt: record.scrappedAt ?? null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  }
}

function fromPrismaMasterMold(row: Prisma.MasterMoldGetPayload<object>): MasterMoldRecord {
  return {
    masterMoldId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    masterMoldCode: row.masterMoldCode,
    moldDesignId: row.moldDesignId,
    supplierRef: fromNullableJson<MasterMoldRecord['supplierRef']>(row.supplierRef),
    purchaseRef: fromNullableJson<MasterMoldRecord['purchaseRef']>(row.purchaseRef),
    receivedAt: row.receivedAt,
    currentStatus: row.currentStatus,
    currentMesLocationId: row.currentMesLocationId,
    qualitySummary: row.qualitySummary,
    notes: row.notes,
    scrappedAt: row.scrappedAt,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

function toPrismaProductionMoldInstance(record: ProductionMoldInstanceRecord): Prisma.ProductionMoldInstanceUncheckedCreateInput {
  return {
    id: record.productionMoldInstanceId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    moldInstanceCode: record.moldInstanceCode,
    moldDesignId: record.moldDesignId,
    masterMoldId: record.masterMoldId ?? null,
    supplierRef: nullableJson(record.supplierRef),
    purchaseRef: nullableJson(record.purchaseRef),
    receivedAt: record.receivedAt ?? null,
    acceptedAt: record.acceptedAt ?? null,
    currentStatus: record.currentStatus,
    currentMesLocationId: record.currentMesLocationId ?? null,
    currentWorkCenterId: record.currentWorkCenterId ?? null,
    currentResourcePositionId: record.currentResourcePositionId ?? null,
    currentInstallationId: record.currentInstallationId ?? null,
    lifeUsedValue: record.lifeUsedValue,
    lifeLimitValue: record.lifeLimitValue,
    lifeUnit: record.lifeUnit,
    warningLevel: record.warningLevel,
    scrappedAt: record.scrappedAt ?? null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  }
}

function fromPrismaProductionMoldInstance(row: Prisma.ProductionMoldInstanceGetPayload<object>): ProductionMoldInstanceRecord {
  return {
    productionMoldInstanceId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    moldInstanceCode: row.moldInstanceCode,
    moldDesignId: row.moldDesignId,
    masterMoldId: row.masterMoldId,
    supplierRef: fromNullableJson<ProductionMoldInstanceRecord['supplierRef']>(row.supplierRef),
    purchaseRef: fromNullableJson<ProductionMoldInstanceRecord['purchaseRef']>(row.purchaseRef),
    receivedAt: row.receivedAt,
    acceptedAt: row.acceptedAt,
    currentStatus: row.currentStatus as ProductionMoldInstanceRecord['currentStatus'],
    currentMesLocationId: row.currentMesLocationId,
    currentWorkCenterId: row.currentWorkCenterId,
    currentResourcePositionId: row.currentResourcePositionId,
    currentInstallationId: row.currentInstallationId,
    lifeUsedValue: row.lifeUsedValue,
    lifeLimitValue: row.lifeLimitValue,
    lifeUnit: row.lifeUnit,
    warningLevel: row.warningLevel as ProductionMoldInstanceRecord['warningLevel'],
    scrappedAt: row.scrappedAt,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

function fromPrismaMesLocation(row: Prisma.MesLocationGetPayload<object>): MesLocationRecord {
  return {
    mesLocationId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    locationCode: row.locationCode,
    name: row.name,
    locationType: row.locationType,
    parentMesLocationId: row.parentLocationId,
    relatedWorkCenterId: row.relatedWorkCenterId,
    capacityProfileId: row.capacityProfileId,
    status: row.status as MesLocationRecord['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

function fromPrismaWorkCenter(row: Prisma.WorkCenterGetPayload<object>): WorkCenterRecord {
  return {
    workCenterId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    workCenterCode: row.workCenterCode,
    name: row.name,
    workCenterType: row.workCenterType,
    parentWorkCenterId: row.parentWorkCenterId,
    relatedMesLocationId: row.relatedMesLocationId,
    capacityProfileId: row.capacityProfileId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

function fromPrismaResourcePosition(row: Prisma.ResourcePositionGetPayload<object>): ResourcePositionRecord {
  return {
    resourcePositionId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    workCenterId: row.workCenterId,
    positionCode: row.positionCode,
    name: row.name,
    positionType: row.positionType,
    compatibleMoldDesignRefs: row.compatibleMoldDesignRefs,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

function toPrismaMoldMovementEvent(record: MoldMovementEventRecord): Prisma.MoldMovementEventUncheckedCreateInput {
  return {
    id: record.moldMovementEventId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    moldResourceType: record.moldResourceType,
    moldResourceId: record.moldResourceId,
    fromMesLocationId: record.fromMesLocationId ?? null,
    toMesLocationId: record.toMesLocationId,
    movementReason: record.movementReason,
    movedAt: new Date(record.movedAt),
    operatorRef: toJson(record.operatorRef),
    sourceCommandId: record.sourceCommandId,
    auditRef: toJson(record.auditRef)
  }
}

function fromPrismaMoldMovementEvent(row: Prisma.MoldMovementEventGetPayload<object>): MoldMovementEventRecord {
  return {
    moldMovementEventId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    moldResourceType: row.moldResourceType as MoldMovementEventRecord['moldResourceType'],
    moldResourceId: row.moldResourceId,
    fromMesLocationId: row.fromMesLocationId,
    toMesLocationId: row.toMesLocationId,
    movementReason: row.movementReason,
    movedAt: row.movedAt.toISOString(),
    operatorRef: fromJson<MoldMovementEventRecord['operatorRef']>(row.operatorRef),
    sourceCommandId: row.sourceCommandId,
    auditRef: fromJson<MoldMovementEventRecord['auditRef']>(row.auditRef)
  }
}

function toPrismaMoldInstallation(record: MoldInstallationRecord): Prisma.MoldInstallationUncheckedCreateInput {
  return {
    id: record.moldInstallationId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    productionMoldInstanceId: record.productionMoldInstanceId,
    workCenterId: record.workCenterId,
    resourcePositionId: record.resourcePositionId,
    installedAt: new Date(record.installedAt),
    unmountedAt: record.unmountedAt ? new Date(record.unmountedAt) : null,
    installedByRef: toJson(record.installedByRef),
    unmountedByRef: nullableJson(record.unmountedByRef),
    installationStatus: record.installationStatus,
    setupSnapshot: record.setupSnapshot ?? null,
    operationRef: nullableJson(record.operationRef),
    routingRef: nullableJson(record.routingRef),
    workOrderRef: nullableJson(record.workOrderRef),
    operationTaskRef: nullableJson(record.operationTaskRef),
    auditRef: toJson(record.auditRef)
  }
}

function fromPrismaMoldInstallation(row: Prisma.MoldInstallationGetPayload<object>): MoldInstallationRecord {
  return {
    moldInstallationId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    productionMoldInstanceId: row.productionMoldInstanceId,
    workCenterId: row.workCenterId,
    resourcePositionId: row.resourcePositionId,
    installedAt: row.installedAt.toISOString(),
    unmountedAt: row.unmountedAt?.toISOString() ?? null,
    installedByRef: fromJson<MoldInstallationRecord['installedByRef']>(row.installedByRef),
    unmountedByRef: fromNullableJson<MoldInstallationRecord['unmountedByRef']>(row.unmountedByRef),
    installationStatus: row.installationStatus as MoldInstallationRecord['installationStatus'],
    setupSnapshot: row.setupSnapshot,
    operationRef: fromNullableJson<MoldInstallationRecord['operationRef']>(row.operationRef),
    routingRef: fromNullableJson<MoldInstallationRecord['routingRef']>(row.routingRef),
    workOrderRef: fromNullableJson<MoldInstallationRecord['workOrderRef']>(row.workOrderRef),
    operationTaskRef: fromNullableJson<MoldInstallationRecord['operationTaskRef']>(row.operationTaskRef),
    auditRef: fromJson<MoldInstallationRecord['auditRef']>(row.auditRef)
  }
}

function toPrismaMoldUsageEvent(record: MoldUsageEventRecord): Prisma.MoldUsageEventUncheckedCreateInput {
  return {
    id: record.moldUsageEventId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    productionMoldInstanceId: record.productionMoldInstanceId,
    moldInstallationId: record.moldInstallationId,
    workCenterId: record.workCenterId,
    resourcePositionId: record.resourcePositionId ?? null,
    usageMode: record.usageMode,
    usedAt: new Date(record.usedAt),
    usageQuantity: record.usageQuantity,
    lifeDelta: record.lifeDelta,
    lifeUnit: record.lifeUnit,
    lifeUsedValueAfter: record.lifeUsedValueAfter,
    productFamilyRef: nullableJson(record.productFamilyRef),
    manufacturingSpecRef: nullableJson(record.manufacturingSpecRef),
    wipUnitRef: nullableJson(record.wipUnitRef),
    physicalTraceId: record.physicalTraceId ?? null,
    workOrderRef: nullableJson(record.workOrderRef),
    operationTaskRef: nullableJson(record.operationTaskRef),
    operatorRef: toJson(record.operatorRef),
    captureSource: record.captureSource,
    auditRef: toJson(record.auditRef)
  }
}

function fromPrismaMoldUsageEvent(row: Prisma.MoldUsageEventGetPayload<object>): MoldUsageEventRecord {
  return {
    moldUsageEventId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    productionMoldInstanceId: row.productionMoldInstanceId,
    moldInstallationId: row.moldInstallationId,
    workCenterId: row.workCenterId,
    resourcePositionId: row.resourcePositionId,
    usageMode: row.usageMode as MoldUsageEventRecord['usageMode'],
    usedAt: row.usedAt.toISOString(),
    usageQuantity: row.usageQuantity,
    lifeDelta: row.lifeDelta,
    lifeUnit: row.lifeUnit,
    lifeUsedValueAfter: row.lifeUsedValueAfter,
    productFamilyRef: fromNullableJson<MoldUsageEventRecord['productFamilyRef']>(row.productFamilyRef),
    manufacturingSpecRef: fromNullableJson<MoldUsageEventRecord['manufacturingSpecRef']>(row.manufacturingSpecRef),
    wipUnitRef: fromNullableJson<MoldUsageEventRecord['wipUnitRef']>(row.wipUnitRef),
    physicalTraceId: row.physicalTraceId,
    workOrderRef: fromNullableJson<MoldUsageEventRecord['workOrderRef']>(row.workOrderRef),
    operationTaskRef: fromNullableJson<MoldUsageEventRecord['operationTaskRef']>(row.operationTaskRef),
    operatorRef: fromJson<MoldUsageEventRecord['operatorRef']>(row.operatorRef),
    captureSource: row.captureSource,
    auditRef: fromJson<MoldUsageEventRecord['auditRef']>(row.auditRef)
  }
}

function toPrismaMoldLifeCounter(record: MoldLifeCounterRecord): Prisma.MoldLifeCounterUncheckedCreateInput {
  return {
    id: record.moldLifeCounterId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    productionMoldInstanceId: record.productionMoldInstanceId,
    lifeUnit: record.lifeUnit,
    usedValue: record.usedValue,
    limitValue: record.limitValue,
    warningThresholdValue: record.warningThresholdValue,
    lastUsageEventId: record.lastUsageEventId ?? null,
    lastAdjustedAt: record.lastAdjustedAt ? new Date(record.lastAdjustedAt) : null,
    lastAdjustedByRef: nullableJson(record.lastAdjustedByRef),
    adjustmentReason: record.adjustmentReason ?? null,
    updatedAt: new Date(record.updatedAt)
  }
}

function fromPrismaMoldLifeCounter(row: Prisma.MoldLifeCounterGetPayload<object>): MoldLifeCounterRecord {
  return {
    moldLifeCounterId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    productionMoldInstanceId: row.productionMoldInstanceId,
    lifeUnit: row.lifeUnit,
    usedValue: row.usedValue,
    limitValue: row.limitValue,
    warningThresholdValue: row.warningThresholdValue,
    lastUsageEventId: row.lastUsageEventId,
    lastAdjustedAt: row.lastAdjustedAt?.toISOString() ?? null,
    lastAdjustedByRef: fromNullableJson<MoldLifeCounterRecord['lastAdjustedByRef']>(row.lastAdjustedByRef),
    adjustmentReason: row.adjustmentReason,
    updatedAt: row.updatedAt.toISOString()
  }
}

function toPrismaMoldWarningEvent(record: MoldWarningEventRecord): Prisma.MoldWarningEventUncheckedCreateInput {
  return {
    id: record.moldWarningEventId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    productionMoldInstanceId: record.productionMoldInstanceId,
    warningType: record.warningType,
    warningLevel: record.warningLevel,
    triggeredByEventId: record.triggeredByEventId ?? null,
    lifeUsedValue: record.lifeUsedValue,
    lifeLimitValue: record.lifeLimitValue,
    raisedAt: new Date(record.raisedAt),
    acknowledgedAt: record.acknowledgedAt ? new Date(record.acknowledgedAt) : null,
    acknowledgedByRef: nullableJson(record.acknowledgedByRef),
    status: record.status,
    auditRef: toJson(record.auditRef)
  }
}

function fromPrismaMoldWarningEvent(row: Prisma.MoldWarningEventGetPayload<object>): MoldWarningEventRecord {
  return {
    moldWarningEventId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    productionMoldInstanceId: row.productionMoldInstanceId,
    warningType: row.warningType as MoldWarningEventRecord['warningType'],
    warningLevel: row.warningLevel as MoldWarningEventRecord['warningLevel'],
    triggeredByEventId: row.triggeredByEventId,
    lifeUsedValue: row.lifeUsedValue,
    lifeLimitValue: row.lifeLimitValue,
    raisedAt: row.raisedAt.toISOString(),
    acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    acknowledgedByRef: fromNullableJson<MoldWarningEventRecord['acknowledgedByRef']>(row.acknowledgedByRef),
    status: row.status as MoldWarningEventRecord['status'],
    auditRef: fromJson<MoldWarningEventRecord['auditRef']>(row.auditRef)
  }
}

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

function nullableJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined ? Prisma.JsonNull : toJson(value)
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function fromJson<T>(value: unknown): T {
  return value as unknown as T
}

function fromNullableJson<T>(value: unknown): T | null {
  if (value === null || value === undefined || value === Prisma.JsonNull) {
    return null
  }
  return value as unknown as T
}

function severityRank(level: string): number {
  return level === 'CRITICAL' ? 3 : level === 'WARNING' ? 2 : level === 'INFO' ? 1 : 0
}
