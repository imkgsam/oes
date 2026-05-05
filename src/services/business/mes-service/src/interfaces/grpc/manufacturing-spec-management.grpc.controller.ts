import { Controller, UseFilters } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ActivateManufacturingSpecRequest,
  ActivateManufacturingSpecResponse,
  CreateManufacturingSpecRequest,
  CreateManufacturingSpecResponse,
  ManufacturingSpecManagementServiceController,
  ManufacturingSpecManagementServiceControllerMethods,
  RetireManufacturingSpecRequest,
  RetireManufacturingSpecResponse,
  UpdateManufacturingSpecRequest,
  UpdateManufacturingSpecResponse
} from '@oes/common/generated/mes_service'
import { ManufacturingSpecManagementService } from '../../application/services/manufacturing-spec-management.service'
import {
  ManufacturingSpecGrpcPresenter,
  toDomainItemRef,
  toDomainManufacturingAttributes,
  toDomainProductFamilyRef,
  toDomainRouteIntentRef
} from './manufacturing-spec-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** ManufacturingSpecManagementGrpcController exposes the phase 1 ManufacturingSpec command contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@ManufacturingSpecManagementServiceControllerMethods()
export class ManufacturingSpecManagementGrpcController implements ManufacturingSpecManagementServiceController {
  constructor(
    private readonly managementService: ManufacturingSpecManagementService,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  async createManufacturingSpec(
    request: CreateManufacturingSpecRequest
  ): Promise<CreateManufacturingSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      ManufacturingSpecGrpcPresenter.toCreateManufacturingSpecResponse(
        await this.managementService.createManufacturingSpec({
          ...context,
          commandId: request.commandId ?? '',
          specCode: request.specCode ?? '',
          name: request.name ?? '',
          revisionCode: request.revisionCode ?? undefined,
          supersedesSpecId: request.supersedesSpecId ?? undefined,
          productFamilyRef: toDomainProductFamilyRef(request.productFamilyRef) as never,
          itemRef: toDomainItemRef(request.itemRef) as never,
          manufacturingAttributes: toDomainManufacturingAttributes(request.manufacturingAttributes),
          routeIntentRef: toDomainRouteIntentRef(request.routeIntentRef),
          effectiveFrom: request.effectiveFrom ?? undefined,
          effectiveTo: request.effectiveTo ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async updateManufacturingSpec(
    request: UpdateManufacturingSpecRequest
  ): Promise<UpdateManufacturingSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      ManufacturingSpecGrpcPresenter.toUpdateManufacturingSpecResponse(
        await this.managementService.updateManufacturingSpec({
          ...context,
          commandId: request.commandId ?? '',
          manufacturingSpecId: request.manufacturingSpecId ?? '',
          expectedVersion: request.expectedVersion ? request.expectedVersion : undefined,
          name: request.name ?? undefined,
          productFamilyRef: request.productFamilyRef?.refId
            ? (toDomainProductFamilyRef(request.productFamilyRef) as never)
            : undefined,
          itemRef: request.itemRef?.itemId ? (toDomainItemRef(request.itemRef) as never) : undefined,
          manufacturingAttributes:
            request.manufacturingAttributes && request.manufacturingAttributes.length > 0
              ? toDomainManufacturingAttributes(request.manufacturingAttributes)
              : undefined,
          routeIntentRef: toDomainRouteIntentRef(request.routeIntentRef),
          effectiveFrom: request.effectiveFrom ?? undefined,
          effectiveTo: request.effectiveTo ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async activateManufacturingSpec(
    request: ActivateManufacturingSpecRequest
  ): Promise<ActivateManufacturingSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      ManufacturingSpecGrpcPresenter.toActivateManufacturingSpecResponse(
        await this.managementService.activateManufacturingSpec({
          ...context,
          commandId: request.commandId ?? '',
          manufacturingSpecId: request.manufacturingSpecId ?? '',
          expectedVersion: request.expectedVersion ? request.expectedVersion : undefined,
          activatedAt: request.activatedAt ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
        })
      )
    )
  }

  async retireManufacturingSpec(
    request: RetireManufacturingSpecRequest
  ): Promise<RetireManufacturingSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, async () =>
      ManufacturingSpecGrpcPresenter.toRetireManufacturingSpecResponse(
        await this.managementService.retireManufacturingSpec({
          ...context,
          commandId: request.commandId ?? '',
          manufacturingSpecId: request.manufacturingSpecId ?? '',
          expectedVersion: request.expectedVersion ? request.expectedVersion : undefined,
          retiredAt: request.retiredAt ?? undefined,
          replacementSpecId: request.replacementSpecId ?? undefined,
          reason: request.reason ?? request.auditContext?.reason ?? ''
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
