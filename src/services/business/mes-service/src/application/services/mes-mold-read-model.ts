import {
  CurrentInstalledMoldView,
  DailyMoldChecklistRecord,
  MesLocationRecord,
  MesLocationSummaryRecord,
  MoldCurrentLocationView,
  MoldDerivedUsageState,
  MoldDesignRecord,
  MoldDesignSummaryRecord,
  MoldInstallationRecord,
  MoldInstallationSummaryRecord,
  MoldLifeCounterRecord,
  MoldLifeSummaryRecord,
  MoldLifeWarningView,
  MoldResourceType,
  MoldUsageHistoryEntryRecord,
  MoldUsageHistoryEntryType,
  MoldWarningEventRecord,
  MoldWarningLevel,
  MoldWarningSummaryRecord,
  MoldWarningType,
  PageResult,
  ProductionMoldInstanceRecord,
  ProductionMoldInstanceView,
  ResourcePositionRecord,
  ResourcePositionSummaryRecord,
  WorkCenterRecord,
  WorkCenterSummaryRecord
} from '../../domain/models/mes-mold-records'
import { MesMoldRepository } from '../../domain/repositories/mes-mold.repository'
import { assertExists, normalizePageInput, paginate } from '../support/mes-assertions'

/** MesMoldReadModel builds query projections from MES-owned truth and append-only mold facts. */
export class MesMoldReadModel {
  constructor(private readonly repository: MesMoldRepository) {}

  /** buildProductionMoldInstanceView composes current projections, installation, location, life, and warning summaries. */
  async buildProductionMoldInstanceView(record: ProductionMoldInstanceRecord): Promise<ProductionMoldInstanceView> {
    const design = assertExists(
      await this.repository.findMoldDesignById(record.tenantId, record.moldDesignId),
      'MoldDesign',
      record.moldDesignId
    )
    const master = record.masterMoldId
      ? await this.repository.findMasterMoldById(record.tenantId, record.masterMoldId)
      : null
    const location = record.currentMesLocationId
      ? await this.repository.findMesLocationById(record.tenantId, record.currentMesLocationId)
      : null
    const activeInstallation = await this.repository.findActiveInstallationByMold(
      record.tenantId,
      record.productionMoldInstanceId
    )
    const counter = await this.repository.findMoldLifeCounterByInstanceId(
      record.tenantId,
      record.productionMoldInstanceId
    )
    const warning = await this.repository.findCurrentWarningByMold(record.tenantId, record.productionMoldInstanceId)

    return {
      productionMoldInstanceId: record.productionMoldInstanceId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? null,
      moldInstanceCode: record.moldInstanceCode,
      moldDesignSummary: toMoldDesignSummary(design),
      masterMoldSummary: master
        ? {
            masterMoldId: master.masterMoldId,
            masterMoldCode: master.masterMoldCode,
            moldDesignId: master.moldDesignId,
            currentStatus: master.currentStatus
          }
        : null,
      supplierRef: record.supplierRef ?? null,
      purchaseRef: record.purchaseRef ?? null,
      receivedAt: record.receivedAt ?? null,
      acceptedAt: record.acceptedAt ?? null,
      currentStatus: record.currentStatus,
      currentMesLocationSummary: location ? toMesLocationSummary(location) : null,
      currentInstallationSummary: activeInstallation
        ? await this.buildInstallationSummary(record.tenantId, activeInstallation)
        : null,
      lifeSummary: counter ? toLifeSummary(counter, warning) : null,
      warningSummary: warning ? toWarningSummary(warning) : null,
      scrappedAt: record.scrappedAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  /** buildCurrentLocation returns location and installation summary for master or production mold resources. */
  async buildCurrentLocation(input: {
    tenantId: string
    moldResourceType: MoldResourceType
    moldResourceId: string
  }): Promise<MoldCurrentLocationView> {
    const lastMovement = await this.repository.findLastMovementEvent(
      input.tenantId,
      input.moldResourceType,
      input.moldResourceId
    )

    if (input.moldResourceType === MoldResourceType.MASTER_MOLD) {
      const master = assertExists(
        await this.repository.findMasterMoldById(input.tenantId, input.moldResourceId),
        'MasterMold',
        input.moldResourceId
      )
      const location = master.currentMesLocationId
        ? await this.repository.findMesLocationById(input.tenantId, master.currentMesLocationId)
        : null
      return {
        moldResourceType: MoldResourceType.MASTER_MOLD,
        moldResourceId: master.masterMoldId,
        moldCode: master.masterMoldCode,
        currentStatus: master.currentStatus,
        currentMesLocationSummary: location ? toMesLocationSummary(location) : null,
        currentInstallationSummary: null,
        lastMovementEventId: lastMovement?.moldMovementEventId ?? null,
        lastMovedAt: lastMovement?.movedAt ?? null
      }
    }

    const instance = assertExists(
      await this.repository.findProductionMoldInstanceById(input.tenantId, input.moldResourceId),
      'ProductionMoldInstance',
      input.moldResourceId
    )
    const view = await this.buildProductionMoldInstanceView(instance)
    return {
      moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
      moldResourceId: instance.productionMoldInstanceId,
      moldCode: instance.moldInstanceCode,
      currentStatus: instance.currentStatus,
      currentMesLocationSummary: view.currentMesLocationSummary ?? null,
      currentInstallationSummary: view.currentInstallationSummary ?? null,
      lastMovementEventId: lastMovement?.moldMovementEventId ?? null,
      lastMovedAt: lastMovement?.movedAt ?? null
    }
  }

  /** buildCurrentInstalledMold composes one active installation row for work-center queries and checklists. */
  async buildCurrentInstalledMold(installation: MoldInstallationRecord): Promise<CurrentInstalledMoldView> {
    const instance = assertExists(
      await this.repository.findProductionMoldInstanceById(
        installation.tenantId,
        installation.productionMoldInstanceId
      ),
      'ProductionMoldInstance',
      installation.productionMoldInstanceId
    )
    const position = await this.repository.findResourcePositionById(installation.tenantId, installation.resourcePositionId)
    const view = await this.buildProductionMoldInstanceView(instance)
    return {
      productionMoldInstance: view,
      moldInstallation: installation,
      resourcePositionSummary: position ? toResourcePositionSummary(position) : null,
      lifeSummary: view.lifeSummary ?? null,
      warningSummary: view.warningSummary ?? null
    }
  }

  /** buildWarningView composes one warning row with its production mold summary. */
  async buildWarningView(warning: MoldWarningEventRecord): Promise<MoldLifeWarningView> {
    const instance = assertExists(
      await this.repository.findProductionMoldInstanceById(
        warning.tenantId,
        warning.productionMoldInstanceId
      ),
      'ProductionMoldInstance',
      warning.productionMoldInstanceId
    )
    const design = assertExists(
      await this.repository.findMoldDesignById(instance.tenantId, instance.moldDesignId),
      'MoldDesign',
      instance.moldDesignId
    )
    return {
      ...warning,
      productionMoldInstanceSummary: {
        productionMoldInstanceId: instance.productionMoldInstanceId,
        moldInstanceCode: instance.moldInstanceCode,
        moldDesignSummary: toMoldDesignSummary(design),
        currentStatus: instance.currentStatus
      }
    }
  }

  /** buildUsageHistory returns a chronological page across movement, installation, usage, and warning facts. */
  async buildUsageHistory(input: {
    tenantId: string
    productionMoldInstanceId: string
    entryTypes?: MoldUsageHistoryEntryType[]
    occurredFrom?: string
    occurredTo?: string
    page?: number
    pageSize?: number
  }): Promise<PageResult<MoldUsageHistoryEntryRecord>> {
    const page = normalizePageInput(input.page, input.pageSize)
    const instance = assertExists(
      await this.repository.findProductionMoldInstanceById(input.tenantId, input.productionMoldInstanceId),
      'ProductionMoldInstance',
      input.productionMoldInstanceId
    )
    const movements = await this.repository.listMovementEventsByResource(
      input.tenantId,
      MoldResourceType.PRODUCTION_MOLD_INSTANCE,
      instance.productionMoldInstanceId
    )
    const installations = await this.repository.listInstallationsByMold(input.tenantId, instance.productionMoldInstanceId)
    const usages = await this.repository.listUsageEventsByMold(input.tenantId, instance.productionMoldInstanceId)
    const warnings = await this.repository.listWarningsByMold(input.tenantId, instance.productionMoldInstanceId)

    const entries: MoldUsageHistoryEntryRecord[] = []
    for (const movement of movements) {
      const location = await this.repository.findMesLocationById(input.tenantId, movement.toMesLocationId)
      entries.push({
        entryType: MoldUsageHistoryEntryType.MOVE,
        entryId: movement.moldMovementEventId,
        occurredAt: movement.movedAt,
        mesLocationSummary: location ? toMesLocationSummary(location) : null,
        operatorRef: movement.operatorRef,
        auditRef: movement.auditRef
      })
    }

    for (const installation of installations) {
      const workCenter = await this.repository.findWorkCenterById(input.tenantId, installation.workCenterId)
      const position = await this.repository.findResourcePositionById(input.tenantId, installation.resourcePositionId)
      entries.push({
        entryType: MoldUsageHistoryEntryType.INSTALLATION,
        entryId: installation.moldInstallationId,
        occurredAt: installation.installedAt,
        workCenterSummary: workCenter ? toWorkCenterSummary(workCenter) : null,
        resourcePositionSummary: position ? toResourcePositionSummary(position) : null,
        operatorRef: installation.installedByRef,
        auditRef: installation.auditRef
      })
      if (installation.unmountedAt) {
        entries.push({
          entryType: MoldUsageHistoryEntryType.UNMOUNT,
          entryId: installation.moldInstallationId,
          occurredAt: installation.unmountedAt,
          workCenterSummary: workCenter ? toWorkCenterSummary(workCenter) : null,
          resourcePositionSummary: position ? toResourcePositionSummary(position) : null,
          operatorRef: installation.unmountedByRef ?? null,
          auditRef: installation.auditRef
        })
      }
    }

    for (const usage of usages) {
      const workCenter = await this.repository.findWorkCenterById(input.tenantId, usage.workCenterId)
      const position = usage.resourcePositionId
        ? await this.repository.findResourcePositionById(input.tenantId, usage.resourcePositionId)
        : null
      entries.push({
        entryType: MoldUsageHistoryEntryType.USAGE,
        entryId: usage.moldUsageEventId,
        occurredAt: usage.usedAt,
        workCenterSummary: workCenter ? toWorkCenterSummary(workCenter) : null,
        resourcePositionSummary: position ? toResourcePositionSummary(position) : null,
        usageQuantity: usage.usageQuantity,
        lifeDelta: usage.lifeDelta,
        lifeUsedValueAfter: usage.lifeUsedValueAfter,
        productFamilyRef: usage.productFamilyRef ?? null,
        manufacturingSpecRef: usage.manufacturingSpecRef ?? null,
        moldDesignOutputId: usage.moldDesignOutputId ?? null,
        moldDesignOutputOptionId: usage.moldDesignOutputOptionId ?? null,
        wipUnitRef: usage.wipUnitRef ?? null,
        physicalTraceId: usage.physicalTraceId ?? null,
        operatorRef: usage.operatorRef,
        auditRef: usage.auditRef
      })
    }

    for (const warning of warnings) {
      entries.push({
        entryType: MoldUsageHistoryEntryType.WARNING,
        entryId: warning.moldWarningEventId,
        occurredAt: warning.raisedAt,
        lifeUsedValueAfter: warning.lifeUsedValue,
        operatorRef: warning.acknowledgedByRef ?? null,
        auditRef: warning.auditRef
      })
    }

    const filtered = entries
      .filter((entry) => !input.entryTypes?.length || input.entryTypes.includes(entry.entryType))
      .filter((entry) => !input.occurredFrom || entry.occurredAt >= input.occurredFrom)
      .filter((entry) => !input.occurredTo || entry.occurredAt <= input.occurredTo)
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))

    return paginate(filtered, page.page, page.pageSize)
  }

  /** buildDailyChecklist returns the printable read model for selected work centers. */
  async buildDailyChecklist(input: {
    tenantId: string
    workCenterIds: string[]
    checklistDate: string
    includeWarnings?: boolean
    includeRecentUsage?: boolean
    generatedBy: string
  }): Promise<DailyMoldChecklistRecord> {
    const workCenters = []
    for (const workCenterId of input.workCenterIds) {
      const workCenter = assertExists(
        await this.repository.findWorkCenterById(input.tenantId, workCenterId),
        'WorkCenter',
        workCenterId
      )
      const installations = await this.repository.listActiveInstallationsByWorkCenter(input.tenantId, workCenterId)
      const installedMolds = []
      const warnings = []
      const recentUsageSummary = []
      for (const installation of installations) {
        const installed = await this.buildCurrentInstalledMold(installation)
        installedMolds.push(installed)
        if (input.includeWarnings && installed.warningSummary) {
          const warning = await this.repository.findMoldWarningEventById(
            input.tenantId,
            installed.warningSummary.moldWarningEventId
          )
          if (warning) {
            warnings.push(await this.buildWarningView(warning))
          }
        }
        if (input.includeRecentUsage) {
          const lastUsage = await this.repository.findLastUsageEventByMold(
            input.tenantId,
            installation.productionMoldInstanceId
          )
          if (lastUsage) {
            recentUsageSummary.push({
              moldUsageEventId: lastUsage.moldUsageEventId,
              productionMoldInstanceId: lastUsage.productionMoldInstanceId,
              moldInstanceCode: installed.productionMoldInstance.moldInstanceCode,
              usedAt: lastUsage.usedAt,
              usageQuantity: lastUsage.usageQuantity,
              lifeDelta: lastUsage.lifeDelta,
              lifeUnit: lastUsage.lifeUnit
            })
          }
        }
      }
      workCenters.push({
        workCenterSummary: toWorkCenterSummary(workCenter),
        installedMolds,
        lifeWarnings: warnings,
        recentUsageSummary,
        exceptionNotes: installedMolds.length === 0 ? ['NO_ACTIVE_MOLD_INSTALLATION'] : []
      })
    }

    return {
      checklistDate: input.checklistDate,
      workCenters,
      generatedAt: new Date().toISOString(),
      generatedByRef: {
        operatorId: input.generatedBy
      }
    }
  }

  /** buildInstallationSummary composes an installation summary and query-derived usage state. */
  private async buildInstallationSummary(
    tenantId: string,
    installation: MoldInstallationRecord
  ): Promise<MoldInstallationSummaryRecord> {
    const workCenter = await this.repository.findWorkCenterById(tenantId, installation.workCenterId)
    const position = await this.repository.findResourcePositionById(tenantId, installation.resourcePositionId)
    const lastUsage = await this.repository.findLastUsageEventByMold(tenantId, installation.productionMoldInstanceId)
    return {
      moldInstallationId: installation.moldInstallationId,
      workCenterId: installation.workCenterId,
      workCenterCode: workCenter?.workCenterCode ?? null,
      workCenterName: workCenter?.name ?? null,
      resourcePositionId: installation.resourcePositionId,
      positionCode: position?.positionCode ?? null,
      installedAt: installation.installedAt,
      usageState:
        lastUsage && lastUsage.usedAt >= installation.installedAt
          ? MoldDerivedUsageState.IN_USE_WINDOW
          : MoldDerivedUsageState.IDLE
    }
  }
}

/** toMoldDesignSummary converts one design record into the compact query summary. */
export function toMoldDesignSummary(record: MoldDesignRecord): MoldDesignSummaryRecord {
  return {
    moldDesignId: record.moldDesignId,
    designCode: record.designCode,
    name: record.name,
    revisionCode: record.revisionCode ?? null,
    productFamilyRef: record.productFamilyRef
  }
}

/** toMesLocationSummary converts one MES location into the generated summary-compatible shape. */
export function toMesLocationSummary(record: MesLocationRecord): MesLocationSummaryRecord {
  return {
    mesLocationId: record.mesLocationId,
    locationCode: record.locationCode,
    name: record.name,
    locationType: record.locationType,
    parentMesLocationId: record.parentMesLocationId ?? null,
    relatedWorkCenterId: record.relatedWorkCenterId ?? null,
    capacityProfileId: record.capacityProfileId ?? null,
    status: record.status
  }
}

/** toWorkCenterSummary converts one work center into the generated summary-compatible shape. */
export function toWorkCenterSummary(record: WorkCenterRecord): WorkCenterSummaryRecord {
  return {
    workCenterId: record.workCenterId,
    workCenterCode: record.workCenterCode,
    name: record.name,
    workCenterType: record.workCenterType,
    parentWorkCenterId: record.parentWorkCenterId ?? null,
    relatedMesLocationId: record.relatedMesLocationId ?? null,
    capacityProfileId: record.capacityProfileId ?? null,
    status: record.status
  }
}

/** toResourcePositionSummary converts one resource position into the generated summary-compatible shape. */
export function toResourcePositionSummary(record: ResourcePositionRecord): ResourcePositionSummaryRecord {
  return {
    resourcePositionId: record.resourcePositionId,
    workCenterId: record.workCenterId,
    positionCode: record.positionCode,
    name: record.name,
    positionType: record.positionType,
    status: record.status
  }
}

/** toLifeSummary converts the counter projection into the public query summary. */
function toLifeSummary(
  counter: MoldLifeCounterRecord,
  warning: MoldWarningEventRecord | null
): MoldLifeSummaryRecord {
  const remaining = Number(counter.limitValue) - Number(counter.usedValue)
  return {
    lifeUnit: counter.lifeUnit,
    usedValue: counter.usedValue,
    limitValue: counter.limitValue,
    warningThresholdValue: counter.warningThresholdValue,
    remainingValue: remaining.toString(),
    warningLevel: warning?.warningLevel ?? inferWarningLevel(counter),
    lastUsageEventId: counter.lastUsageEventId ?? null,
    lastAdjustedAt: counter.lastAdjustedAt ?? null
  }
}

/** toWarningSummary converts the current open warning into the instance embedded summary. */
function toWarningSummary(record: MoldWarningEventRecord): MoldWarningSummaryRecord {
  return {
    moldWarningEventId: record.moldWarningEventId,
    warningType: record.warningType,
    warningLevel: record.warningLevel,
    status: record.status,
    raisedAt: record.raisedAt,
    acknowledgedAt: record.acknowledgedAt ?? null
  }
}

/** inferWarningLevel derives a summary level when no open warning exists. */
function inferWarningLevel(counter: MoldLifeCounterRecord): MoldWarningLevel {
  if (Number(counter.usedValue) >= Number(counter.limitValue)) {
    return MoldWarningLevel.CRITICAL
  }
  if (Number(counter.usedValue) >= Number(counter.warningThresholdValue)) {
    return MoldWarningLevel.WARNING
  }
  return MoldWarningLevel.INFO
}
