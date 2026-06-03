import {
  AcceptProductionMoldResponse,
  AdjustMoldLifeCounterResponse,
  AuditRef,
  CarrierResourceRef,
  ConfirmInstalledMoldReadyResponse,
  ConfirmProductionMoldArrivalResponse,
  CurrentMoldByWorkCenterItem,
  GetMasterMoldResponse,
  GetMoldDesignResponse,
  GetMoldUsageHistoryResponse,
  GetProductionMoldResponse,
  GetToolingCurrentPlacementResponse,
  ItemModelRef,
  InstallToolingResponse,
  ListCurrentMoldsByWorkCenterResponse,
  ListMasterMoldsResponse,
  ListMoldDesignsResponse,
  ListMoldLifeCountersResponse,
  ListProductionMoldsByDesignResponse,
  ListProductionMoldsResponse,
  MarkInstalledMoldMaintenanceResponse,
  MarkProductionMoldForScrapResponse,
  MasterMoldStatus as ProtoMasterMoldStatus,
  MasterMold,
  MoldDesign,
  MoldDesignOutput,
  MoldDesignOutputKind as ProtoMoldDesignOutputKind,
  MoldDesignOutputOption,
  MoldDesignStatus as ProtoMoldDesignStatus,
  MoldFunctionRole as ProtoMoldFunctionRole,
  MoldInstallationDetail,
  MoldLifeAdjustmentType as ProtoMoldLifeAdjustmentType,
  MoldLifeCounter,
  MoldLifeCounterSummary,
  MoldOutputStructureType as ProtoMoldOutputStructureType,
  MoldUsageHistoryEntry,
  MoldUsageHistoryEntryType as ProtoMoldUsageHistoryEntryType,
  MoldUsageRecord as ProtoMoldUsageRecord,
  MoldWarningLevel as ProtoMoldWarningLevel,
  MoveToolingResponse,
  OperatorRef,
  ProductionMold,
  ProductionMoldStatus as ProtoProductionMoldStatus,
  ProductionMoldSummary,
  ProductionSpecRef,
  PurchaseRef,
  PurchaseSourceType as ProtoPurchaseSourceType,
  RecordMoldUsageBatchResponse,
  RecordMoldUsageResponse,
  RegisterMasterMoldResponse,
  RegisterMoldDesignResponse,
  RegisterProductionMoldResponse,
  StorageResourceRef,
  SupplierRef,
  ToolingInstallation,
  ToolingInstallationStatus as ProtoToolingInstallationStatus,
  ToolingPlacementSummary,
  ToolingPlacementType as ProtoToolingPlacementType,
  ToolingType as ProtoToolingType,
  TraceSubjectRef,
  UnmountToolingResponse,
  WorkCenterRef,
  WorkUnitRef
} from '@oes/common/generated/mes_service'
import {
  AuditRefRecord,
  CarrierResourceRefRecord,
  CurrentMoldByWorkCenterRecord,
  ItemModelRefRecord,
  MasterMoldRecord,
  MasterMoldStatus,
  MoldDesignOutputKind,
  MoldDesignRecord,
  MoldDesignStatus,
  MoldDesignSummaryRecord,
  MoldFunctionRole,
  MoldInstallationDetailRecord,
  MoldLifeAdjustmentType,
  MoldLifeCounterRecord,
  MoldLifeCounterSummaryRecord,
  MoldOutputStructureType,
  MoldUsageHistoryEntryRecord,
  MoldUsageHistoryEntryType,
  MoldUsageRecord,
  MoldWarningLevel,
  OperatorRefRecord,
  ProductionMoldRecord,
  ProductionMoldStatus,
  ProductionMoldSummaryRecord,
  ProductionSpecRefRecord,
  PurchaseRefRecord,
  StorageResourceRefRecord,
  SupplierRefRecord,
  ToolingInstallationRecord,
  ToolingInstallationStatus,
  ToolingPlacementSummaryRecord,
  ToolingPlacementType,
  ToolingType,
  TraceSubjectRefRecord,
  WorkCenterRefRecord,
  WorkUnitRefRecord
} from '../../domain/models/mes-mold-records'
import {
  ListCurrentMoldsByWorkCenterResult,
  MasterMoldSummaryPageResult,
  ListProductionMoldsByDesignResult,
  MoldDesignSummaryPageResult,
  MoldLifeCounterPageResult,
  MoldUsageHistoryResult,
  ProductionMoldSummaryPageResult
} from '../../domain/repositories/mes-mold.repository'

/** MesGrpcPresenter translates current Mold / Tooling records into the generated gRPC response surface. */
export class MesGrpcPresenter {
  /** toRegisterMoldDesignResponse presents one newly registered mold design. */
  static toRegisterMoldDesignResponse(record: MoldDesignRecord): RegisterMoldDesignResponse {
    return { moldDesign: this.toMoldDesign(record) }
  }

  /** toRegisterMasterMoldResponse presents one newly registered master mold. */
  static toRegisterMasterMoldResponse(record: MasterMoldRecord): RegisterMasterMoldResponse {
    return { masterMold: this.toMasterMold(record) }
  }

  /** toRegisterProductionMoldResponse presents one newly registered production mold. */
  static toRegisterProductionMoldResponse(record: ProductionMoldRecord): RegisterProductionMoldResponse {
    return { productionMold: this.toProductionMold(record) }
  }

  /** toConfirmProductionMoldArrivalResponse presents one arrived production mold. */
  static toConfirmProductionMoldArrivalResponse(input: { productionMold: ProductionMoldRecord }): ConfirmProductionMoldArrivalResponse {
    return { productionMold: this.toProductionMold(input.productionMold) }
  }

  /** toAcceptProductionMoldResponse presents one accepted production mold. */
  static toAcceptProductionMoldResponse(input: { productionMold: ProductionMoldRecord }): AcceptProductionMoldResponse {
    return { productionMold: this.toProductionMold(input.productionMold) }
  }

  /** toMoveToolingResponse presents the new current tooling placement. */
  static toMoveToolingResponse(input: { placement: ToolingPlacementSummaryRecord }): MoveToolingResponse {
    return { placement: this.toToolingPlacementSummary(input.placement) }
  }

  /** toInstallToolingResponse presents one active tooling installation fact. */
  static toInstallToolingResponse(input: { toolingInstallation: ToolingInstallationRecord }): InstallToolingResponse {
    return { toolingInstallation: this.toToolingInstallation(input.toolingInstallation) }
  }

  /** toUnmountToolingResponse presents one closed tooling installation fact. */
  static toUnmountToolingResponse(input: { toolingInstallation: ToolingInstallationRecord }): UnmountToolingResponse {
    return { toolingInstallation: this.toToolingInstallation(input.toolingInstallation) }
  }

  /** toConfirmInstalledMoldReadyResponse presents one installed mold that can record usage. */
  static toConfirmInstalledMoldReadyResponse(input: { productionMold: ProductionMoldRecord }): ConfirmInstalledMoldReadyResponse {
    return { productionMold: this.toProductionMold(input.productionMold) }
  }

  /** toMarkInstalledMoldMaintenanceResponse presents one installed mold returned to maintenance. */
  static toMarkInstalledMoldMaintenanceResponse(input: { productionMold: ProductionMoldRecord }): MarkInstalledMoldMaintenanceResponse {
    return { productionMold: this.toProductionMold(input.productionMold) }
  }

  /** toRecordMoldUsageResponse presents usage and life counter facts. */
  static toRecordMoldUsageResponse(input: {
    moldUsageRecord: MoldUsageRecord
    moldLifeCounter: MoldLifeCounterRecord
  }): RecordMoldUsageResponse {
    return {
      moldUsageRecord: this.toMoldUsageRecord(input.moldUsageRecord),
      moldLifeCounter: this.toMoldLifeCounter(input.moldLifeCounter)
    }
  }

  /** toRecordMoldUsageBatchResponse presents transactional batch usage results. */
  static toRecordMoldUsageBatchResponse(input: {
    moldUsageRecords: MoldUsageRecord[]
    moldLifeCounters: MoldLifeCounterRecord[]
  }): RecordMoldUsageBatchResponse {
    return {
      moldUsageRecords: input.moldUsageRecords.map((record) => this.toMoldUsageRecord(record)),
      moldLifeCounters: input.moldLifeCounters.map((record) => this.toMoldLifeCounter(record))
    }
  }

  /** toAdjustMoldLifeCounterResponse presents the adjusted independent life counter. */
  static toAdjustMoldLifeCounterResponse(input: {
    moldLifeCounter: MoldLifeCounterRecord
  }): AdjustMoldLifeCounterResponse {
    return { moldLifeCounter: this.toMoldLifeCounter(input.moldLifeCounter) }
  }

  /** toMarkProductionMoldForScrapResponse presents the pending or terminal scrap state. */
  static toMarkProductionMoldForScrapResponse(input: {
    productionMold: ProductionMoldRecord
  }): MarkProductionMoldForScrapResponse {
    return {
      productionMold: this.toProductionMold(input.productionMold)
    }
  }

  /** toGetMoldDesignResponse presents one mold design query result. */
  static toGetMoldDesignResponse(record: MoldDesignRecord): GetMoldDesignResponse {
    return { moldDesign: this.toMoldDesign(record) }
  }

  /** toListMoldDesignsResponse presents one mold design summary page. */
  static toListMoldDesignsResponse(input: MoldDesignSummaryPageResult): ListMoldDesignsResponse {
    return {
      moldDesigns: input.moldDesigns.map((record) => this.toMoldDesignSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetMasterMoldResponse presents one master mold query result. */
  static toGetMasterMoldResponse(record: MasterMoldRecord): GetMasterMoldResponse {
    return { masterMold: this.toMasterMold(record) }
  }

  /** toListMasterMoldsResponse presents one master mold summary page. */
  static toListMasterMoldsResponse(input: MasterMoldSummaryPageResult): ListMasterMoldsResponse {
    return {
      masterMolds: input.masterMolds.map((record) => ({
        masterMoldId: record.masterMoldId,
        masterMoldCode: record.masterMoldCode,
        moldDesignSummary: this.toMoldDesignSummary(record.moldDesignSummary),
        currentStatus: toProtoMasterMoldStatus(record.currentStatus),
        currentPlacementSummary: record.currentPlacementSummary
          ? this.toToolingPlacementSummary(record.currentPlacementSummary)
          : undefined
      })),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetProductionMoldResponse presents one production mold query result. */
  static toGetProductionMoldResponse(record: ProductionMoldRecord): GetProductionMoldResponse {
    return { productionMold: this.toProductionMold(record) }
  }

  /** toListProductionMoldsResponse presents one production mold summary page. */
  static toListProductionMoldsResponse(input: ProductionMoldSummaryPageResult): ListProductionMoldsResponse {
    return {
      productionMolds: input.productionMolds.map((record) => this.toProductionMoldSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toListProductionMoldsByDesignResponse presents production molds grouped under one design. */
  static toListProductionMoldsByDesignResponse(
    input: ListProductionMoldsByDesignResult
  ): ListProductionMoldsByDesignResponse {
    return {
      moldDesignSummary: this.toMoldDesignSummary(input.moldDesignSummary),
      productionMolds: input.productionMolds.map((record) => this.toProductionMoldSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetToolingCurrentPlacementResponse presents the current storage, carrier, or installation placement. */
  static toGetToolingCurrentPlacementResponse(input: {
    placement: ToolingPlacementSummaryRecord
  }): GetToolingCurrentPlacementResponse {
    return { placement: this.toToolingPlacementSummary(input.placement) }
  }

  /** toGetMoldUsageHistoryResponse presents one flattened mold history page. */
  static toGetMoldUsageHistoryResponse(input: MoldUsageHistoryResult): GetMoldUsageHistoryResponse {
    return {
      entries: input.entries.map((record) => this.toMoldUsageHistoryEntry(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toListCurrentMoldsByWorkCenterResponse presents active mold installations for one work center. */
  static toListCurrentMoldsByWorkCenterResponse(
    input: ListCurrentMoldsByWorkCenterResult
  ): ListCurrentMoldsByWorkCenterResponse {
    return {
      items: input.items.map((record): CurrentMoldByWorkCenterItem => ({
        productionMold: this.toProductionMoldSummary(record.productionMold),
        toolingInstallation: this.toToolingInstallation(record.toolingInstallation),
        usageAllowed: record.usageAllowed,
        usageDisabledReason: record.usageDisabledReason ?? undefined
      }))
    }
  }

  /** toListMoldLifeCountersResponse presents one life-counter page. */
  static toListMoldLifeCountersResponse(input: MoldLifeCounterPageResult): ListMoldLifeCountersResponse {
    return {
      counters: input.counters.map((record) => this.toMoldLifeCounter(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toMoldDesign converts one mold design record into generated shape. */
  static toMoldDesign(record: MoldDesignRecord): MoldDesign {
    return {
      moldDesignId: record.moldDesignId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      designCode: record.designCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      supersedesMoldDesignId: record.supersedesMoldDesignId ?? undefined,
      primaryItemModelRef: toProtoItemModelRef(record.primaryItemModelRef),
      productionSpecRefs: record.productionSpecRefs.map((ref) => toProtoProductionSpecRef(ref)),
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

  /** toMoldDesignOutput converts one theoretical output row into generated shape. */
  static toMoldDesignOutput(record: MoldDesignRecord['outputs'][number]): MoldDesignOutput {
    return {
      moldDesignOutputId: record.moldDesignOutputId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      moldDesignId: record.moldDesignId,
      sequenceNo: record.sequenceNo,
      outputCode: record.outputCode,
      outputKind: toProtoMoldDesignOutputKind(record.outputKind),
      productionSpecRef: record.productionSpecRef ? toProtoProductionSpecRef(record.productionSpecRef) : undefined,
      itemModelRef: record.itemModelRef ? toProtoItemModelRef(record.itemModelRef) : undefined,
      quantityPerUse: record.quantityPerUse,
      componentRole: record.componentRole ?? undefined,
      assemblyHint: record.assemblyHint ?? undefined,
      isPrimaryOutput: record.isPrimaryOutput,
      options: record.options.map((option) => this.toMoldDesignOutputOption(option))
    }
  }

  /** toMoldDesignOutputOption converts one selectable output variant into generated shape. */
  static toMoldDesignOutputOption(
    record: MoldDesignRecord['outputs'][number]['options'][number]
  ): MoldDesignOutputOption {
    return {
      moldDesignOutputOptionId: record.moldDesignOutputOptionId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      moldDesignId: record.moldDesignId,
      moldDesignOutputId: record.moldDesignOutputId,
      optionCode: record.optionCode,
      label: record.label,
      productionSpecRef: record.productionSpecRef ? toProtoProductionSpecRef(record.productionSpecRef) : undefined,
      quantityPerUse: record.quantityPerUse ?? undefined,
      isDefault: record.isDefault
    }
  }

  /** toMoldDesignSummary converts one design summary into generated shape. */
  static toMoldDesignSummary(record: MoldDesignSummaryRecord) {
    return {
      moldDesignId: record.moldDesignId,
      designCode: record.designCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      status: toProtoMoldDesignStatus(record.status),
      primaryItemModelRef: record.primaryItemModelRef ? toProtoItemModelRef(record.primaryItemModelRef) : undefined
    }
  }

  /** toMasterMold converts one master mold record into generated shape. */
  static toMasterMold(record: MasterMoldRecord): MasterMold {
    return {
      masterMoldId: record.masterMoldId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      masterMoldCode: record.masterMoldCode,
      moldDesignId: record.moldDesignId,
      supplierRef: record.supplierRef ? toProtoSupplierRef(record.supplierRef) : undefined,
      purchaseRef: record.purchaseRef ? toProtoPurchaseRef(record.purchaseRef) : undefined,
      receivedAt: record.receivedAt ?? undefined,
      currentStatus: toProtoMasterMoldStatus(record.currentStatus),
      currentStorageResourceRef: record.currentStorageResourceRef
        ? toProtoStorageResourceRef(record.currentStorageResourceRef)
        : undefined,
      currentCarrierResourceRef: record.currentCarrierResourceRef
        ? toProtoCarrierResourceRef(record.currentCarrierResourceRef)
        : undefined,
      qualitySummary: record.qualitySummary ?? undefined,
      notes: record.notes ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  /** toProductionMold converts one production mold record into generated shape. */
  static toProductionMold(record: ProductionMoldRecord): ProductionMold {
    return {
      productionMoldId: record.productionMoldId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      moldCode: record.moldCode,
      moldDesignId: record.moldDesignId,
      sourceMasterMoldId: record.sourceMasterMoldId ?? undefined,
      supplierRef: record.supplierRef ? toProtoSupplierRef(record.supplierRef) : undefined,
      purchaseRef: record.purchaseRef ? toProtoPurchaseRef(record.purchaseRef) : undefined,
      receivedAt: record.receivedAt ?? undefined,
      acceptedAt: record.acceptedAt ?? undefined,
      currentStatus: toProtoProductionMoldStatus(record.currentStatus),
      currentStorageResourceRef: record.currentStorageResourceRef
        ? toProtoStorageResourceRef(record.currentStorageResourceRef)
        : undefined,
      currentCarrierResourceRef: record.currentCarrierResourceRef
        ? toProtoCarrierResourceRef(record.currentCarrierResourceRef)
        : undefined,
      currentInstallationSummary: record.currentInstallationSummary
        ? this.toToolingInstallation(record.currentInstallationSummary)
        : undefined,
      lifeCounterSummary: record.lifeCounterSummary
        ? this.toMoldLifeCounterSummary(record.lifeCounterSummary)
        : undefined,
      scrappedAt: record.scrappedAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  /** toProductionMoldSummary converts one production mold summary into generated shape. */
  static toProductionMoldSummary(record: ProductionMoldSummaryRecord): ProductionMoldSummary {
    return {
      productionMoldId: record.productionMoldId,
      moldCode: record.moldCode,
      moldDesignSummary: this.toMoldDesignSummary(record.moldDesignSummary),
      currentStatus: toProtoProductionMoldStatus(record.currentStatus),
      currentPlacementSummary: record.currentPlacementSummary
        ? this.toToolingPlacementSummary(record.currentPlacementSummary)
        : undefined,
      lifeCounterSummary: record.lifeCounterSummary
        ? this.toMoldLifeCounterSummary(record.lifeCounterSummary)
        : undefined
    }
  }

  /** toToolingInstallation converts one installation interval fact into generated shape. */
  static toToolingInstallation(record: ToolingInstallationRecord): ToolingInstallation {
    return {
      toolingInstallationId: record.toolingInstallationId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      toolingType: toProtoToolingType(record.toolingType),
      toolingId: record.toolingId,
      workCenterRef: toProtoWorkCenterRef(record.workCenterRef),
      workUnitRef: record.workUnitRef ? toProtoWorkUnitRef(record.workUnitRef) : undefined,
      installedAt: record.installedAt,
      unmountedAt: record.unmountedAt ?? undefined,
      installedByRef: record.installedByRef ? toProtoOperatorRef(record.installedByRef) : undefined,
      unmountedByRef: record.unmountedByRef ? toProtoOperatorRef(record.unmountedByRef) : undefined,
      status: toProtoToolingInstallationStatus(record.status),
      moldDetail: record.moldDetail ? toProtoMoldInstallationDetail(record.moldDetail) : undefined,
      auditRef: toProtoAuditRef(record.auditRef)
    }
  }

  /** toToolingPlacementSummary converts current placement projections into generated shape. */
  static toToolingPlacementSummary(record: ToolingPlacementSummaryRecord): ToolingPlacementSummary {
    return {
      placementType: toProtoToolingPlacementType(record.placementType),
      storageResourceRef: record.storageResourceRef ? toProtoStorageResourceRef(record.storageResourceRef) : undefined,
      carrierResourceRef: record.carrierResourceRef ? toProtoCarrierResourceRef(record.carrierResourceRef) : undefined,
      workCenterRef: record.workCenterRef ? toProtoWorkCenterRef(record.workCenterRef) : undefined,
      workUnitRef: record.workUnitRef ? toProtoWorkUnitRef(record.workUnitRef) : undefined,
      toolingInstallationId: record.toolingInstallationId ?? undefined,
      moldInstallationDetail: record.moldInstallationDetail
        ? toProtoMoldInstallationDetail(record.moldInstallationDetail)
        : undefined
    }
  }

  /** toMoldUsageRecord converts one append-only usage fact into generated shape. */
  static toMoldUsageRecord(record: MoldUsageRecord): ProtoMoldUsageRecord {
    return {
      moldUsageRecordId: record.moldUsageRecordId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      productionMoldId: record.productionMoldId,
      toolingInstallationId: record.toolingInstallationId ?? undefined,
      workCenterRef: toProtoWorkCenterRef(record.workCenterRef),
      workUnitRef: record.workUnitRef ? toProtoWorkUnitRef(record.workUnitRef) : undefined,
      usedAt: record.usedAt,
      usageQuantity: record.usageQuantity,
      lifeDelta: record.lifeDelta,
      lifeUnit: record.lifeUnit,
      productionSpecRef: record.productionSpecRef ? toProtoProductionSpecRef(record.productionSpecRef) : undefined,
      productionUnitRef: record.productionUnitRef
        ? {
            productionUnitId: record.productionUnitRef.productionUnitId,
            unitCodeSnapshot: record.productionUnitRef.unitCodeSnapshot ?? undefined,
            displayNameSnapshot: record.productionUnitRef.displayNameSnapshot ?? undefined
          }
        : undefined,
      traceSubjectRef: record.traceSubjectRef ? toProtoTraceSubjectRef(record.traceSubjectRef) : undefined,
      operatorRef: toProtoOperatorRef(record.operatorRef),
      captureSource: record.captureSource ?? undefined,
      auditRef: toProtoAuditRef(record.auditRef),
      moldDesignOutputId: record.moldDesignOutputId ?? undefined,
      moldDesignOutputOptionId: record.moldDesignOutputOptionId ?? undefined
    }
  }

  /** toMoldLifeCounter converts an independent life counter into generated shape. */
  static toMoldLifeCounter(record: MoldLifeCounterRecord): MoldLifeCounter {
    return {
      moldLifeCounterId: record.moldLifeCounterId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      productionMoldId: record.productionMoldId,
      lifeUnit: record.lifeUnit,
      usedValue: record.usedValue,
      limitValue: record.limitValue ?? undefined,
      warningThresholdValue: record.warningThresholdValue ?? undefined,
      lastUsageRecordId: record.lastUsageRecordId ?? undefined,
      lastAdjustedAt: record.lastAdjustedAt ?? undefined,
      lastAdjustedByRef: record.lastAdjustedByRef ? toProtoOperatorRef(record.lastAdjustedByRef) : undefined,
      adjustmentReason: record.adjustmentReason ?? undefined,
      updatedAt: record.updatedAt
    }
  }

  /** toMoldLifeCounterSummary converts current counter projection into generated shape. */
  static toMoldLifeCounterSummary(record: MoldLifeCounterSummaryRecord): MoldLifeCounterSummary {
    return {
      moldLifeCounterId: record.moldLifeCounterId,
      lifeUnit: record.lifeUnit,
      usedValue: record.usedValue,
      limitValue: record.limitValue ?? undefined,
      warningThresholdValue: record.warningThresholdValue ?? undefined,
      remainingValue: record.remainingValue ?? undefined,
      warningLevel: record.warningLevel ? toProtoMoldWarningLevel(record.warningLevel) : undefined,
      lastUsageRecordId: record.lastUsageRecordId ?? undefined,
      lastAdjustedAt: record.lastAdjustedAt ?? undefined
    }
  }

  /** toMoldUsageHistoryEntry converts one flattened history row into generated shape. */
  static toMoldUsageHistoryEntry(record: MoldUsageHistoryEntryRecord): MoldUsageHistoryEntry {
    return {
      entryType: toProtoMoldUsageHistoryEntryType(record.entryType),
      happenedAt: record.happenedAt,
      productionMoldId: record.productionMoldId,
      summary: record.summary,
      auditRef: record.auditRef ? toProtoAuditRef(record.auditRef) : undefined
    }
  }
}

/** toDomainMoldFunctionRole maps generated enum values into domain enum values. */
export function toDomainMoldFunctionRole(value?: ProtoMoldFunctionRole): MoldFunctionRole {
  return value === ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_MASTER ? MoldFunctionRole.MASTER : MoldFunctionRole.PRODUCTION
}

/** toDomainMoldOutputStructureType maps generated output structure filters into domain enum values. */
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

/** toDomainMoldDesignOutputKind maps generated output ownership into domain enum values. */
export function toDomainMoldDesignOutputKind(value?: ProtoMoldDesignOutputKind): MoldDesignOutputKind {
  switch (value) {
    case ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_PRODUCT:
      return MoldDesignOutputKind.PRODUCT
    case ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_COMPONENT:
      return MoldDesignOutputKind.COMPONENT
    default:
      return MoldDesignOutputKind.PRODUCTION_SPEC
  }
}

/** toDomainMoldDesignStatus maps generated design status filters into domain values. */
export function toDomainMoldDesignStatus(value?: ProtoMoldDesignStatus): MoldDesignStatus | undefined {
  switch (value) {
    case ProtoMoldDesignStatus.MOLD_DESIGN_STATUS_ACTIVE:
      return MoldDesignStatus.ACTIVE
    case ProtoMoldDesignStatus.MOLD_DESIGN_STATUS_INACTIVE:
      return MoldDesignStatus.INACTIVE
    case ProtoMoldDesignStatus.MOLD_DESIGN_STATUS_SUPERSEDED:
      return MoldDesignStatus.SUPERSEDED
    default:
      return undefined
  }
}

/** toDomainMasterMoldStatus maps generated master mold status filters into domain values. */
export function toDomainMasterMoldStatus(value?: ProtoMasterMoldStatus): MasterMoldStatus | undefined {
  switch (value) {
    case ProtoMasterMoldStatus.MASTER_MOLD_STATUS_AVAILABLE:
      return MasterMoldStatus.AVAILABLE
    case ProtoMasterMoldStatus.MASTER_MOLD_STATUS_DISABLED:
      return MasterMoldStatus.DISABLED
    default:
      return undefined
  }
}

/** toDomainProductionMoldStatus maps generated production mold status filters into domain values. */
export function toDomainProductionMoldStatus(value?: ProtoProductionMoldStatus): ProductionMoldStatus | undefined {
  switch (value) {
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_PRE_REGISTERED:
      return ProductionMoldStatus.PRE_REGISTERED
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_PREPARING:
      return ProductionMoldStatus.PREPARING
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_AVAILABLE:
      return ProductionMoldStatus.AVAILABLE
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_READY:
      return ProductionMoldStatus.READY
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_MAINTENANCE:
      return ProductionMoldStatus.MAINTENANCE
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_DISABLED:
      return ProductionMoldStatus.DISABLED
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_SCRAP_PENDING:
      return ProductionMoldStatus.SCRAP_PENDING
    case ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_SCRAPPED:
      return ProductionMoldStatus.SCRAPPED
    default:
      return undefined
  }
}

/** toDomainToolingType maps generated tooling type into the current domain enum. */
export function toDomainToolingType(value?: ProtoToolingType): ToolingType {
  return value === ProtoToolingType.TOOLING_TYPE_MOLD ? ToolingType.MOLD : ToolingType.MOLD
}

/** toDomainMoldLifeAdjustmentType maps generated adjustment types into domain values. */
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

/** toDomainMoldWarningLevel maps generated warning filters into domain values. */
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

/** toDomainProductionSpecRef maps generated spec refs into MES display reference records. */
export function toDomainProductionSpecRef(value?: ProductionSpecRef): ProductionSpecRefRecord | undefined {
  if (!value?.productionSpecId) {
    return undefined
  }
  return {
    productionSpecId: value.productionSpecId,
    specCodeSnapshot: value.specCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}

/** toDomainItemModelRef maps generated ItemModel refs into MES display reference records. */
export function toDomainItemModelRef(value?: ItemModelRef): ItemModelRefRecord | undefined {
  if (!value?.itemModelId) {
    return undefined
  }
  return {
    itemModelId: value.itemModelId,
    modelCodeSnapshot: value.modelCodeSnapshot,
    modelNameSnapshot: value.modelNameSnapshot
  }
}

/** toDomainStorageResourceRef maps generated storage refs into MES display reference records. */
export function toDomainStorageResourceRef(value?: StorageResourceRef): StorageResourceRefRecord | undefined {
  if (!value?.storageResourceId) {
    return undefined
  }
  return {
    storageResourceId: value.storageResourceId,
    resourceCodeSnapshot: value.resourceCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}

/** toDomainCarrierResourceRef maps generated carrier refs into MES display reference records. */
export function toDomainCarrierResourceRef(value?: CarrierResourceRef): CarrierResourceRefRecord | undefined {
  if (!value?.carrierResourceId) {
    return undefined
  }
  return {
    carrierResourceId: value.carrierResourceId,
    resourceCodeSnapshot: value.resourceCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}

/** toDomainWorkCenterRef maps generated work center refs into MES display reference records. */
export function toDomainWorkCenterRef(value?: WorkCenterRef): WorkCenterRefRecord | undefined {
  if (!value?.workCenterId) {
    return undefined
  }
  return {
    workCenterId: value.workCenterId,
    workCenterCodeSnapshot: value.workCenterCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}

/** toDomainWorkUnitRef maps generated work unit refs into MES display reference records. */
export function toDomainWorkUnitRef(value?: WorkUnitRef): WorkUnitRefRecord | undefined {
  if (!value?.workUnitId) {
    return undefined
  }
  return {
    workUnitId: value.workUnitId,
    workUnitCodeSnapshot: value.workUnitCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}

/** toDomainTraceSubjectRef maps generated trace subject refs into MES display reference records. */
export function toDomainTraceSubjectRef(value?: TraceSubjectRef): TraceSubjectRefRecord | undefined {
  if (!value?.traceSubjectId) {
    return undefined
  }
  return {
    traceSubjectId: value.traceSubjectId,
    traceCodeSnapshot: value.traceCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}

/** toDomainSupplierRef maps generated supplier refs into MES display reference records. */
export function toDomainSupplierRef(value?: SupplierRef): SupplierRefRecord | undefined {
  if (!value?.supplierId) {
    return undefined
  }
  return {
    supplierId: value.supplierId,
    supplierCodeSnapshot: value.supplierCodeSnapshot,
    supplierDisplayNameSnapshot: value.supplierDisplayNameSnapshot
  }
}

/** toDomainPurchaseRef maps generated purchase refs into MES display reference records. */
export function toDomainPurchaseRef(value?: PurchaseRef): PurchaseRefRecord | undefined {
  if (!value || value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_UNSPECIFIED) {
    return undefined
  }
  return {
    purchaseSourceType:
      value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_PURCHASE_ORDER
        ? 'PURCHASE_ORDER'
        : value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_PURCHASE_RECEIPT
          ? 'PURCHASE_RECEIPT'
          : value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_EXTERNAL_DOCUMENT
            ? 'EXTERNAL_DOCUMENT'
            : 'MANUAL',
    purchaseSourceId: value.purchaseSourceId,
    purchaseNoSnapshot: value.purchaseNoSnapshot
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
    case MoldDesignOutputKind.PRODUCT:
      return ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_PRODUCT
    case MoldDesignOutputKind.COMPONENT:
      return ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_COMPONENT
    default:
      return ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_PRODUCTION_SPEC
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

function toProtoProductionMoldStatus(value: ProductionMoldStatus): ProtoProductionMoldStatus {
  switch (value) {
    case ProductionMoldStatus.PRE_REGISTERED:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_PRE_REGISTERED
    case ProductionMoldStatus.PREPARING:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_PREPARING
    case ProductionMoldStatus.READY:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_READY
    case ProductionMoldStatus.MAINTENANCE:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_MAINTENANCE
    case ProductionMoldStatus.DISABLED:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_DISABLED
    case ProductionMoldStatus.SCRAP_PENDING:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_SCRAP_PENDING
    case ProductionMoldStatus.SCRAPPED:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_SCRAPPED
    default:
      return ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_AVAILABLE
  }
}

function toProtoMasterMoldStatus(value: MasterMoldStatus): ProtoMasterMoldStatus {
  return value === MasterMoldStatus.DISABLED
    ? ProtoMasterMoldStatus.MASTER_MOLD_STATUS_DISABLED
    : ProtoMasterMoldStatus.MASTER_MOLD_STATUS_AVAILABLE
}

function toProtoToolingType(value: ToolingType): ProtoToolingType {
  return value === ToolingType.MOLD ? ProtoToolingType.TOOLING_TYPE_MOLD : ProtoToolingType.TOOLING_TYPE_MOLD
}

function toProtoToolingInstallationStatus(value: ToolingInstallationStatus): ProtoToolingInstallationStatus {
  switch (value) {
    case ToolingInstallationStatus.UNMOUNTED:
      return ProtoToolingInstallationStatus.TOOLING_INSTALLATION_STATUS_UNMOUNTED
    default:
      return ProtoToolingInstallationStatus.TOOLING_INSTALLATION_STATUS_ACTIVE
  }
}

function toProtoToolingPlacementType(value: ToolingPlacementType): ProtoToolingPlacementType {
  switch (value) {
    case ToolingPlacementType.CARRIER_RESOURCE:
      return ProtoToolingPlacementType.TOOLING_PLACEMENT_TYPE_CARRIER_RESOURCE
    case ToolingPlacementType.WORK_CENTER:
      return ProtoToolingPlacementType.TOOLING_PLACEMENT_TYPE_WORK_CENTER
    case ToolingPlacementType.WORK_UNIT:
      return ProtoToolingPlacementType.TOOLING_PLACEMENT_TYPE_WORK_UNIT
    default:
      return ProtoToolingPlacementType.TOOLING_PLACEMENT_TYPE_STORAGE_RESOURCE
  }
}

function toProtoMoldWarningLevel(value: MoldWarningLevel): ProtoMoldWarningLevel {
  switch (value) {
    case MoldWarningLevel.WARNING:
      return ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_WARNING
    case MoldWarningLevel.CRITICAL:
      return ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_CRITICAL
    default:
      return ProtoMoldWarningLevel.MOLD_WARNING_LEVEL_INFO
  }
}

function toProtoMoldUsageHistoryEntryType(value: MoldUsageHistoryEntryType): ProtoMoldUsageHistoryEntryType {
  switch (value) {
    case MoldUsageHistoryEntryType.UNMOUNT:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_UNMOUNT
    case MoldUsageHistoryEntryType.USAGE:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_USAGE
    case MoldUsageHistoryEntryType.LIFE_ADJUSTMENT:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_LIFE_ADJUSTMENT
    case MoldUsageHistoryEntryType.MOVE:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_MOVE
    case MoldUsageHistoryEntryType.SCRAP:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_SCRAP
    default:
      return ProtoMoldUsageHistoryEntryType.MOLD_USAGE_HISTORY_ENTRY_TYPE_INSTALL
  }
}

function toProtoProductionSpecRef(record: ProductionSpecRefRecord): ProductionSpecRef {
  return {
    productionSpecId: record.productionSpecId,
    specCodeSnapshot: record.specCodeSnapshot ?? undefined,
    displayNameSnapshot: record.displayNameSnapshot ?? undefined
  }
}

function toProtoItemModelRef(record: ItemModelRefRecord): ItemModelRef {
  return {
    itemModelId: record.itemModelId,
    modelCodeSnapshot: record.modelCodeSnapshot ?? undefined,
    modelNameSnapshot: record.modelNameSnapshot ?? undefined
  }
}

function toProtoSupplierRef(record: SupplierRefRecord): SupplierRef {
  return {
    supplierId: record.supplierId,
    supplierCodeSnapshot: record.supplierCodeSnapshot ?? undefined,
    supplierDisplayNameSnapshot: record.supplierDisplayNameSnapshot ?? undefined
  }
}

function toProtoPurchaseRef(record: PurchaseRefRecord): PurchaseRef {
  const purchaseSourceType =
    record.purchaseSourceType === 'PURCHASE_ORDER'
      ? ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_PURCHASE_ORDER
      : record.purchaseSourceType === 'PURCHASE_RECEIPT'
        ? ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_PURCHASE_RECEIPT
        : record.purchaseSourceType === 'EXTERNAL_DOCUMENT'
          ? ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_EXTERNAL_DOCUMENT
          : ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_MANUAL
  return {
    purchaseSourceType,
    purchaseSourceId: record.purchaseSourceId ?? undefined,
    purchaseNoSnapshot: record.purchaseNoSnapshot ?? undefined
  }
}

function toProtoStorageResourceRef(record: StorageResourceRefRecord): StorageResourceRef {
  return {
    storageResourceId: record.storageResourceId,
    resourceCodeSnapshot: record.resourceCodeSnapshot ?? undefined,
    displayNameSnapshot: record.displayNameSnapshot ?? undefined
  }
}

function toProtoCarrierResourceRef(record: CarrierResourceRefRecord): CarrierResourceRef {
  return {
    carrierResourceId: record.carrierResourceId,
    resourceCodeSnapshot: record.resourceCodeSnapshot ?? undefined,
    displayNameSnapshot: record.displayNameSnapshot ?? undefined
  }
}

function toProtoWorkCenterRef(record: WorkCenterRefRecord): WorkCenterRef {
  return {
    workCenterId: record.workCenterId,
    workCenterCodeSnapshot: record.workCenterCodeSnapshot ?? undefined,
    displayNameSnapshot: record.displayNameSnapshot ?? undefined
  }
}

function toProtoWorkUnitRef(record: WorkUnitRefRecord): WorkUnitRef {
  return {
    workUnitId: record.workUnitId,
    workUnitCodeSnapshot: record.workUnitCodeSnapshot ?? undefined,
    displayNameSnapshot: record.displayNameSnapshot ?? undefined
  }
}

function toProtoOperatorRef(record: OperatorRefRecord): OperatorRef {
  return {
    operatorId: record.operatorId,
    displayNameSnapshot: record.displayNameSnapshot ?? undefined
  }
}

function toProtoAuditRef(record: AuditRefRecord): AuditRef {
  return {
    auditId: record.auditId,
    commandId: record.commandId,
    reason: record.reason
  }
}

function toProtoMoldInstallationDetail(record: MoldInstallationDetailRecord): MoldInstallationDetail {
  return {
    toolingInstallationId: record.toolingInstallationId,
    moldPositionIndex: record.moldPositionIndex,
    cavityPosition: record.cavityPosition ?? undefined,
    cavityMapping: record.cavityMapping ?? undefined,
    setupParameters: record.setupParameters ?? undefined
  }
}

function toProtoTraceSubjectRef(record: TraceSubjectRefRecord): TraceSubjectRef {
  return {
    traceSubjectId: record.traceSubjectId,
    traceCodeSnapshot: record.traceCodeSnapshot ?? undefined,
    displayNameSnapshot: record.displayNameSnapshot ?? undefined
  }
}
