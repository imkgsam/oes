import { Controller, UseFilters } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AdjustMoldLifeCounterRequest,
  AdjustMoldLifeCounterResponse,
  InstallToolingRequest,
  InstallToolingResponse,
  MoldManagementServiceController,
  MoldManagementServiceControllerMethods,
  MoveToolingRequest,
  MoveToolingResponse,
  RecordMoldUsageRequest,
  RecordMoldUsageResponse,
  RegisterMasterMoldRequest,
  RegisterMasterMoldResponse,
  RegisterMoldDesignRequest,
  RegisterMoldDesignResponse,
  RegisterProductionMoldRequest,
  RegisterProductionMoldResponse,
  ScrapProductionMoldRequest,
  ScrapProductionMoldResponse,
  UnmountToolingRequest,
  UnmountToolingResponse
} from '@oes/common/generated/mes_service'
import { MesMoldManagementService } from '../../application/services/mes-mold-management.service'
import {
  MesGrpcPresenter,
  toDomainCarrierResourceRef,
  toDomainMoldDesignOutputKind,
  toDomainMoldFunctionRole,
  toDomainMoldLifeAdjustmentType,
  toDomainMoldOutputStructureType,
  toDomainProductionSpecRef,
  toDomainPurchaseRef,
  toDomainStorageResourceRef,
  toDomainSupplierRef,
  toDomainToolingType,
  toDomainTraceSubjectRef,
  toDomainWorkCenterRef,
  toDomainWorkUnitRef
} from './mes-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** MesManagementGrpcController maps current Mold / Tooling command RPCs into application use cases. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@MoldManagementServiceControllerMethods()
export class MesManagementGrpcController implements MoldManagementServiceController {
  constructor(
    private readonly managementService: MesMoldManagementService,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  /** registerMoldDesign validates the RPC envelope and forwards mold design data to the application layer. */
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
          supersedesMoldDesignId: request.supersedesMoldDesignId ?? undefined,
          itemRef: request.itemRef?.itemId
            ? {
                itemId: request.itemRef.itemId,
                itemCodeSnapshot: request.itemRef.itemCodeSnapshot,
                itemNameSnapshot: request.itemRef.itemNameSnapshot
              }
            : undefined,
          productionSpecRefs: (request.productionSpecRefs ?? [])
            .map((ref) => toDomainProductionSpecRef(ref))
            .filter((ref): ref is NonNullable<typeof ref> => !!ref),
          materialType: request.materialType ?? '',
          functionRole: toDomainMoldFunctionRole(request.functionRole),
          productionMethodTags: request.productionMethodTags ?? [],
          outputStructureType: toDomainMoldOutputStructureType(request.outputStructureType),
          outputs: (request.outputs ?? []).map((output) => ({
            sequenceNo: output.sequenceNo ?? 0,
            outputCode: output.outputCode ?? '',
            outputKind: toDomainMoldDesignOutputKind(output.outputKind),
            productionSpecRef: toDomainProductionSpecRef(output.productionSpecRef) ?? null,
            quantityPerUse: output.quantityPerUse ?? '',
            componentRole: output.componentRole ?? undefined,
            assemblyHint: output.assemblyHint ?? undefined,
            isPrimaryOutput: output.isPrimaryOutput ?? false,
            options: (output.options ?? []).map((option) => ({
              moldDesignOutputOptionId: option.moldDesignOutputOptionId ?? undefined,
              optionCode: option.optionCode ?? '',
              label: option.label ?? '',
              productionSpecRef: toDomainProductionSpecRef(option.productionSpecRef) ?? null,
              quantityPerUse: option.quantityPerUse ?? undefined,
              isDefault: option.isDefault ?? false
            }))
          })),
          defaultLifeLimit: request.defaultLifeLimit ?? undefined,
          defaultLifeUnit: request.defaultLifeUnit ?? undefined
        })
      )
    )
  }

  /** registerMasterMold forwards master mold registration without inventing MES domain rules in gRPC. */
  async registerMasterMold(request: RegisterMasterMoldRequest): Promise<RegisterMasterMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toRegisterMasterMoldResponse(
        await this.managementService.registerMasterMold({
          ...context,
          commandId: request.commandId ?? '',
          masterMoldCode: request.masterMoldCode ?? '',
          moldDesignId: request.moldDesignId ?? '',
          supplierRef: toDomainSupplierRef(request.supplierRef),
          purchaseRef: toDomainPurchaseRef(request.purchaseRef),
          receivedAt: request.receivedAt ?? undefined,
          initialStorageResourceRef: toDomainStorageResourceRef(request.initialStorageResourceRef),
          initialCarrierResourceRef: toDomainCarrierResourceRef(request.initialCarrierResourceRef),
          qualitySummary: request.qualitySummary ?? undefined,
          notes: request.notes ?? undefined
        })
      )
    )
  }

  /** registerProductionMold forwards production mold registration into the mold application service. */
  async registerProductionMold(request: RegisterProductionMoldRequest): Promise<RegisterProductionMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toRegisterProductionMoldResponse(
        await this.managementService.registerProductionMold({
          ...context,
          commandId: request.commandId ?? '',
          moldCode: request.moldCode ?? '',
          moldDesignId: request.moldDesignId ?? '',
          sourceMasterMoldId: request.sourceMasterMoldId ?? undefined,
          supplierRef: toDomainSupplierRef(request.supplierRef),
          purchaseRef: toDomainPurchaseRef(request.purchaseRef),
          receivedAt: request.receivedAt ?? undefined,
          acceptedAt: request.acceptedAt ?? undefined,
          initialStorageResourceRef: toDomainStorageResourceRef(request.initialStorageResourceRef),
          initialCarrierResourceRef: toDomainCarrierResourceRef(request.initialCarrierResourceRef)
        })
      )
    )
  }

  /** moveTooling forwards storage or carrier placement changes into the application layer. */
  async moveTooling(request: MoveToolingRequest): Promise<MoveToolingResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toMoveToolingResponse(
        await this.managementService.moveTooling({
          ...context,
          commandId: request.commandId ?? '',
          toolingType: toDomainToolingType(request.toolingType),
          toolingId: request.toolingId ?? '',
          toStorageResourceRef: toDomainStorageResourceRef(request.toStorageResourceRef),
          toCarrierResourceRef: toDomainCarrierResourceRef(request.toCarrierResourceRef),
          movementReason: request.movementReason ?? undefined,
          movedAt: request.movedAt ?? undefined
        })
      )
    )
  }

  /** installTooling forwards one tooling installation interval start into the application layer. */
  async installTooling(request: InstallToolingRequest): Promise<InstallToolingResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toInstallToolingResponse(
        await this.managementService.installTooling({
          ...context,
          commandId: request.commandId ?? '',
          toolingType: toDomainToolingType(request.toolingType),
          toolingId: request.toolingId ?? '',
          workCenterRef: toDomainWorkCenterRef(request.workCenterRef) as never,
          workUnitRef: toDomainWorkUnitRef(request.workUnitRef),
          installedAt: request.installedAt ?? undefined,
          moldPosition: request.moldPosition ?? undefined,
          cavityPosition: request.cavityPosition ?? undefined,
          cavityMapping: request.cavityMapping ?? undefined,
          setupParameters: request.setupParameters ?? undefined
        })
      )
    )
  }

  /** unmountTooling forwards one tooling installation interval close into the application layer. */
  async unmountTooling(request: UnmountToolingRequest): Promise<UnmountToolingResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toUnmountToolingResponse(
        await this.managementService.unmountTooling({
          ...context,
          commandId: request.commandId ?? '',
          toolingInstallationId: request.toolingInstallationId ?? '',
          unmountedAt: request.unmountedAt ?? undefined
        })
      )
    )
  }

  /** recordMoldUsage forwards append-only usage and life counter facts into the application layer. */
  async recordMoldUsage(request: RecordMoldUsageRequest): Promise<RecordMoldUsageResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toRecordMoldUsageResponse(
        await this.managementService.recordMoldUsage({
          ...context,
          commandId: request.commandId ?? '',
          productionMoldId: request.productionMoldId ?? '',
          toolingInstallationId: request.toolingInstallationId ?? undefined,
          workCenterRef: toDomainWorkCenterRef(request.workCenterRef) as never,
          workUnitRef: toDomainWorkUnitRef(request.workUnitRef),
          usedAt: request.usedAt ?? undefined,
          usageQuantity: request.usageQuantity ?? '',
          lifeDelta: request.lifeDelta ?? '',
          lifeUnit: request.lifeUnit ?? '',
          productionSpecRef: toDomainProductionSpecRef(request.productionSpecRef),
          productionUnitRef: request.productionUnitRef?.productionUnitId
            ? {
                productionUnitId: request.productionUnitRef.productionUnitId,
                unitCodeSnapshot: request.productionUnitRef.unitCodeSnapshot,
                displayNameSnapshot: request.productionUnitRef.displayNameSnapshot
              }
            : undefined,
          traceSubjectRef: toDomainTraceSubjectRef(request.traceSubjectRef),
          captureSource: request.captureSource ?? undefined,
          moldDesignOutputId: request.moldDesignOutputId ?? undefined,
          moldDesignOutputOptionId: request.moldDesignOutputOptionId ?? undefined
        })
      )
    )
  }

  /** adjustMoldLifeCounter forwards authorized life counter corrections into the application layer. */
  async adjustMoldLifeCounter(
    request: AdjustMoldLifeCounterRequest
  ): Promise<AdjustMoldLifeCounterResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toAdjustMoldLifeCounterResponse(
        await this.managementService.adjustMoldLifeCounter({
          ...context,
          commandId: request.commandId ?? '',
          moldLifeCounterId: request.moldLifeCounterId ?? '',
          adjustmentType: toDomainMoldLifeAdjustmentType(request.adjustmentType),
          value: request.value ?? ''
        })
      )
    )
  }

  /** scrapProductionMold forwards the terminal production mold lifecycle command. */
  async scrapProductionMold(request: ScrapProductionMoldRequest): Promise<ScrapProductionMoldResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      MesGrpcPresenter.toScrapProductionMoldResponse(
        await this.managementService.scrapProductionMold({
          ...context,
          commandId: request.commandId ?? '',
          productionMoldId: request.productionMoldId ?? '',
          scrappedAt: request.scrappedAt ?? undefined
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
