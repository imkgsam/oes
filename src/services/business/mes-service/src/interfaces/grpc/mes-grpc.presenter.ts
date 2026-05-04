import {
  AcknowledgeMoldWarningResponse,
  AdjustMoldLifeResponse,
  CurrentInstalledMold,
  DailyMoldChecklist,
  DailyMoldChecklistWorkCenter,
  GetMoldCurrentLocationResponse,
  GetMoldDesignResponse,
  GetMoldUsageHistoryResponse,
  GetProductionMoldInstanceResponse,
  ListCurrentMoldsByWorkCenterResponse,
  ListMoldDesignsResponse,
  ListMoldInstancesByDesignResponse,
  ListMoldLifeWarningsResponse,
  MasterMold,
  MoldCurrentLocation,
  MoldDerivedUsageState as ProtoMoldDerivedUsageState,
  MoldDesign,
  MoldDesignOutput,
  MoldDesignOutputKind as ProtoMoldDesignOutputKind,
  MoldDesignStatus as ProtoMoldDesignStatus,
  MoldDesignSummary,
  MoldFunctionRole as ProtoMoldFunctionRole,
  MoldInstallation,
  MoldInstallationStatus as ProtoMoldInstallationStatus,
  MoldLifeAdjustmentType as ProtoMoldLifeAdjustmentType,
  MoldLifeCounter,
  MoldLifeSummary,
  MoldLifeWarning,
  MoldMovementEvent,
  MoldOutputStructureType as ProtoMoldOutputStructureType,
  MoldRecentUsageSummary,
  MoldResourceSummary,
  MoldResourceType as ProtoMoldResourceType,
  MoldUsageEvent,
  MoldUsageHistoryEntry,
  MoldUsageHistoryEntryType as ProtoMoldUsageHistoryEntryType,
  MoldUsageMode as ProtoMoldUsageMode,
  MoldWarningAcknowledgementAction as ProtoMoldWarningAcknowledgementAction,
  MoldWarningEvent,
  MoldWarningLevel as ProtoMoldWarningLevel,
  MoldWarningStatus as ProtoMoldWarningStatus,
  MoldWarningSummary,
  MoldWarningType as ProtoMoldWarningType,
  PrintDailyMoldChecklistResponse,
  ProductionMoldInstance,
  ProductionMoldInstanceStatus as ProtoProductionMoldInstanceStatus,
  ProductionMoldInstanceSummary,
  RecordMoldUsageResponse,
  RegisterMasterMoldResponse,
  RegisterMoldDesignResponse,
  RegisterProductionMoldInstanceResponse,
  ScrapMoldResponse,
  UnmountMoldResponse,
  InstallMoldResponse,
  MoveMoldResponse,
  ManufacturingMasterDataRefType as ProtoManufacturingMasterDataRefType,
  ManufacturingMasterDataRef,
  MesLocationSummary,
  WorkCenterSummary,
  ResourcePositionSummary
} from '@oes/common/generated/mes_service'
import {
  CurrentInstalledMoldView,
  DailyMoldChecklistRecord,
  ExternalRefRecord,
  ManufacturingMasterDataRefRecord,
  MasterMoldRecord,
  MesLocationSummaryRecord,
  MoldCurrentLocationView,
  MoldDerivedUsageState,
  MoldDesignOutputKind,
  MoldDesignRecord,
  MoldDesignStatus,
  MoldDesignSummaryRecord,
  MoldFunctionRole,
  MoldInstallationRecord,
  MoldInstallationStatus,
  MoldLifeCounterRecord,
  MoldLifeAdjustmentType,
  MoldLifeSummaryRecord,
  MoldLifeWarningView,
  MoldMovementEventRecord,
  MoldOutputStructureType,
  MoldResourceType,
  MoldUsageEventRecord,
  MoldUsageHistoryEntryRecord,
  MoldUsageHistoryEntryType,
  MoldUsageMode,
  MoldWarningAcknowledgementAction,
  MoldWarningEventRecord,
  MoldWarningLevel,
  MoldWarningStatus,
  MoldWarningSummaryRecord,
  MoldWarningType,
  PageResult,
  ProductionMoldInstanceStatus,
  ProductionMoldInstanceView,
  ResourcePositionSummaryRecord,
  WorkCenterSummaryRecord
} from '../../domain/models/mes-mold-records'

/** MesGrpcPresenter translates MES mold domain records into the generated gRPC response surface. */
export class MesGrpcPresenter {
  /** toRegisterMoldDesignResponse presents one newly created mold design. */
  static toRegisterMoldDesignResponse(record: MoldDesignRecord): RegisterMoldDesignResponse {
    return { moldDesign: this.toMoldDesign(record) }
  }

  /** toRegisterMasterMoldResponse presents one newly created master mold. */
  static toRegisterMasterMoldResponse(record: MasterMoldRecord): RegisterMasterMoldResponse {
    return { masterMold: this.toMasterMold(record) }
  }

  /** toRegisterProductionMoldInstanceResponse presents one production mold and its initial life counter. */
  static toRegisterProductionMoldInstanceResponse(input: {
    productionMoldInstance: ProductionMoldInstanceView
    moldLifeCounter: MoldLifeCounterRecord
  }): RegisterProductionMoldInstanceResponse {
    return {
      productionMoldInstance: this.toProductionMoldInstance(input.productionMoldInstance),
      moldLifeCounter: this.toMoldLifeCounter(input.moldLifeCounter)
    }
  }

  /** toMoveMoldResponse presents one movement fact plus the current location read model. */
  static toMoveMoldResponse(input: {
    movementEvent: MoldMovementEventRecord
    moldCurrentLocation: MoldCurrentLocationView
  }): MoveMoldResponse {
    return {
      movementEvent: this.toMoldMovementEvent(input.movementEvent),
      moldCurrentLocation: this.toMoldCurrentLocation(input.moldCurrentLocation)
    }
  }

  /** toInstallMoldResponse presents one new installation and the updated production mold projection. */
  static toInstallMoldResponse(input: {
    moldInstallation: MoldInstallationRecord
    productionMoldInstance: ProductionMoldInstanceView
  }): InstallMoldResponse {
    return {
      moldInstallation: this.toMoldInstallation(input.moldInstallation),
      productionMoldInstance: this.toProductionMoldInstance(input.productionMoldInstance)
    }
  }

  /** toUnmountMoldResponse presents one closed installation and the updated production mold projection. */
  static toUnmountMoldResponse(input: {
    moldInstallation: MoldInstallationRecord
    productionMoldInstance: ProductionMoldInstanceView
  }): UnmountMoldResponse {
    return this.toInstallMoldResponse(input)
  }

  /** toRecordMoldUsageResponse presents usage, counter, and optional warning facts. */
  static toRecordMoldUsageResponse(input: {
    usageEvent: MoldUsageEventRecord
    moldLifeCounter: MoldLifeCounterRecord
    raisedWarning: MoldWarningEventRecord | null
  }): RecordMoldUsageResponse {
    return {
      usageEvent: this.toMoldUsageEvent(input.usageEvent),
      moldLifeCounter: this.toMoldLifeCounter(input.moldLifeCounter),
      raisedWarning: input.raisedWarning ? this.toMoldWarningEvent(input.raisedWarning) : undefined
    }
  }

  /** toAdjustMoldLifeResponse presents a corrected counter and optional warning. */
  static toAdjustMoldLifeResponse(input: {
    moldLifeCounter: MoldLifeCounterRecord
    raisedWarning: MoldWarningEventRecord | null
  }): AdjustMoldLifeResponse {
    return {
      moldLifeCounter: this.toMoldLifeCounter(input.moldLifeCounter),
      raisedWarning: input.raisedWarning ? this.toMoldWarningEvent(input.raisedWarning) : undefined
    }
  }

  /** toAcknowledgeMoldWarningResponse presents an acknowledged warning and affected instance. */
  static toAcknowledgeMoldWarningResponse(input: {
    moldWarningEvent: MoldWarningEventRecord
    productionMoldInstance: ProductionMoldInstanceView
  }): AcknowledgeMoldWarningResponse {
    return {
      moldWarningEvent: this.toMoldWarningEvent(input.moldWarningEvent),
      productionMoldInstance: this.toProductionMoldInstance(input.productionMoldInstance)
    }
  }

  /** toScrapMoldResponse presents the terminal mold resource and optional closed installation fact. */
  static toScrapMoldResponse(input: {
    moldResource: {
      moldResourceType: MoldResourceType
      moldResourceId: string
      moldCode: string
      currentStatus: string
      scrappedAt?: string | null
    }
    closedInstallation?: MoldInstallationRecord | null
  }): ScrapMoldResponse {
    return {
      moldResource: {
        moldResourceType: toProtoMoldResourceType(input.moldResource.moldResourceType),
        moldResourceId: input.moldResource.moldResourceId,
        moldCode: input.moldResource.moldCode,
        currentStatus: input.moldResource.currentStatus,
        scrappedAt: input.moldResource.scrappedAt ?? undefined
      } satisfies MoldResourceSummary,
      closedInstallation: input.closedInstallation ? this.toMoldInstallation(input.closedInstallation) : undefined
    }
  }

  /** toGetMoldDesignResponse presents one mold design query result. */
  static toGetMoldDesignResponse(record: MoldDesignRecord): GetMoldDesignResponse {
    return { moldDesign: this.toMoldDesign(record) }
  }

  /** toListMoldDesignsResponse presents one design page. */
  static toListMoldDesignsResponse(input: PageResult<MoldDesignRecord>): ListMoldDesignsResponse {
    return {
      moldDesigns: input.items.map((record) => this.toMoldDesign(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetProductionMoldInstanceResponse presents one production mold query result. */
  static toGetProductionMoldInstanceResponse(record: ProductionMoldInstanceView): GetProductionMoldInstanceResponse {
    return { productionMoldInstance: this.toProductionMoldInstance(record) }
  }

  /** toListMoldInstancesByDesignResponse presents one production mold page grouped by design. */
  static toListMoldInstancesByDesignResponse(
    input: PageResult<ProductionMoldInstanceView> & { moldDesignSummary: MoldDesignSummaryRecord }
  ): ListMoldInstancesByDesignResponse {
    return {
      moldDesignSummary: this.toMoldDesignSummary(input.moldDesignSummary),
      instances: input.items.map((record) => this.toProductionMoldInstance(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetMoldCurrentLocationResponse presents current physical location and installation summary. */
  static toGetMoldCurrentLocationResponse(record: MoldCurrentLocationView): GetMoldCurrentLocationResponse {
    return { currentLocation: this.toMoldCurrentLocation(record) }
  }

  /** toGetMoldUsageHistoryResponse presents one mold history page. */
  static toGetMoldUsageHistoryResponse(
    input: PageResult<MoldUsageHistoryEntryRecord> & { productionMoldInstanceSummary: ProductionMoldInstanceView }
  ): GetMoldUsageHistoryResponse {
    return {
      productionMoldInstanceSummary: this.toProductionMoldInstanceSummary(input.productionMoldInstanceSummary),
      entries: input.items.map((record) => this.toMoldUsageHistoryEntry(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toListCurrentMoldsByWorkCenterResponse presents active installations for one work center. */
  static toListCurrentMoldsByWorkCenterResponse(
    input: PageResult<CurrentInstalledMoldView> & { workCenterSummary: WorkCenterSummaryRecord }
  ): ListCurrentMoldsByWorkCenterResponse {
    return {
      workCenterSummary: this.toWorkCenterSummary(input.workCenterSummary),
      installedMolds: input.items.map((record) => this.toCurrentInstalledMold(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toListMoldLifeWarningsResponse presents one warning page. */
  static toListMoldLifeWarningsResponse(input: PageResult<MoldLifeWarningView>): ListMoldLifeWarningsResponse {
    return {
      warnings: input.items.map((record) => this.toMoldLifeWarning(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toPrintDailyMoldChecklistResponse presents the printable checklist read model. */
  static toPrintDailyMoldChecklistResponse(record: DailyMoldChecklistRecord): PrintDailyMoldChecklistResponse {
    return {
      checklist: {
        checklistDate: record.checklistDate,
        workCenters: record.workCenters.map((workCenter): DailyMoldChecklistWorkCenter => ({
          workCenterSummary: this.toWorkCenterSummary(workCenter.workCenterSummary),
          installedMolds: workCenter.installedMolds.map((installed) => this.toCurrentInstalledMold(installed)),
          lifeWarnings: workCenter.lifeWarnings.map((warning) => this.toMoldLifeWarning(warning)),
          recentUsageSummary: workCenter.recentUsageSummary.map((usage): MoldRecentUsageSummary => ({
            moldUsageEventId: usage.moldUsageEventId,
            productionMoldInstanceId: usage.productionMoldInstanceId,
            moldInstanceCode: usage.moldInstanceCode,
            usedAt: usage.usedAt,
            usageQuantity: usage.usageQuantity,
            lifeDelta: usage.lifeDelta,
            lifeUnit: usage.lifeUnit
          })),
          exceptionNotes: workCenter.exceptionNotes
        })),
        generatedAt: record.generatedAt,
        generatedByRef: {
          operatorId: record.generatedByRef.operatorId,
          displayNameSnapshot: record.generatedByRef.displayNameSnapshot ?? undefined
        }
      } satisfies DailyMoldChecklist
    }
  }

  /** toMoldDesign converts one mold design record into the generated gRPC read shape. */
  static toMoldDesign(record: MoldDesignRecord): MoldDesign {
    return {
      moldDesignId: record.moldDesignId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      designCode: record.designCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      supersedesDesignId: record.supersedesDesignId ?? undefined,
      productFamilyRef: this.toManufacturingMasterDataRef(record.productFamilyRef),
      manufacturingSpecRefs: record.manufacturingSpecRefs.map((ref) => this.toManufacturingMasterDataRef(ref)),
      itemRef: record.itemRef ?? undefined,
      materialType: record.materialType,
      functionRole: toProtoMoldFunctionRole(record.functionRole),
      productionMethodTags: record.productionMethodTags,
      outputStructureType: toProtoMoldOutputStructureType(record.outputStructureType),
      outputs: record.outputs.map((output) => this.toMoldDesignOutput(output)),
      defaultLifeLimit: record.defaultLifeLimit ?? undefined,
      defaultLifeUnit: record.defaultLifeUnit ?? undefined,
      status: toProtoMoldDesignStatus(record.status),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  /** toMoldDesignOutput converts one design output row into the generated shape. */
  static toMoldDesignOutput(record: MoldDesignRecord['outputs'][number]): MoldDesignOutput {
    return {
      moldDesignOutputId: record.moldDesignOutputId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      moldDesignId: record.moldDesignId,
      sequenceNo: record.sequenceNo,
      outputCode: record.outputCode,
      outputKind: toProtoMoldDesignOutputKind(record.outputKind),
      productFamilyRef: record.productFamilyRef ? this.toManufacturingMasterDataRef(record.productFamilyRef) : undefined,
      manufacturingSpecRef: record.manufacturingSpecRef
        ? this.toManufacturingMasterDataRef(record.manufacturingSpecRef)
        : undefined,
      quantityPerUse: record.quantityPerUse,
      componentRole: record.componentRole ?? undefined,
      assemblyHint: record.assemblyHint ?? undefined,
      isPrimaryOutput: record.isPrimaryOutput
    }
  }

  /** toMasterMold converts one master mold into the generated command response shape. */
  static toMasterMold(record: MasterMoldRecord): MasterMold {
    return {
      masterMoldId: record.masterMoldId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      masterMoldCode: record.masterMoldCode,
      moldDesignId: record.moldDesignId,
      supplierRef: record.supplierRef ?? undefined,
      purchaseRef: record.purchaseRef ? { ...record.purchaseRef, purchaseSourceType: 4 } : undefined,
      receivedAt: record.receivedAt ?? undefined,
      currentStatus: record.currentStatus,
      currentMesLocationId: record.currentMesLocationId ?? undefined,
      qualitySummary: record.qualitySummary ?? undefined,
      notes: record.notes ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  /** toProductionMoldInstance converts one production mold view into the generated query shape. */
  static toProductionMoldInstance(record: ProductionMoldInstanceView): ProductionMoldInstance {
    return {
      productionMoldInstanceId: record.productionMoldInstanceId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      moldInstanceCode: record.moldInstanceCode,
      moldDesignSummary: this.toMoldDesignSummary(record.moldDesignSummary),
      masterMoldSummary: record.masterMoldSummary ?? undefined,
      supplierRef: record.supplierRef ?? undefined,
      purchaseRef: record.purchaseRef ? { ...record.purchaseRef, purchaseSourceType: 4 } : undefined,
      receivedAt: record.receivedAt ?? undefined,
      acceptedAt: record.acceptedAt ?? undefined,
      currentStatus: toProtoProductionMoldInstanceStatus(record.currentStatus),
      currentMesLocationSummary: record.currentMesLocationSummary
        ? this.toMesLocationSummary(record.currentMesLocationSummary)
        : undefined,
      currentInstallationSummary: record.currentInstallationSummary
        ? {
            moldInstallationId: record.currentInstallationSummary.moldInstallationId,
            workCenterId: record.currentInstallationSummary.workCenterId,
            workCenterCode: record.currentInstallationSummary.workCenterCode ?? undefined,
            workCenterName: record.currentInstallationSummary.workCenterName ?? undefined,
            resourcePositionId: record.currentInstallationSummary.resourcePositionId,
            positionCode: record.currentInstallationSummary.positionCode ?? undefined,
            installedAt: record.currentInstallationSummary.installedAt,
            usageState: toProtoMoldDerivedUsageState(record.currentInstallationSummary.usageState)
          }
        : undefined,
      lifeSummary: record.lifeSummary ? this.toMoldLifeSummary(record.lifeSummary) : undefined,
      warningSummary: record.warningSummary ? this.toMoldWarningSummary(record.warningSummary) : undefined,
      scrappedAt: record.scrappedAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  /** toProductionMoldInstanceSummary converts one production mold view into a compact summary. */
  static toProductionMoldInstanceSummary(record: ProductionMoldInstanceView): ProductionMoldInstanceSummary {
    return {
      productionMoldInstanceId: record.productionMoldInstanceId,
      moldInstanceCode: record.moldInstanceCode,
      moldDesignSummary: this.toMoldDesignSummary(record.moldDesignSummary),
      currentStatus: toProtoProductionMoldInstanceStatus(record.currentStatus),
      currentMesLocationSummary: record.currentMesLocationSummary
        ? this.toMesLocationSummary(record.currentMesLocationSummary)
        : undefined,
      currentInstallationSummary: record.currentInstallationSummary
        ? {
            moldInstallationId: record.currentInstallationSummary.moldInstallationId,
            workCenterId: record.currentInstallationSummary.workCenterId,
            workCenterCode: record.currentInstallationSummary.workCenterCode ?? undefined,
            workCenterName: record.currentInstallationSummary.workCenterName ?? undefined,
            resourcePositionId: record.currentInstallationSummary.resourcePositionId,
            positionCode: record.currentInstallationSummary.positionCode ?? undefined,
            installedAt: record.currentInstallationSummary.installedAt,
            usageState: toProtoMoldDerivedUsageState(record.currentInstallationSummary.usageState)
          }
        : undefined,
      lifeSummary: record.lifeSummary ? this.toMoldLifeSummary(record.lifeSummary) : undefined,
      warningSummary: record.warningSummary ? this.toMoldWarningSummary(record.warningSummary) : undefined
    }
  }

  /** toMoldDesignSummary converts one design summary into generated shape. */
  static toMoldDesignSummary(record: MoldDesignSummaryRecord): MoldDesignSummary {
    return {
      moldDesignId: record.moldDesignId,
      designCode: record.designCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      productFamilyRef: record.productFamilyRef ? this.toManufacturingMasterDataRef(record.productFamilyRef) : undefined
    }
  }

  /** toMoldLifeCounter converts the current counter projection into generated shape. */
  static toMoldLifeCounter(record: MoldLifeCounterRecord): MoldLifeCounter {
    return {
      moldLifeCounterId: record.moldLifeCounterId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      productionMoldInstanceId: record.productionMoldInstanceId,
      lifeUnit: record.lifeUnit,
      usedValue: record.usedValue,
      limitValue: record.limitValue,
      warningThresholdValue: record.warningThresholdValue,
      lastUsageEventId: record.lastUsageEventId ?? undefined,
      lastAdjustedAt: record.lastAdjustedAt ?? undefined,
      lastAdjustedByRef: record.lastAdjustedByRef ?? undefined,
      adjustmentReason: record.adjustmentReason ?? undefined,
      updatedAt: record.updatedAt
    }
  }

  /** toMoldLifeSummary converts one life summary into generated shape. */
  static toMoldLifeSummary(record: MoldLifeSummaryRecord): MoldLifeSummary {
    return {
      lifeUnit: record.lifeUnit,
      usedValue: record.usedValue,
      limitValue: record.limitValue,
      warningThresholdValue: record.warningThresholdValue,
      remainingValue: record.remainingValue,
      warningLevel: toProtoMoldWarningLevel(record.warningLevel),
      lastUsageEventId: record.lastUsageEventId ?? undefined,
      lastAdjustedAt: record.lastAdjustedAt ?? undefined
    }
  }

  /** toMoldWarningSummary converts one warning summary into generated shape. */
  static toMoldWarningSummary(record: MoldWarningSummaryRecord): MoldWarningSummary {
    return {
      moldWarningEventId: record.moldWarningEventId,
      warningType: toProtoMoldWarningType(record.warningType),
      warningLevel: toProtoMoldWarningLevel(record.warningLevel),
      status: toProtoMoldWarningStatus(record.status),
      raisedAt: record.raisedAt,
      acknowledgedAt: record.acknowledgedAt ?? undefined
    }
  }

  /** toMoldCurrentLocation converts the current location view into generated shape. */
  static toMoldCurrentLocation(record: MoldCurrentLocationView): MoldCurrentLocation {
    return {
      moldResourceType: toProtoMoldResourceType(record.moldResourceType),
      moldResourceId: record.moldResourceId,
      moldCode: record.moldCode,
      currentStatus: record.currentStatus,
      currentMesLocationSummary: record.currentMesLocationSummary
        ? this.toMesLocationSummary(record.currentMesLocationSummary)
        : undefined,
      currentInstallationSummary: record.currentInstallationSummary
        ? {
            moldInstallationId: record.currentInstallationSummary.moldInstallationId,
            workCenterId: record.currentInstallationSummary.workCenterId,
            workCenterCode: record.currentInstallationSummary.workCenterCode ?? undefined,
            workCenterName: record.currentInstallationSummary.workCenterName ?? undefined,
            resourcePositionId: record.currentInstallationSummary.resourcePositionId,
            positionCode: record.currentInstallationSummary.positionCode ?? undefined,
            installedAt: record.currentInstallationSummary.installedAt,
            usageState: toProtoMoldDerivedUsageState(record.currentInstallationSummary.usageState)
          }
        : undefined,
      lastMovementEventId: record.lastMovementEventId ?? undefined,
      lastMovedAt: record.lastMovedAt ?? undefined
    }
  }

  /** toMoldMovementEvent converts one movement fact into generated shape. */
  static toMoldMovementEvent(record: MoldMovementEventRecord): MoldMovementEvent {
    return {
      moldMovementEventId: record.moldMovementEventId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      moldResourceType: toProtoMoldResourceType(record.moldResourceType),
      moldResourceId: record.moldResourceId,
      fromMesLocationId: record.fromMesLocationId ?? undefined,
      toMesLocationId: record.toMesLocationId,
      movementReason: record.movementReason,
      movedAt: record.movedAt,
      operatorRef: record.operatorRef,
      sourceCommandId: record.sourceCommandId,
      auditRef: record.auditRef
    }
  }

  /** toMoldInstallation converts one installation fact into generated shape. */
  static toMoldInstallation(record: MoldInstallationRecord): MoldInstallation {
    return {
      moldInstallationId: record.moldInstallationId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      productionMoldInstanceId: record.productionMoldInstanceId,
      workCenterId: record.workCenterId,
      resourcePositionId: record.resourcePositionId,
      installedAt: record.installedAt,
      unmountedAt: record.unmountedAt ?? undefined,
      installedByRef: record.installedByRef,
      unmountedByRef: record.unmountedByRef ?? undefined,
      installationStatus: toProtoMoldInstallationStatus(record.installationStatus),
      setupSnapshot: record.setupSnapshot ?? undefined,
      operationRef: record.operationRef ?? undefined,
      routingRef: record.routingRef ?? undefined,
      workOrderRef: record.workOrderRef ?? undefined,
      operationTaskRef: record.operationTaskRef ?? undefined,
      auditRef: record.auditRef
    }
  }

  /** toMoldUsageEvent converts one usage fact into generated shape. */
  static toMoldUsageEvent(record: MoldUsageEventRecord): MoldUsageEvent {
    return {
      moldUsageEventId: record.moldUsageEventId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      productionMoldInstanceId: record.productionMoldInstanceId,
      moldInstallationId: record.moldInstallationId,
      workCenterId: record.workCenterId,
      resourcePositionId: record.resourcePositionId ?? undefined,
      usageMode: toProtoMoldUsageMode(record.usageMode),
      usedAt: record.usedAt,
      usageQuantity: record.usageQuantity,
      lifeDelta: record.lifeDelta,
      lifeUnit: record.lifeUnit,
      productFamilyRef: record.productFamilyRef ? this.toManufacturingMasterDataRef(record.productFamilyRef) : undefined,
      manufacturingSpecRef: record.manufacturingSpecRef
        ? this.toManufacturingMasterDataRef(record.manufacturingSpecRef)
        : undefined,
      wipUnitRef: record.wipUnitRef ?? undefined,
      physicalTraceId: record.physicalTraceId ?? undefined,
      workOrderRef: record.workOrderRef ?? undefined,
      operationTaskRef: record.operationTaskRef ?? undefined,
      operatorRef: record.operatorRef,
      captureSource: record.captureSource,
      auditRef: record.auditRef
    }
  }

  /** toMoldWarningEvent converts one warning fact into generated shape. */
  static toMoldWarningEvent(record: MoldWarningEventRecord): MoldWarningEvent {
    return {
      moldWarningEventId: record.moldWarningEventId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      productionMoldInstanceId: record.productionMoldInstanceId,
      warningType: toProtoMoldWarningType(record.warningType),
      warningLevel: toProtoMoldWarningLevel(record.warningLevel),
      triggeredByEventId: record.triggeredByEventId ?? undefined,
      lifeUsedValue: record.lifeUsedValue,
      lifeLimitValue: record.lifeLimitValue,
      raisedAt: record.raisedAt,
      acknowledgedAt: record.acknowledgedAt ?? undefined,
      acknowledgedByRef: record.acknowledgedByRef ?? undefined,
      status: toProtoMoldWarningStatus(record.status),
      auditRef: record.auditRef
    }
  }

  /** toMoldUsageHistoryEntry converts one flattened history row into generated shape. */
  static toMoldUsageHistoryEntry(record: MoldUsageHistoryEntryRecord): MoldUsageHistoryEntry {
    return {
      entryType: toProtoMoldUsageHistoryEntryType(record.entryType),
      entryId: record.entryId,
      occurredAt: record.occurredAt,
      workCenterSummary: record.workCenterSummary ? this.toWorkCenterSummary(record.workCenterSummary) : undefined,
      resourcePositionSummary: record.resourcePositionSummary
        ? this.toResourcePositionSummary(record.resourcePositionSummary)
        : undefined,
      mesLocationSummary: record.mesLocationSummary ? this.toMesLocationSummary(record.mesLocationSummary) : undefined,
      usageQuantity: record.usageQuantity ?? undefined,
      lifeDelta: record.lifeDelta ?? undefined,
      lifeUsedValueAfter: record.lifeUsedValueAfter ?? undefined,
      productFamilyRef: record.productFamilyRef ? this.toManufacturingMasterDataRef(record.productFamilyRef) : undefined,
      manufacturingSpecRef: record.manufacturingSpecRef
        ? this.toManufacturingMasterDataRef(record.manufacturingSpecRef)
        : undefined,
      wipUnitRef: record.wipUnitRef ?? undefined,
      physicalTraceId: record.physicalTraceId ?? undefined,
      operatorRef: record.operatorRef ?? undefined,
      auditRef: record.auditRef ?? undefined
    }
  }

  /** toCurrentInstalledMold converts one active installation row into generated shape. */
  static toCurrentInstalledMold(record: CurrentInstalledMoldView): CurrentInstalledMold {
    return {
      productionMoldInstance: this.toProductionMoldInstance(record.productionMoldInstance),
      moldInstallation: this.toMoldInstallation(record.moldInstallation),
      resourcePositionSummary: record.resourcePositionSummary
        ? this.toResourcePositionSummary(record.resourcePositionSummary)
        : undefined,
      lifeSummary: record.lifeSummary ? this.toMoldLifeSummary(record.lifeSummary) : undefined,
      warningSummary: record.warningSummary ? this.toMoldWarningSummary(record.warningSummary) : undefined
    }
  }

  /** toMoldLifeWarning converts one warning view into generated shape. */
  static toMoldLifeWarning(record: MoldLifeWarningView): MoldLifeWarning {
    return {
      moldWarningEventId: record.moldWarningEventId,
      productionMoldInstanceSummary: {
        productionMoldInstanceId: record.productionMoldInstanceSummary.productionMoldInstanceId,
        moldInstanceCode: record.productionMoldInstanceSummary.moldInstanceCode,
        moldDesignSummary: this.toMoldDesignSummary(record.productionMoldInstanceSummary.moldDesignSummary),
        currentStatus: toProtoProductionMoldInstanceStatus(record.productionMoldInstanceSummary.currentStatus)
      },
      warningType: toProtoMoldWarningType(record.warningType),
      warningLevel: toProtoMoldWarningLevel(record.warningLevel),
      lifeUsedValue: record.lifeUsedValue,
      lifeLimitValue: record.lifeLimitValue,
      raisedAt: record.raisedAt,
      acknowledgedAt: record.acknowledgedAt ?? undefined,
      acknowledgedByRef: record.acknowledgedByRef ?? undefined,
      status: toProtoMoldWarningStatus(record.status)
    }
  }

  /** toMesLocationSummary converts one MES physical location summary into generated shape. */
  static toMesLocationSummary(record: MesLocationSummaryRecord): MesLocationSummary {
    return {
      mesLocationId: record.mesLocationId,
      locationCode: record.locationCode,
      name: record.name,
      locationType: record.locationType,
      parentMesLocationId: record.parentMesLocationId ?? undefined,
      relatedWorkCenterId: record.relatedWorkCenterId ?? undefined,
      capacityProfileId: record.capacityProfileId ?? undefined,
      status: record.status
    }
  }

  /** toWorkCenterSummary converts one work center summary into generated shape. */
  static toWorkCenterSummary(record: WorkCenterSummaryRecord): WorkCenterSummary {
    return {
      workCenterId: record.workCenterId,
      workCenterCode: record.workCenterCode,
      name: record.name,
      workCenterType: record.workCenterType,
      parentWorkCenterId: record.parentWorkCenterId ?? undefined,
      relatedMesLocationId: record.relatedMesLocationId ?? undefined,
      capacityProfileId: record.capacityProfileId ?? undefined,
      status: record.status
    }
  }

  /** toResourcePositionSummary converts one resource position summary into generated shape. */
  static toResourcePositionSummary(record: ResourcePositionSummaryRecord): ResourcePositionSummary {
    return {
      resourcePositionId: record.resourcePositionId,
      workCenterId: record.workCenterId,
      positionCode: record.positionCode,
      name: record.name,
      positionType: record.positionType,
      status: record.status
    }
  }

  /** toManufacturingMasterDataRef converts one opaque reference into generated shape. */
  static toManufacturingMasterDataRef(record: ManufacturingMasterDataRefRecord): ManufacturingMasterDataRef {
    return {
      refType:
        record.refType === 'MANUFACTURING_SPEC'
          ? ProtoManufacturingMasterDataRefType.MANUFACTURING_MASTER_DATA_REF_TYPE_MANUFACTURING_SPEC
          : ProtoManufacturingMasterDataRefType.MANUFACTURING_MASTER_DATA_REF_TYPE_PRODUCT_FAMILY,
      refId: record.refId,
      refCodeSnapshot: record.refCodeSnapshot ?? undefined,
      displayNameSnapshot: record.displayNameSnapshot ?? undefined
    }
  }
}

export function toDomainMoldFunctionRole(value?: ProtoMoldFunctionRole): MoldFunctionRole {
  return value === ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_MASTER ? MoldFunctionRole.MASTER : MoldFunctionRole.PRODUCTION
}

export function toDomainMoldOutputStructureType(value?: ProtoMoldOutputStructureType): MoldOutputStructureType {
  switch (value) {
    case ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_TWIN:
      return MoldOutputStructureType.TWIN
    case ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_MULTI:
      return MoldOutputStructureType.MULTI
    case ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_COMPONENT_COMBINATION:
      return MoldOutputStructureType.COMPONENT_COMBINATION
    default:
      return MoldOutputStructureType.SINGLE
  }
}

export function toDomainMoldDesignOutputKind(value?: ProtoMoldDesignOutputKind): MoldDesignOutputKind {
  switch (value) {
    case ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_COMPONENT:
      return MoldDesignOutputKind.COMPONENT
    case ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_MANUFACTURING_SPEC:
      return MoldDesignOutputKind.MANUFACTURING_SPEC
    default:
      return MoldDesignOutputKind.PRODUCT
  }
}

export function toDomainProductionMoldInstanceStatus(
  value?: ProtoProductionMoldInstanceStatus
): ProductionMoldInstanceStatus | undefined {
  switch (value) {
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_RECEIVED:
      return ProductionMoldInstanceStatus.RECEIVED
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_DRYING:
      return ProductionMoldInstanceStatus.PENDING_DRYING
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_INSTALLATION:
      return ProductionMoldInstanceStatus.PENDING_INSTALLATION
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_INSTALLED:
      return ProductionMoldInstanceStatus.INSTALLED
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_REPAIR:
      return ProductionMoldInstanceStatus.PENDING_REPAIR
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_UNDER_REPAIR:
      return ProductionMoldInstanceStatus.UNDER_REPAIR
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_DISABLED:
      return ProductionMoldInstanceStatus.DISABLED
    case ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_SCRAPPED:
      return ProductionMoldInstanceStatus.SCRAPPED
    default:
      return undefined
  }
}

export function toDomainMoldResourceType(value?: ProtoMoldResourceType): MoldResourceType {
  return value === ProtoMoldResourceType.MOLD_RESOURCE_TYPE_MASTER_MOLD
    ? MoldResourceType.MASTER_MOLD
    : MoldResourceType.PRODUCTION_MOLD_INSTANCE
}

export function toDomainMoldUsageMode(value?: ProtoMoldUsageMode): MoldUsageMode {
  switch (value) {
    case ProtoMoldUsageMode.MOLD_USAGE_MODE_PDA_SCAN:
      return MoldUsageMode.PDA_SCAN
    case ProtoMoldUsageMode.MOLD_USAGE_MODE_BATCH_CONFIRM:
      return MoldUsageMode.BATCH_CONFIRM
    case ProtoMoldUsageMode.MOLD_USAGE_MODE_BACK_OFFICE_ENTRY:
      return MoldUsageMode.BACK_OFFICE_ENTRY
    case ProtoMoldUsageMode.MOLD_USAGE_MODE_AUTOMATED_CAPTURE:
      return MoldUsageMode.AUTOMATED_CAPTURE
    default:
      return MoldUsageMode.MANUAL_CHECKLIST
  }
}

export function toDomainMoldLifeAdjustmentType(value?: ProtoMoldLifeAdjustmentType): MoldLifeAdjustmentType {
  switch (value) {
    case ProtoMoldLifeAdjustmentType.MOLD_LIFE_ADJUSTMENT_TYPE_ADD_USED_VALUE:
      return MoldLifeAdjustmentType.ADD_USED_VALUE
    case ProtoMoldLifeAdjustmentType.MOLD_LIFE_ADJUSTMENT_TYPE_SET_LIMIT_VALUE:
      return MoldLifeAdjustmentType.SET_LIMIT_VALUE
    case ProtoMoldLifeAdjustmentType.MOLD_LIFE_ADJUSTMENT_TYPE_SET_WARNING_THRESHOLD:
      return MoldLifeAdjustmentType.SET_WARNING_THRESHOLD
    default:
      return MoldLifeAdjustmentType.SET_USED_VALUE
  }
}

export function toDomainMoldWarningAcknowledgementAction(
  value?: ProtoMoldWarningAcknowledgementAction
): MoldWarningAcknowledgementAction {
  switch (value) {
    case ProtoMoldWarningAcknowledgementAction.MOLD_WARNING_ACKNOWLEDGEMENT_ACTION_ACKNOWLEDGE_AND_MARK_REPAIR:
      return MoldWarningAcknowledgementAction.ACKNOWLEDGE_AND_MARK_REPAIR
    case ProtoMoldWarningAcknowledgementAction.MOLD_WARNING_ACKNOWLEDGEMENT_ACTION_ACKNOWLEDGE_AND_DISABLE:
      return MoldWarningAcknowledgementAction.ACKNOWLEDGE_AND_DISABLE
    default:
      return MoldWarningAcknowledgementAction.ACKNOWLEDGE
  }
}

export function toDomainMoldWarningStatus(value?: ProtoMoldWarningStatus): MoldWarningStatus | undefined {
  switch (value) {
    case ProtoMoldWarningStatus.MOLD_WARNING_STATUS_OPEN:
      return MoldWarningStatus.OPEN
    case ProtoMoldWarningStatus.MOLD_WARNING_STATUS_ACKNOWLEDGED:
      return MoldWarningStatus.ACKNOWLEDGED
    case ProtoMoldWarningStatus.MOLD_WARNING_STATUS_CLOSED:
      return MoldWarningStatus.CLOSED
    default:
      return undefined
  }
}

export function toDomainMoldWarningType(value?: ProtoMoldWarningType): MoldWarningType | undefined {
  switch (value) {
    case ProtoMoldWarningType.MOLD_WARNING_TYPE_LIFE_THRESHOLD:
      return MoldWarningType.LIFE_THRESHOLD
    case ProtoMoldWarningType.MOLD_WARNING_TYPE_LIFE_EXCEEDED:
      return MoldWarningType.LIFE_EXCEEDED
    case ProtoMoldWarningType.MOLD_WARNING_TYPE_STATUS_EXCEPTION:
      return MoldWarningType.STATUS_EXCEPTION
    default:
      return undefined
  }
}

export function toDomainMoldWarningLevel(value?: ProtoMoldWarningLevel): MoldWarningLevel | undefined {
  switch (value) {
    case ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_INFO:
      return MoldWarningLevel.INFO
    case ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_WARNING:
      return MoldWarningLevel.WARNING
    case ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_CRITICAL:
      return MoldWarningLevel.CRITICAL
    default:
      return undefined
  }
}

export function toDomainMoldUsageHistoryEntryType(value: ProtoMoldUsageHistoryEntryType): MoldUsageHistoryEntryType {
  switch (value) {
    case ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_INSTALLATION:
      return MoldUsageHistoryEntryType.INSTALLATION
    case ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_UNMOUNT:
      return MoldUsageHistoryEntryType.UNMOUNT
    case ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_USAGE:
      return MoldUsageHistoryEntryType.USAGE
    case ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_LIFE_ADJUSTMENT:
      return MoldUsageHistoryEntryType.LIFE_ADJUSTMENT
    case ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_WARNING:
      return MoldUsageHistoryEntryType.WARNING
    case ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_MOVE:
      return MoldUsageHistoryEntryType.MOVE
    case ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_SCRAP:
      return MoldUsageHistoryEntryType.SCRAP
    default:
      return MoldUsageHistoryEntryType.USAGE
  }
}

export function toDomainManufacturingMasterDataRef(
  value: ManufacturingMasterDataRef | undefined,
  fallbackType: ManufacturingMasterDataRefRecord['refType']
): ManufacturingMasterDataRefRecord | undefined {
  if (!value?.refId) {
    return undefined
  }
  return {
    refType:
      value.refType === ProtoManufacturingMasterDataRefType.MANUFACTURING_MASTER_DATA_REF_TYPE_MANUFACTURING_SPEC
        ? 'MANUFACTURING_SPEC'
        : fallbackType,
    refId: value.refId,
    refCodeSnapshot: value.refCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}

function toProtoMoldFunctionRole(value: MoldFunctionRole): ProtoMoldFunctionRole {
  return value === MoldFunctionRole.MASTER
    ? ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_MASTER
    : ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_PRODUCTION
}

function toProtoMoldOutputStructureType(value: MoldOutputStructureType): ProtoMoldOutputStructureType {
  switch (value) {
    case MoldOutputStructureType.TWIN:
      return ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_TWIN
    case MoldOutputStructureType.MULTI:
      return ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_MULTI
    case MoldOutputStructureType.COMPONENT_COMBINATION:
      return ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_COMPONENT_COMBINATION
    default:
      return ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_SINGLE
  }
}

function toProtoMoldDesignOutputKind(value: MoldDesignOutputKind): ProtoMoldDesignOutputKind {
  switch (value) {
    case MoldDesignOutputKind.COMPONENT:
      return ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_COMPONENT
    case MoldDesignOutputKind.MANUFACTURING_SPEC:
      return ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_MANUFACTURING_SPEC
    default:
      return ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_PRODUCT
  }
}

function toProtoMoldDesignStatus(value: MoldDesignStatus): ProtoMoldDesignStatus {
  switch (value) {
    case MoldDesignStatus.INACTIVE:
      return ProtoMoldDesignStatus.MOLD_DESIGN_STATUS_INACTIVE
    case MoldDesignStatus.SUPERSEDED:
      return ProtoMoldDesignStatus.MOLD_DESIGN_STATUS_SUPERSEDED
    default:
      return ProtoMoldDesignStatus.MOLD_DESIGN_STATUS_ACTIVE
  }
}

function toProtoProductionMoldInstanceStatus(value: ProductionMoldInstanceStatus): ProtoProductionMoldInstanceStatus {
  switch (value) {
    case ProductionMoldInstanceStatus.RECEIVED:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_RECEIVED
    case ProductionMoldInstanceStatus.PENDING_DRYING:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_DRYING
    case ProductionMoldInstanceStatus.PENDING_INSTALLATION:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_INSTALLATION
    case ProductionMoldInstanceStatus.INSTALLED:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_INSTALLED
    case ProductionMoldInstanceStatus.PENDING_REPAIR:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_REPAIR
    case ProductionMoldInstanceStatus.UNDER_REPAIR:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_UNDER_REPAIR
    case ProductionMoldInstanceStatus.DISABLED:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_DISABLED
    case ProductionMoldInstanceStatus.SCRAPPED:
      return ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_SCRAPPED
  }
}

function toProtoMoldResourceType(value: MoldResourceType): ProtoMoldResourceType {
  return value === MoldResourceType.MASTER_MOLD
    ? ProtoMoldResourceType.MOLD_RESOURCE_TYPE_MASTER_MOLD
    : ProtoMoldResourceType.MOLD_RESOURCE_TYPE_PRODUCTION_MOLD_INSTANCE
}

function toProtoMoldInstallationStatus(value: MoldInstallationStatus): ProtoMoldInstallationStatus {
  switch (value) {
    case MoldInstallationStatus.UNMOUNTED:
      return ProtoMoldInstallationStatus.MOLD_INSTALLATION_STATUS_UNMOUNTED
    case MoldInstallationStatus.CLOSED_BY_SCRAP:
      return ProtoMoldInstallationStatus.MOLD_INSTALLATION_STATUS_CLOSED_BY_SCRAP
    default:
      return ProtoMoldInstallationStatus.MOLD_INSTALLATION_STATUS_ACTIVE
  }
}

function toProtoMoldUsageMode(value: MoldUsageMode): ProtoMoldUsageMode {
  switch (value) {
    case MoldUsageMode.PDA_SCAN:
      return ProtoMoldUsageMode.MOLD_USAGE_MODE_PDA_SCAN
    case MoldUsageMode.BATCH_CONFIRM:
      return ProtoMoldUsageMode.MOLD_USAGE_MODE_BATCH_CONFIRM
    case MoldUsageMode.BACK_OFFICE_ENTRY:
      return ProtoMoldUsageMode.MOLD_USAGE_MODE_BACK_OFFICE_ENTRY
    case MoldUsageMode.AUTOMATED_CAPTURE:
      return ProtoMoldUsageMode.MOLD_USAGE_MODE_AUTOMATED_CAPTURE
    default:
      return ProtoMoldUsageMode.MOLD_USAGE_MODE_MANUAL_CHECKLIST
  }
}

function toProtoMoldWarningType(value: MoldWarningType): ProtoMoldWarningType {
  switch (value) {
    case MoldWarningType.LIFE_EXCEEDED:
      return ProtoMoldWarningType.MOLD_WARNING_TYPE_LIFE_EXCEEDED
    case MoldWarningType.STATUS_EXCEPTION:
      return ProtoMoldWarningType.MOLD_WARNING_TYPE_STATUS_EXCEPTION
    default:
      return ProtoMoldWarningType.MOLD_WARNING_TYPE_LIFE_THRESHOLD
  }
}

function toProtoMoldWarningLevel(value: MoldWarningLevel): ProtoMoldWarningLevel {
  switch (value) {
    case MoldWarningLevel.CRITICAL:
      return ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_CRITICAL
    case MoldWarningLevel.WARNING:
      return ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_WARNING
    default:
      return ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_INFO
  }
}

function toProtoMoldWarningStatus(value: MoldWarningStatus): ProtoMoldWarningStatus {
  switch (value) {
    case MoldWarningStatus.ACKNOWLEDGED:
      return ProtoMoldWarningStatus.MOLD_WARNING_STATUS_ACKNOWLEDGED
    case MoldWarningStatus.CLOSED:
      return ProtoMoldWarningStatus.MOLD_WARNING_STATUS_CLOSED
    default:
      return ProtoMoldWarningStatus.MOLD_WARNING_STATUS_OPEN
  }
}

function toProtoMoldDerivedUsageState(value: MoldDerivedUsageState): ProtoMoldDerivedUsageState {
  switch (value) {
    case MoldDerivedUsageState.RECENTLY_USED:
      return ProtoMoldDerivedUsageState.MOLD_DERIVED_USAGE_STATE_RECENTLY_USED
    case MoldDerivedUsageState.IN_USE_WINDOW:
      return ProtoMoldDerivedUsageState.MOLD_DERIVED_USAGE_STATE_IN_USE_WINDOW
    default:
      return ProtoMoldDerivedUsageState.MOLD_DERIVED_USAGE_STATE_IDLE
  }
}

function toProtoMoldUsageHistoryEntryType(value: MoldUsageHistoryEntryType): ProtoMoldUsageHistoryEntryType {
  switch (value) {
    case MoldUsageHistoryEntryType.INSTALLATION:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_INSTALLATION
    case MoldUsageHistoryEntryType.UNMOUNT:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_UNMOUNT
    case MoldUsageHistoryEntryType.LIFE_ADJUSTMENT:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_LIFE_ADJUSTMENT
    case MoldUsageHistoryEntryType.WARNING:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_WARNING
    case MoldUsageHistoryEntryType.MOVE:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_MOVE
    case MoldUsageHistoryEntryType.SCRAP:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_SCRAP
    default:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_USAGE
  }
}
