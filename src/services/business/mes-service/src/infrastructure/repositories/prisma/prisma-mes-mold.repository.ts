import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Prisma } from '../../../../prisma/generated/prisma'
import {
  CurrentMoldByWorkCenterRecord,
  MasterMoldRecord,
  MasterMoldStatus,
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  MoldDesignOutputRecord,
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
import { MES_NOT_FOUND } from '../../../common/errors/mes.errors'
import {
  GetMoldUsageHistoryInput,
  ListCurrentMoldsByWorkCenterInput,
  ListCurrentMoldsByWorkCenterResult,
  ListMoldLifeCountersInput,
  ListProductionMoldsByDesignInput,
  ListProductionMoldsByDesignResult,
  MesMoldRepository,
  MoldDesignSummaryPageResult,
  MoldLifeCounterPageResult,
  MoldUsageHistoryResult,
  SearchMasterMoldsInput,
  SearchMoldDesignsInput,
  SearchProductionMoldsInput,
  ProductionMoldSummaryPageResult
} from '../../../domain/repositories/mes-mold.repository'
import { PrismaExecutionClient, PrismaService } from '../../prisma/prisma.service'

/** PrismaMesMoldRepository persists current Mold / Tooling records and append-only MES facts. */
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
      await client.moldDesignOutput.createMany({ data: record.outputs.map(toPrismaMoldDesignOutput) })
    }
    return (await this.findMoldDesignById(record.tenantId, record.moldDesignId)) ?? record
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

  async searchMoldDesigns(input: SearchMoldDesignsInput): Promise<MoldDesignSummaryPageResult> {
    const keyword = input.keyword?.trim()
    const where: Prisma.MoldDesignWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.itemModelId ? { primaryItemModelRef: { path: ['itemModelId'], equals: input.itemModelId } } : {}),
      ...(keyword
        ? {
            OR: [
              { designCode: { contains: keyword, mode: 'insensitive' } },
              { name: { contains: keyword, mode: 'insensitive' } }
            ]
          }
        : {})
    }
    const rows = await this.client().moldDesign.findMany({
      where,
      include: { outputs: { orderBy: { sequenceNo: 'asc' } } },
      orderBy: { designCode: 'asc' }
    })
    const filtered = input.productionSpecId
      ? rows.filter((row) =>
          fromJson<Array<{ productionSpecId?: string }>>(row.productionSpecRefs).some(
            (ref) => ref.productionSpecId === input.productionSpecId
          )
        )
      : rows
    const page = paginate(filtered.map(fromPrismaMoldDesign).map(toMoldDesignSummary), input.page, input.pageSize)
    return { moldDesigns: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
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

  async searchMasterMolds(input: SearchMasterMoldsInput) {
    const keyword = input.keyword?.trim()
    const where: Prisma.MasterMoldWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.moldDesignId ? { moldDesignId: input.moldDesignId } : {}),
      ...(input.status ? { currentStatus: input.status } : {}),
      ...(input.storageResourceId ? { currentStorageResourceRef: { path: ['storageResourceId'], equals: input.storageResourceId } } : {}),
      ...(input.carrierResourceId ? { currentCarrierResourceRef: { path: ['carrierResourceId'], equals: input.carrierResourceId } } : {}),
      ...(keyword ? { masterMoldCode: { contains: keyword, mode: 'insensitive' } } : {})
    }
    const rows = await this.client().masterMold.findMany({ where, orderBy: { masterMoldCode: 'asc' } })
    const summaries = await Promise.all(rows.map(fromPrismaMasterMold).map((record) => this.toMasterMoldSummary(record)))
    const page = paginate(summaries, input.page, input.pageSize)
    return { masterMolds: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async saveProductionMold(record: ProductionMoldRecord): Promise<ProductionMoldRecord> {
    const saved = await this.client().productionMold.upsert({
      where: { id: record.productionMoldId },
      create: toPrismaProductionMold(record),
      update: toPrismaProductionMold(record)
    })
    return fromPrismaProductionMold(saved)
  }

  async findProductionMoldById(tenantId: string, productionMoldId: string): Promise<ProductionMoldRecord | null> {
    const row = await this.client().productionMold.findFirst({ where: { id: productionMoldId, tenantId } })
    return row ? fromPrismaProductionMold(row) : null
  }

  async findProductionMoldByCode(
    tenantId: string,
    orgId: string | null | undefined,
    moldCode: string
  ): Promise<ProductionMoldRecord | null> {
    const row = await this.client().productionMold.findFirst({ where: { tenantId, orgId: orgId ?? null, moldCode } })
    return row ? fromPrismaProductionMold(row) : null
  }

  async searchProductionMolds(input: SearchProductionMoldsInput): Promise<ProductionMoldSummaryPageResult> {
    const where: Prisma.ProductionMoldWhereInput = {
      tenantId: input.tenantId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      ...(input.moldDesignId ? { moldDesignId: input.moldDesignId } : {}),
      ...(input.status ? { currentStatus: input.status } : {}),
      ...(input.storageResourceId ? { currentStorageResourceRef: { path: ['storageResourceId'], equals: input.storageResourceId } } : {}),
      ...(input.carrierResourceId ? { currentCarrierResourceRef: { path: ['carrierResourceId'], equals: input.carrierResourceId } } : {})
    }
    const rows = await this.client().productionMold.findMany({ where, orderBy: { moldCode: 'asc' } })
    const records = rows.map(fromPrismaProductionMold)
    const summaries = await Promise.all(records.map((record) => this.toProductionMoldSummary(record)))
    const filtered = input.warningLevel
      ? summaries.filter((summary) => summary.lifeCounterSummary?.warningLevel === input.warningLevel)
      : summaries
    const page = paginate(filtered, input.page, input.pageSize)
    return { productionMolds: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
  }

  async listProductionMoldsByDesign(input: ListProductionMoldsByDesignInput): Promise<ListProductionMoldsByDesignResult> {
    const design = await this.findMoldDesignById(input.tenantId, input.moldDesignId)
    if (!design || (design.orgId ?? null) !== (input.orgId ?? null)) {
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

  async getToolingCurrentPlacement(
    tenantId: string,
    toolingType: ToolingType,
    toolingId: string
  ): Promise<ToolingPlacementSummaryRecord | null> {
    if (toolingType !== ToolingType.MOLD) {
      return null
    }
    const mold = await this.findProductionMoldById(tenantId, toolingId)
    if (!mold) {
      return null
    }
    if (mold.currentInstallationSummary) {
      return {
        placementType: mold.currentInstallationSummary.workUnitRef
          ? ToolingPlacementType.WORK_UNIT
          : ToolingPlacementType.WORK_CENTER,
        workCenterRef: mold.currentInstallationSummary.workCenterRef,
        workUnitRef: mold.currentInstallationSummary.workUnitRef ?? null,
        toolingInstallationId: mold.currentInstallationSummary.toolingInstallationId,
        moldInstallationDetail: mold.currentInstallationSummary.moldDetail ?? null
      }
    }
    if (mold.currentCarrierResourceRef) {
      return { placementType: ToolingPlacementType.CARRIER_RESOURCE, carrierResourceRef: mold.currentCarrierResourceRef }
    }
    return { placementType: ToolingPlacementType.STORAGE_RESOURCE, storageResourceRef: mold.currentStorageResourceRef ?? null }
  }

  async appendMoldMovement(record: MoldMovementRecord): Promise<MoldMovementRecord> {
    const saved = await this.client().moldMovement.create({ data: toPrismaMoldMovement(record) })
    return fromPrismaMoldMovement(saved)
  }

  async findLastMoldMovement(tenantId: string, toolingType: ToolingType, toolingId: string): Promise<MoldMovementRecord | null> {
    const row = await this.client().moldMovement.findFirst({
      where: { tenantId, toolingType, toolingId },
      orderBy: { movedAt: 'desc' }
    })
    return row ? fromPrismaMoldMovement(row) : null
  }

  async listMoldMovementsByTooling(tenantId: string, toolingType: ToolingType, toolingId: string): Promise<MoldMovementRecord[]> {
    const rows = await this.client().moldMovement.findMany({
      where: { tenantId, toolingType, toolingId },
      orderBy: { movedAt: 'asc' }
    })
    return rows.map(fromPrismaMoldMovement)
  }

  async saveToolingInstallation(record: ToolingInstallationRecord): Promise<ToolingInstallationRecord> {
    const client = this.client()
    await client.toolingInstallation.upsert({
      where: { id: record.toolingInstallationId },
      create: toPrismaToolingInstallation(record),
      update: toPrismaToolingInstallation(record)
    })
    await client.moldInstallationDetail.deleteMany({ where: { toolingInstallationId: record.toolingInstallationId } })
    if (record.moldDetail) {
      await client.moldInstallationDetail.create({ data: toPrismaMoldInstallationDetail(record.moldDetail) })
    }
    return (await this.findToolingInstallationById(record.tenantId, record.toolingInstallationId)) ?? record
  }

  async findToolingInstallationById(tenantId: string, toolingInstallationId: string): Promise<ToolingInstallationRecord | null> {
    const row = await this.client().toolingInstallation.findFirst({
      where: { id: toolingInstallationId, tenantId },
      include: { moldDetail: true }
    })
    return row ? fromPrismaToolingInstallation(row) : null
  }

  async findActiveToolingInstallationByMold(tenantId: string, productionMoldId: string): Promise<ToolingInstallationRecord | null> {
    const row = await this.client().toolingInstallation.findFirst({
      where: {
        tenantId,
        toolingType: ToolingType.MOLD,
        toolingId: productionMoldId,
        status: ToolingInstallationStatus.ACTIVE,
        unmountedAt: null
      },
      include: { moldDetail: true }
    })
    return row ? fromPrismaToolingInstallation(row) : null
  }

  async listToolingInstallationsByMold(tenantId: string, productionMoldId: string): Promise<ToolingInstallationRecord[]> {
    const rows = await this.client().toolingInstallation.findMany({
      where: { tenantId, toolingType: ToolingType.MOLD, toolingId: productionMoldId },
      include: { moldDetail: true },
      orderBy: { installedAt: 'asc' }
    })
    return rows.map(fromPrismaToolingInstallation)
  }

  async listCurrentMoldsByWorkCenter(input: ListCurrentMoldsByWorkCenterInput): Promise<ListCurrentMoldsByWorkCenterResult> {
    const rows = await this.client().toolingInstallation.findMany({
      where: { tenantId: input.tenantId, status: ToolingInstallationStatus.ACTIVE, unmountedAt: null },
      include: { moldDetail: true },
      orderBy: { installedAt: 'asc' }
    })
    const filtered = rows.map(fromPrismaToolingInstallation).filter((installation) => {
      return (
        (!input.orgId || (installation.orgId ?? null) === input.orgId) &&
        installation.workCenterRef.workCenterId === input.workCenterId &&
        (!input.workUnitId || installation.workUnitRef?.workUnitId === input.workUnitId)
      )
    })
    const items = []
    for (const toolingInstallation of filtered) {
      const mold = await this.findProductionMoldById(input.tenantId, toolingInstallation.toolingId)
      if (mold) {
        items.push({
          productionMold: await this.toProductionMoldSummary(mold),
          toolingInstallation,
          usageAllowed: mold.currentStatus === ProductionMoldStatus.INSTALLED,
          usageDisabledReason: mold.currentStatus === ProductionMoldStatus.INSTALLED ? null : `MOLD_${mold.currentStatus}`
        })
      }
    }
    return { items }
  }

  async appendMoldUsageRecord(record: MoldUsageRecord): Promise<MoldUsageRecord> {
    const saved = await this.client().moldUsageRecord.create({ data: toPrismaMoldUsageRecord(record) })
    return fromPrismaMoldUsageRecord(saved)
  }

  async listMoldUsageRecordsByMold(tenantId: string, productionMoldId: string): Promise<MoldUsageRecord[]> {
    const rows = await this.client().moldUsageRecord.findMany({
      where: { tenantId, productionMoldId },
      orderBy: { usedAt: 'asc' }
    })
    return rows.map(fromPrismaMoldUsageRecord)
  }

  async findLastMoldUsageRecordByMold(tenantId: string, productionMoldId: string): Promise<MoldUsageRecord | null> {
    const row = await this.client().moldUsageRecord.findFirst({
      where: { tenantId, productionMoldId },
      orderBy: { usedAt: 'desc' }
    })
    return row ? fromPrismaMoldUsageRecord(row) : null
  }

  async getMoldUsageHistory(input: GetMoldUsageHistoryInput): Promise<MoldUsageHistoryResult> {
    const [usageRows, installationRows, movementRows, mold, counter] = await Promise.all([
      this.client().moldUsageRecord.findMany({
      where: { tenantId: input.tenantId, productionMoldId: input.productionMoldId },
      orderBy: { usedAt: 'asc' }
      }),
      this.client().toolingInstallation.findMany({
        where: { tenantId: input.tenantId, toolingType: ToolingType.MOLD, toolingId: input.productionMoldId },
        include: { moldDetail: true },
        orderBy: { installedAt: 'asc' }
      }),
      this.client().moldMovement.findMany({
        where: { tenantId: input.tenantId, toolingType: ToolingType.MOLD, toolingId: input.productionMoldId },
        orderBy: { movedAt: 'asc' }
      }),
      this.findProductionMoldById(input.tenantId, input.productionMoldId),
      this.findMoldLifeCounterByProductionMold(input.tenantId, input.productionMoldId)
    ])
    const entries = [
      ...installationRows
        .map(fromPrismaToolingInstallation)
        .filter((record) => (!input.orgId || (record.orgId ?? null) === input.orgId))
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
      ...movementRows
        .map(fromPrismaMoldMovement)
        .filter((record) => (!input.orgId || (record.orgId ?? null) === input.orgId))
        .map<MoldUsageHistoryEntryRecord>((record) => ({
          entryType: MoldUsageHistoryEntryType.MOVE,
          happenedAt: record.movedAt,
          productionMoldId: record.toolingId,
          summary: 'Tooling moved',
          auditRef: record.auditRef
        })),
      ...(counter?.lastAdjustedAt
        ? [
            {
              entryType: MoldUsageHistoryEntryType.LIFE_ADJUSTMENT,
              happenedAt: counter.lastAdjustedAt,
              productionMoldId: counter.productionMoldId,
              summary: 'Mold life counter adjusted',
              auditRef: null
            }
          ]
        : []),
      ...(mold?.scrappedAt
        ? [
            {
              entryType: MoldUsageHistoryEntryType.SCRAP,
              happenedAt: mold.scrappedAt,
              productionMoldId: mold.productionMoldId,
              summary: 'Production mold scrapped',
              auditRef: null
            }
          ]
        : []),
      ...usageRows
      .map(fromPrismaMoldUsageRecord)
      .filter((record) => (!input.orgId || (record.orgId ?? null) === input.orgId))
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
    const saved = await this.client().moldLifeCounter.upsert({
      where: { productionMoldId: record.productionMoldId },
      create: toPrismaMoldLifeCounter(record),
      update: toPrismaMoldLifeCounter(record)
    })
    return fromPrismaMoldLifeCounter(saved)
  }

  async findMoldLifeCounterById(tenantId: string, moldLifeCounterId: string): Promise<MoldLifeCounterRecord | null> {
    const row = await this.client().moldLifeCounter.findFirst({ where: { id: moldLifeCounterId, tenantId } })
    return row ? fromPrismaMoldLifeCounter(row) : null
  }

  async findMoldLifeCounterByProductionMold(tenantId: string, productionMoldId: string): Promise<MoldLifeCounterRecord | null> {
    const row = await this.client().moldLifeCounter.findFirst({ where: { tenantId, productionMoldId } })
    return row ? fromPrismaMoldLifeCounter(row) : null
  }

  async listMoldLifeCounters(input: ListMoldLifeCountersInput): Promise<MoldLifeCounterPageResult> {
    const rows = await this.client().moldLifeCounter.findMany({
      where: {
        tenantId: input.tenantId,
        ...(input.orgId ? { orgId: input.orgId } : {}),
        ...(input.productionMoldId ? { productionMoldId: input.productionMoldId } : {})
      },
      orderBy: { updatedAt: 'desc' }
    })
    const filtered = rows.map(fromPrismaMoldLifeCounter).filter((counter) => {
      return !input.warningLevel || deriveWarningLevel(counter) === input.warningLevel
    })
    const page = paginate(filtered, input.page, input.pageSize)
    return { counters: page.items, total: page.total, page: page.page, pageSize: page.pageSize }
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

  /** toProductionMoldSummary enriches mold projections with design and counter summaries. */
  private async toProductionMoldSummary(record: ProductionMoldRecord): Promise<ProductionMoldSummaryRecord> {
    const design = await this.findMoldDesignById(record.tenantId, record.moldDesignId)
    const counter = await this.findMoldLifeCounterByProductionMold(record.tenantId, record.productionMoldId)
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
      currentStatus: record.currentStatus,
      currentPlacementSummary: await this.getToolingCurrentPlacement(record.tenantId, ToolingType.MOLD, record.productionMoldId),
      lifeCounterSummary: counter ? toMoldLifeCounterSummary(counter) : record.lifeCounterSummary ?? null
    }
  }

  /** toMasterMoldSummary enriches one master mold with design and placement summaries. */
  private async toMasterMoldSummary(record: MasterMoldRecord) {
    const design = await this.findMoldDesignById(record.tenantId, record.moldDesignId)
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

  /** client returns the ambient Prisma transaction client when one is active. */
  private client(): PrismaExecutionClient {
    return this.prisma.getExecutionClient()
  }
}

type MoldDesignWithOutputs = Prisma.MoldDesignGetPayload<{ include: { outputs: true } }>
type ToolingInstallationWithDetail = Prisma.ToolingInstallationGetPayload<{ include: { moldDetail: true } }>

/** toPrismaMoldDesign maps one MoldDesign record into Prisma create/update data. */
function toPrismaMoldDesign(record: MoldDesignRecord): Prisma.MoldDesignUncheckedCreateInput {
  return {
    id: record.moldDesignId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    orgScope: orgScope(record.orgId),
    designCode: record.designCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    supersedesMoldDesignId: record.supersedesMoldDesignId ?? null,
    primaryItemModelRef: toJson(record.primaryItemModelRef),
    productionSpecRefs: toJson(record.productionSpecRefs),
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

/** toPrismaMoldDesignOutput maps one design output row into Prisma create data. */
function toPrismaMoldDesignOutput(record: MoldDesignOutputRecord): Prisma.MoldDesignOutputCreateManyInput {
  return {
    id: record.moldDesignOutputId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    moldDesignId: record.moldDesignId,
    sequenceNo: record.sequenceNo,
    outputCode: record.outputCode,
    outputKind: record.outputKind,
    productionSpecRef: nullableJson(record.productionSpecRef),
    itemModelRef: nullableJson(record.itemModelRef),
    quantityPerUse: record.quantityPerUse,
    componentRole: record.componentRole ?? null,
    assemblyHint: record.assemblyHint ?? null,
    isPrimaryOutput: record.isPrimaryOutput,
    options: toJson(record.options)
  }
}

/** fromPrismaMoldDesign maps one Prisma design row into the domain record. */
function fromPrismaMoldDesign(row: MoldDesignWithOutputs): MoldDesignRecord {
  return {
    moldDesignId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    designCode: row.designCode,
    name: row.name,
    revisionCode: row.revisionCode,
    supersedesMoldDesignId: row.supersedesMoldDesignId,
    primaryItemModelRef: fromJson<MoldDesignRecord['primaryItemModelRef']>(row.primaryItemModelRef),
    productionSpecRefs: fromJson<MoldDesignRecord['productionSpecRefs']>(row.productionSpecRefs),
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
      productionSpecRef: fromNullableJson<MoldDesignOutputRecord['productionSpecRef']>(output.productionSpecRef),
      itemModelRef: fromNullableJson<MoldDesignOutputRecord['itemModelRef']>(output.itemModelRef),
      quantityPerUse: output.quantityPerUse,
      componentRole: output.componentRole,
      assemblyHint: output.assemblyHint,
      isPrimaryOutput: output.isPrimaryOutput,
      options: fromJson<MoldDesignOutputRecord['options']>(output.options)
    })),
    defaultLifeLimit: row.defaultLifeLimit,
    defaultLifeUnit: row.defaultLifeUnit,
    status: row.status as MoldDesignRecord['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
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

/** toPrismaMasterMold maps one MasterMold record into Prisma create/update data. */
function toPrismaMasterMold(record: MasterMoldRecord): Prisma.MasterMoldUncheckedCreateInput {
  return {
    id: record.masterMoldId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    orgScope: orgScope(record.orgId),
    masterMoldCode: record.masterMoldCode,
    moldDesignId: record.moldDesignId,
    supplierRef: nullableJson(record.supplierRef),
    purchaseRef: nullableJson(record.purchaseRef),
    receivedAt: record.receivedAt ?? null,
    currentStatus: record.currentStatus,
    currentStorageResourceRef: nullableJson(record.currentStorageResourceRef),
    currentCarrierResourceRef: nullableJson(record.currentCarrierResourceRef),
    qualitySummary: record.qualitySummary ?? null,
    notes: record.notes ?? null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  }
}

/** fromPrismaMasterMold maps one Prisma master mold row into the domain record. */
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
    currentStatus: row.currentStatus as MasterMoldStatus,
    currentStorageResourceRef: fromNullableJson<MasterMoldRecord['currentStorageResourceRef']>(row.currentStorageResourceRef),
    currentCarrierResourceRef: fromNullableJson<MasterMoldRecord['currentCarrierResourceRef']>(row.currentCarrierResourceRef),
    qualitySummary: row.qualitySummary,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

/** toPrismaProductionMold maps one ProductionMold record into Prisma create/update data. */
function toPrismaProductionMold(record: ProductionMoldRecord): Prisma.ProductionMoldUncheckedCreateInput {
  return {
    id: record.productionMoldId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    orgScope: orgScope(record.orgId),
    moldCode: record.moldCode,
    moldDesignId: record.moldDesignId,
    sourceMasterMoldId: record.sourceMasterMoldId ?? null,
    supplierRef: nullableJson(record.supplierRef),
    purchaseRef: nullableJson(record.purchaseRef),
    receivedAt: record.receivedAt ?? null,
    acceptedAt: record.acceptedAt ?? null,
    currentStatus: record.currentStatus,
    currentStorageResourceRef: nullableJson(record.currentStorageResourceRef),
    currentCarrierResourceRef: nullableJson(record.currentCarrierResourceRef),
    currentInstallationSummary: nullableJson(record.currentInstallationSummary),
    lifeCounterSummary: nullableJson(record.lifeCounterSummary),
    scrappedAt: record.scrappedAt ?? null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  }
}

/** fromPrismaProductionMold maps one Prisma production mold row into the domain record. */
function fromPrismaProductionMold(row: Prisma.ProductionMoldGetPayload<object>): ProductionMoldRecord {
  return {
    productionMoldId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    moldCode: row.moldCode,
    moldDesignId: row.moldDesignId,
    sourceMasterMoldId: row.sourceMasterMoldId,
    supplierRef: fromNullableJson<ProductionMoldRecord['supplierRef']>(row.supplierRef),
    purchaseRef: fromNullableJson<ProductionMoldRecord['purchaseRef']>(row.purchaseRef),
    receivedAt: row.receivedAt,
    acceptedAt: row.acceptedAt,
    currentStatus: row.currentStatus as ProductionMoldStatus,
    currentStorageResourceRef: fromNullableJson<ProductionMoldRecord['currentStorageResourceRef']>(row.currentStorageResourceRef),
    currentCarrierResourceRef: fromNullableJson<ProductionMoldRecord['currentCarrierResourceRef']>(row.currentCarrierResourceRef),
    currentInstallationSummary: fromNullableJson<ProductionMoldRecord['currentInstallationSummary']>(row.currentInstallationSummary),
    lifeCounterSummary: fromNullableJson<ProductionMoldRecord['lifeCounterSummary']>(row.lifeCounterSummary),
    scrappedAt: row.scrappedAt,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

/** toPrismaMoldMovement maps one movement fact into Prisma create data. */
function toPrismaMoldMovement(record: MoldMovementRecord): Prisma.MoldMovementUncheckedCreateInput {
  return {
    id: record.moldMovementId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    toolingType: record.toolingType,
    toolingId: record.toolingId,
    fromStorageResourceRef: nullableJson(record.fromStorageResourceRef),
    fromCarrierResourceRef: nullableJson(record.fromCarrierResourceRef),
    toStorageResourceRef: nullableJson(record.toStorageResourceRef),
    toCarrierResourceRef: nullableJson(record.toCarrierResourceRef),
    movementReason: record.movementReason ?? null,
    movedAt: new Date(record.movedAt),
    operatorRef: toJson(record.operatorRef),
    auditRef: toJson(record.auditRef)
  }
}

/** fromPrismaMoldMovement maps one Prisma movement row into the domain fact. */
function fromPrismaMoldMovement(row: Prisma.MoldMovementGetPayload<object>): MoldMovementRecord {
  return {
    moldMovementId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    toolingType: row.toolingType as ToolingType,
    toolingId: row.toolingId,
    fromStorageResourceRef: fromNullableJson<MoldMovementRecord['fromStorageResourceRef']>(row.fromStorageResourceRef),
    fromCarrierResourceRef: fromNullableJson<MoldMovementRecord['fromCarrierResourceRef']>(row.fromCarrierResourceRef),
    toStorageResourceRef: fromNullableJson<MoldMovementRecord['toStorageResourceRef']>(row.toStorageResourceRef),
    toCarrierResourceRef: fromNullableJson<MoldMovementRecord['toCarrierResourceRef']>(row.toCarrierResourceRef),
    movementReason: row.movementReason,
    movedAt: row.movedAt.toISOString(),
    operatorRef: fromJson<MoldMovementRecord['operatorRef']>(row.operatorRef),
    auditRef: fromJson<MoldMovementRecord['auditRef']>(row.auditRef)
  }
}

/** toPrismaToolingInstallation maps one installation interval into Prisma data. */
function toPrismaToolingInstallation(record: ToolingInstallationRecord): Prisma.ToolingInstallationUncheckedCreateInput {
  return {
    id: record.toolingInstallationId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    toolingType: record.toolingType,
    toolingId: record.toolingId,
    workCenterRef: toJson(record.workCenterRef),
    workUnitRef: nullableJson(record.workUnitRef),
    installedAt: new Date(record.installedAt),
    unmountedAt: record.unmountedAt ? new Date(record.unmountedAt) : null,
    installedByRef: nullableJson(record.installedByRef),
    unmountedByRef: nullableJson(record.unmountedByRef),
    status: record.status,
    auditRef: toJson(record.auditRef)
  }
}

/** toPrismaMoldInstallationDetail maps mold-specific installation detail into Prisma data. */
function toPrismaMoldInstallationDetail(record: NonNullable<ToolingInstallationRecord['moldDetail']>): Prisma.MoldInstallationDetailUncheckedCreateInput {
  return {
    toolingInstallationId: record.toolingInstallationId,
    moldPosition: record.moldPosition ?? null,
    cavityPosition: record.cavityPosition ?? null,
    cavityMapping: record.cavityMapping ?? null,
    setupParameters: record.setupParameters ?? null
  }
}

/** fromPrismaToolingInstallation maps one Prisma installation row into the domain interval fact. */
function fromPrismaToolingInstallation(row: ToolingInstallationWithDetail): ToolingInstallationRecord {
  return {
    toolingInstallationId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    toolingType: row.toolingType as ToolingType,
    toolingId: row.toolingId,
    workCenterRef: fromJson<ToolingInstallationRecord['workCenterRef']>(row.workCenterRef),
    workUnitRef: fromNullableJson<ToolingInstallationRecord['workUnitRef']>(row.workUnitRef),
    installedAt: row.installedAt.toISOString(),
    unmountedAt: row.unmountedAt?.toISOString() ?? null,
    installedByRef: fromNullableJson<ToolingInstallationRecord['installedByRef']>(row.installedByRef),
    unmountedByRef: fromNullableJson<ToolingInstallationRecord['unmountedByRef']>(row.unmountedByRef),
    status: row.status as ToolingInstallationStatus,
    moldDetail: row.moldDetail
      ? {
          toolingInstallationId: row.moldDetail.toolingInstallationId,
          moldPosition: row.moldDetail.moldPosition,
          cavityPosition: row.moldDetail.cavityPosition,
          cavityMapping: row.moldDetail.cavityMapping,
          setupParameters: row.moldDetail.setupParameters
        }
      : null,
    auditRef: fromJson<ToolingInstallationRecord['auditRef']>(row.auditRef)
  }
}

/** toPrismaMoldUsageRecord maps one usage fact into Prisma create data. */
function toPrismaMoldUsageRecord(record: MoldUsageRecord): Prisma.MoldUsageRecordUncheckedCreateInput {
  return {
    id: record.moldUsageRecordId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    productionMoldId: record.productionMoldId,
    toolingInstallationId: record.toolingInstallationId ?? null,
    workCenterRef: toJson(record.workCenterRef),
    workUnitRef: nullableJson(record.workUnitRef),
    usedAt: new Date(record.usedAt),
    usageQuantity: record.usageQuantity,
    lifeDelta: record.lifeDelta,
    lifeUnit: record.lifeUnit,
    productionSpecRef: nullableJson(record.productionSpecRef),
    productionUnitRef: nullableJson(record.productionUnitRef),
    traceSubjectRef: nullableJson(record.traceSubjectRef),
    operatorRef: toJson(record.operatorRef),
    captureSource: record.captureSource ?? null,
    auditRef: toJson(record.auditRef),
    moldDesignOutputId: record.moldDesignOutputId ?? null,
    moldDesignOutputOptionId: record.moldDesignOutputOptionId ?? null
  }
}

/** fromPrismaMoldUsageRecord maps one Prisma usage row into the domain fact. */
function fromPrismaMoldUsageRecord(row: Prisma.MoldUsageRecordGetPayload<object>): MoldUsageRecord {
  return {
    moldUsageRecordId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    productionMoldId: row.productionMoldId,
    toolingInstallationId: row.toolingInstallationId,
    workCenterRef: fromJson<MoldUsageRecord['workCenterRef']>(row.workCenterRef),
    workUnitRef: fromNullableJson<MoldUsageRecord['workUnitRef']>(row.workUnitRef),
    usedAt: row.usedAt.toISOString(),
    usageQuantity: row.usageQuantity,
    lifeDelta: row.lifeDelta,
    lifeUnit: row.lifeUnit,
    productionSpecRef: fromNullableJson<MoldUsageRecord['productionSpecRef']>(row.productionSpecRef),
    productionUnitRef: fromNullableJson<MoldUsageRecord['productionUnitRef']>(row.productionUnitRef),
    traceSubjectRef: fromNullableJson<MoldUsageRecord['traceSubjectRef']>(row.traceSubjectRef),
    operatorRef: fromJson<MoldUsageRecord['operatorRef']>(row.operatorRef),
    captureSource: row.captureSource,
    auditRef: fromJson<MoldUsageRecord['auditRef']>(row.auditRef),
    moldDesignOutputId: row.moldDesignOutputId,
    moldDesignOutputOptionId: row.moldDesignOutputOptionId
  }
}

/** toPrismaMoldLifeCounter maps one life counter into Prisma create/update data. */
function toPrismaMoldLifeCounter(record: MoldLifeCounterRecord): Prisma.MoldLifeCounterUncheckedCreateInput {
  return {
    id: record.moldLifeCounterId,
    tenantId: record.tenantId,
    orgId: record.orgId ?? null,
    productionMoldId: record.productionMoldId,
    lifeUnit: record.lifeUnit,
    usedValue: record.usedValue,
    limitValue: record.limitValue ?? null,
    warningThresholdValue: record.warningThresholdValue ?? null,
    lastUsageRecordId: record.lastUsageRecordId ?? null,
    lastAdjustedAt: record.lastAdjustedAt ? new Date(record.lastAdjustedAt) : null,
    lastAdjustedByRef: nullableJson(record.lastAdjustedByRef),
    adjustmentReason: record.adjustmentReason ?? null,
    updatedAt: new Date(record.updatedAt)
  }
}

/** fromPrismaMoldLifeCounter maps one Prisma counter row into the domain record. */
function fromPrismaMoldLifeCounter(row: Prisma.MoldLifeCounterGetPayload<object>): MoldLifeCounterRecord {
  return {
    moldLifeCounterId: row.id,
    tenantId: row.tenantId,
    orgId: row.orgId,
    productionMoldId: row.productionMoldId,
    lifeUnit: row.lifeUnit,
    usedValue: row.usedValue,
    limitValue: row.limitValue,
    warningThresholdValue: row.warningThresholdValue,
    lastUsageRecordId: row.lastUsageRecordId,
    lastAdjustedAt: row.lastAdjustedAt?.toISOString() ?? null,
    lastAdjustedByRef: fromNullableJson<MoldLifeCounterRecord['lastAdjustedByRef']>(row.lastAdjustedByRef),
    adjustmentReason: row.adjustmentReason,
    updatedAt: row.updatedAt.toISOString()
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

/** paginate slices an already ordered in-memory result set into a contract page. */
function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
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
