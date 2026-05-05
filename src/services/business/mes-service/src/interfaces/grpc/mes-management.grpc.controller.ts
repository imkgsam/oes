import { Controller, UseFilters } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AcknowledgeMoldWarningRequest,
  AcknowledgeMoldWarningResponse,
  AdjustMoldLifeRequest,
  AdjustMoldLifeResponse,
  CreateWorkCenterRequest,
  CreateWorkCenterResponse,
  DeactivateWorkCenterRequest,
  DeactivateWorkCenterResponse,
  InstallMoldRequest,
  InstallMoldResponse,
  MoveMoldRequest,
  MoveMoldResponse,
  PurchaseSourceType as ProtoPurchaseSourceType,
  RecordMoldUsageRequest,
  RecordMoldUsageResponse,
  RegisterMasterMoldRequest,
  RegisterMasterMoldResponse,
  RegisterMoldDesignRequest,
  RegisterMoldDesignResponse,
  RegisterProductionMoldInstanceRequest,
  RegisterProductionMoldInstanceResponse,
  ScrapMoldRequest,
  ScrapMoldResponse,
  UnmountMoldRequest,
  UnmountMoldResponse,
  MoldManagementServiceController,
  MoldManagementServiceControllerMethods
} from '@oes/common/generated/mes_service'
import { MesMoldManagementService } from '../../application/services/mes-mold-management.service'
import {
  ExternalRefRecord,
  PurchaseRefRecord
} from '../../domain/models/mes-mold-records'
import {
  MesGrpcPresenter,
  toDomainManufacturingMasterDataRef,
  toDomainMoldDesignOutputKind,
  toDomainMoldFunctionRole,
  toDomainMoldLifeAdjustmentType,
  toDomainMoldOutputStructureType,
  toDomainMoldResourceType,
  toDomainMoldUsageMode,
  toDomainMoldWarningAcknowledgementAction,
  toDomainProductionMoldInstanceStatus
} from './mes-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** MesManagementGrpcController exposes the phase 1 MES mold command contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@MoldManagementServiceControllerMethods()
export class MesManagementGrpcController implements MoldManagementServiceController {
  constructor(
    private readonly managementService: MesMoldManagementService,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  async createWorkCenter(request: CreateWorkCenterRequest): Promise<CreateWorkCenterResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toCreateWorkCenterResponse(
        await this.managementService.createWorkCenter({
          ...context,
          commandId: request.commandId ?? '',
          workCenterCode: request.workCenterCode ?? '',
          name: request.name ?? '',
          workCenterType: request.workCenterType ?? '',
          parentWorkCenterId: request.parentWorkCenterId ?? undefined,
          relatedMesLocationId: request.relatedMesLocationId ?? undefined,
          capacityProfileId: request.capacityProfileId ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async deactivateWorkCenter(request: DeactivateWorkCenterRequest): Promise<DeactivateWorkCenterResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toDeactivateWorkCenterResponse(
        await this.managementService.deactivateWorkCenter({
          ...context,
          commandId: request.commandId ?? '',
          workCenterId: request.workCenterId ?? '',
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async registerMoldDesign(request: RegisterMoldDesignRequest): Promise<RegisterMoldDesignResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toRegisterMoldDesignResponse(
        await this.managementService.registerMoldDesign({
          ...context,
          commandId: request.commandId ?? '',
          designCode: request.designCode ?? '',
          name: request.name ?? '',
          revisionCode: request.revisionCode ?? undefined,
          supersedesDesignId: request.supersedesDesignId ?? undefined,
          productFamilyRef: toDomainManufacturingMasterDataRef(request.productFamilyRef, 'PRODUCT_FAMILY') as never,
          manufacturingSpecRefs: (request.manufacturingSpecRefs ?? [])
            .map((ref) => toDomainManufacturingMasterDataRef(ref, 'MANUFACTURING_SPEC'))
            .filter(Boolean) as never,
          itemRef: request.itemRef?.itemId
            ? {
                itemId: request.itemRef.itemId,
                itemCodeSnapshot: request.itemRef.itemCodeSnapshot,
                itemNameSnapshot: request.itemRef.itemNameSnapshot
              }
            : undefined,
          materialType: request.materialType ?? '',
          functionRole: toDomainMoldFunctionRole(request.functionRole),
          productionMethodTags: request.productionMethodTags ?? [],
          outputStructureType: toDomainMoldOutputStructureType(request.outputStructureType),
          outputs: (request.outputs ?? []).map((output) => ({
            sequenceNo: output.sequenceNo ?? 0,
            outputCode: output.outputCode ?? '',
            outputKind: toDomainMoldDesignOutputKind(output.outputKind),
            productFamilyRef: toDomainManufacturingMasterDataRef(output.productFamilyRef, 'PRODUCT_FAMILY') ?? null,
            manufacturingSpecRef:
              toDomainManufacturingMasterDataRef(output.manufacturingSpecRef, 'MANUFACTURING_SPEC') ?? null,
            quantityPerUse: output.quantityPerUse ?? '',
            componentRole: output.componentRole ?? undefined,
            assemblyHint: output.assemblyHint ?? undefined,
            isPrimaryOutput: output.isPrimaryOutput ?? false,
            options: (output.options ?? []).map((option) => ({
              moldDesignOutputOptionId: option.moldDesignOutputOptionId ?? undefined,
              optionCode: option.optionCode ?? '',
              label: option.label ?? '',
              manufacturingSpecRef: toDomainManufacturingMasterDataRef(
                option.manufacturingSpecRef,
                'MANUFACTURING_SPEC'
              ) as never,
              productFamilyRef: toDomainManufacturingMasterDataRef(option.productFamilyRef, 'PRODUCT_FAMILY') ?? null,
              quantityPerUse: option.quantityPerUse ?? undefined,
              isDefault: option.isDefault ?? false
            }))
          })),
          defaultLifeLimit: request.defaultLifeLimit ?? undefined,
          defaultLifeUnit: request.defaultLifeUnit ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async registerMasterMold(request: RegisterMasterMoldRequest): Promise<RegisterMasterMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toRegisterMasterMoldResponse(
        await this.managementService.registerMasterMold({
          ...context,
          commandId: request.commandId ?? '',
          masterMoldCode: request.masterMoldCode ?? '',
          moldDesignId: request.moldDesignId ?? '',
          supplierRef: request.supplierRef?.supplierId
            ? {
                supplierId: request.supplierRef.supplierId,
                supplierCodeSnapshot: request.supplierRef.supplierCodeSnapshot,
                supplierDisplayNameSnapshot: request.supplierRef.supplierDisplayNameSnapshot
              }
            : undefined,
          purchaseRef: toDomainPurchaseRef(request.purchaseRef),
          receivedAt: request.receivedAt ?? undefined,
          initialMesLocationId: request.initialMesLocationId ?? undefined,
          qualitySummary: request.qualitySummary ?? undefined,
          notes: request.notes ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async registerProductionMoldInstance(
    request: RegisterProductionMoldInstanceRequest
  ): Promise<RegisterProductionMoldInstanceResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toRegisterProductionMoldInstanceResponse(
        await this.managementService.registerProductionMoldInstance({
          ...context,
          commandId: request.commandId ?? '',
          moldInstanceCode: request.moldInstanceCode ?? '',
          moldDesignId: request.moldDesignId ?? '',
          masterMoldId: request.masterMoldId ?? undefined,
          supplierRef: request.supplierRef?.supplierId
            ? {
                supplierId: request.supplierRef.supplierId,
                supplierCodeSnapshot: request.supplierRef.supplierCodeSnapshot,
                supplierDisplayNameSnapshot: request.supplierRef.supplierDisplayNameSnapshot
              }
            : undefined,
          purchaseRef: toDomainPurchaseRef(request.purchaseRef),
          receivedAt: request.receivedAt ?? undefined,
          acceptedAt: request.acceptedAt ?? undefined,
          initialStatus: toDomainProductionMoldInstanceStatus(request.initialStatus),
          initialMesLocationId: request.initialMesLocationId ?? undefined,
          lifeLimitValue: request.lifeLimitValue ?? undefined,
          lifeUnit: request.lifeUnit ?? undefined,
          warningThresholdValue: request.warningThresholdValue ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async moveMold(request: MoveMoldRequest): Promise<MoveMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toMoveMoldResponse(
        await this.managementService.moveMold({
          ...context,
          commandId: request.commandId ?? '',
          moldResourceType: toDomainMoldResourceType(request.moldResourceType),
          moldResourceId: request.moldResourceId ?? '',
          fromMesLocationId: request.fromMesLocationId ?? undefined,
          toMesLocationId: request.toMesLocationId ?? '',
          movementReason: request.movementReason ?? '',
          movedAt: request.movedAt ?? undefined
        })
      )
    )
  }

  async installMold(request: InstallMoldRequest): Promise<InstallMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toInstallMoldResponse(
        await this.managementService.installMold({
          ...context,
          commandId: request.commandId ?? '',
          productionMoldInstanceId: request.productionMoldInstanceId ?? '',
          workCenterId: request.workCenterId ?? '',
          resourcePositionId: request.resourcePositionId ?? '',
          installedAt: request.installedAt ?? undefined,
          setupSnapshot: request.setupSnapshot ?? undefined,
          operationRef: toDomainExternalRef(request.operationRef),
          routingRef: toDomainExternalRef(request.routingRef),
          workOrderRef: toDomainExternalRef(request.workOrderRef),
          operationTaskRef: toDomainExternalRef(request.operationTaskRef),
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async unmountMold(request: UnmountMoldRequest): Promise<UnmountMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toUnmountMoldResponse(
        await this.managementService.unmountMold({
          ...context,
          commandId: request.commandId ?? '',
          productionMoldInstanceId: request.productionMoldInstanceId ?? '',
          moldInstallationId: request.moldInstallationId ?? undefined,
          unmountedAt: request.unmountedAt ?? undefined,
          nextStatus: toDomainProductionMoldInstanceStatus(request.nextStatus) as never,
          toMesLocationId: request.toMesLocationId ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async recordMoldUsage(request: RecordMoldUsageRequest): Promise<RecordMoldUsageResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toRecordMoldUsageResponse(
        await this.managementService.recordMoldUsage({
          ...context,
          commandId: request.commandId ?? '',
          productionMoldInstanceId: request.productionMoldInstanceId ?? '',
          moldInstallationId: request.moldInstallationId ?? undefined,
          workCenterId: request.workCenterId ?? '',
          resourcePositionId: request.resourcePositionId ?? undefined,
          usageMode: toDomainMoldUsageMode(request.usageMode),
          usedAt: request.usedAt ?? undefined,
          usageQuantity: request.usageQuantity ?? '',
          lifeDelta: request.lifeDelta ?? '',
          lifeUnit: request.lifeUnit ?? '',
          productFamilyRef: toDomainManufacturingMasterDataRef(request.productFamilyRef, 'PRODUCT_FAMILY') ?? null,
          manufacturingSpecRef:
            toDomainManufacturingMasterDataRef(request.manufacturingSpecRef, 'MANUFACTURING_SPEC') ?? null,
          moldDesignOutputId: request.moldDesignOutputId ?? undefined,
          moldDesignOutputOptionId: request.moldDesignOutputOptionId ?? undefined,
          wipUnitRef: toDomainExternalRef(request.wipUnitRef),
          physicalTraceId: request.physicalTraceId ?? undefined,
          workOrderRef: toDomainExternalRef(request.workOrderRef),
          operationTaskRef: toDomainExternalRef(request.operationTaskRef),
          captureSource: request.captureSource ?? '',
          reason: request.reason ?? request.auditContext?.reason ?? undefined
        })
      )
    )
  }

  async adjustMoldLife(request: AdjustMoldLifeRequest): Promise<AdjustMoldLifeResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toAdjustMoldLifeResponse(
        await this.managementService.adjustMoldLife({
          ...context,
          commandId: request.commandId ?? '',
          productionMoldInstanceId: request.productionMoldInstanceId ?? '',
          adjustmentType: toDomainMoldLifeAdjustmentType(request.adjustmentType),
          adjustmentValue: request.adjustmentValue ?? '',
          lifeUnit: request.lifeUnit ?? '',
          authorizationRef: toDomainExternalRef(request.authorizationRef),
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async acknowledgeMoldWarning(request: AcknowledgeMoldWarningRequest): Promise<AcknowledgeMoldWarningResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toAcknowledgeMoldWarningResponse(
        await this.managementService.acknowledgeMoldWarning({
          ...context,
          commandId: request.commandId ?? '',
          moldWarningEventId: request.moldWarningEventId ?? '',
          acknowledgementAction: toDomainMoldWarningAcknowledgementAction(request.acknowledgementAction),
          comment: request.comment ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async scrapMold(request: ScrapMoldRequest): Promise<ScrapMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toScrapMoldResponse(
        await this.managementService.scrapMold({
          ...context,
          commandId: request.commandId ?? '',
          moldResourceType: toDomainMoldResourceType(request.moldResourceType),
          moldResourceId: request.moldResourceId ?? '',
          scrapReason: request.scrapReason ?? '',
          scrappedAt: request.scrappedAt ?? undefined,
          closeCurrentInstallation: request.closeCurrentInstallation ?? false,
          toMesLocationId: request.toMesLocationId ?? undefined
        })
      )
    )
  }

  /** runWithContext bridges validated MES command context into downstream guarded gRPC calls. */
  private runWithContext<T>(
    context: {
      tenantId: string
      operatorContext: {
        operatorId: string
        operatorType: string
        orgId?: string | null
      }
      traceContext: {
        requestId: string
        traceId: string
      }
    },
    work: () => Promise<T>
  ): Promise<T> {
    return this.requestContextStore.run(buildDownstreamRequestContext(context), work)
  }
}

/** buildDownstreamRequestContext signs the local MES runtime context shape for downstream metadata propagation. */
function buildDownstreamRequestContext(context: {
  tenantId: string
  operatorContext: {
    operatorId: string
    operatorType: string
    orgId?: string | null
  }
  traceContext: {
    requestId: string
    traceId: string
  }
}) {
  const issuedAt = new Date()
  return {
    internalServiceName: SERVICE_NAMES.MES,
    requestId: context.traceContext.requestId,
    traceId: context.traceContext.traceId,
    operatorContext: {
      operator_id: context.operatorContext.operatorId,
      operator_type: context.operatorContext.operatorType,
      tenant_id: context.tenantId,
      org_id: context.operatorContext.orgId ?? undefined,
      issued_at: issuedAt.toISOString(),
      expires_at: new Date(issuedAt.getTime() + 5 * 60 * 1000).toISOString(),
      issuer: SERVICE_NAMES.MES,
      signature: 'mes-runtime-context'
    }
  }
}

function toDomainPurchaseRef(value: RegisterMasterMoldRequest['purchaseRef']): PurchaseRefRecord | undefined {
  if (!value || value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_UNSPECIFIED) {
    return undefined
  }
  const purchaseSourceType =
    value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_PURCHASE_ORDER
      ? 'PURCHASE_ORDER'
      : value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_PURCHASE_RECEIPT
        ? 'PURCHASE_RECEIPT'
        : value.purchaseSourceType === ProtoPurchaseSourceType.PURCHASE_SOURCE_TYPE_EXTERNAL_DOCUMENT
          ? 'EXTERNAL_DOCUMENT'
          : 'MANUAL'
  return {
    purchaseSourceType,
    purchaseSourceId: value.purchaseSourceId,
    purchaseNoSnapshot: value.purchaseNoSnapshot
  }
}

function toDomainExternalRef(value: {
  refType?: string
  refId?: string
  refCodeSnapshot?: string
  displayNameSnapshot?: string
} | undefined): ExternalRefRecord | undefined {
  if (!value?.refId || !value.refType) {
    return undefined
  }
  return {
    refType: value.refType,
    refId: value.refId,
    refCodeSnapshot: value.refCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}
