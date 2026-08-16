import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor, GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { AuthorizeBusinessRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import {
  ActivateProductionSpecRequest,
  ActivateProductionSpecResponse,
  CreateProductionSpecRequest,
  CreateProductionSpecResponse,
  ProductionSpecManagementServiceController,
  ProductionSpecManagementServiceControllerMethods,
  RetireProductionSpecRequest,
  RetireProductionSpecResponse,
  UpdateProductionSpecRequest,
  UpdateProductionSpecResponse
} from '@oes/common/generated/mes_service'
import { ProductionSpecManagementService } from '../../application/services/production-spec-management.service'
import { ProductionSpecGrpcPresenter, toDomainItemRef } from './production-spec-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** ProductionSpecManagementGrpcController maps the generated ProductionSpec command contract into application use cases. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ProductionSpecManagementServiceControllerMethods()
export class ProductionSpecManagementGrpcController implements ProductionSpecManagementServiceController {
  constructor(
    private readonly managementService: ProductionSpecManagementService,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  /** createProductionSpec validates the RPC envelope and forwards the command payload without domain rules. */
  @AuthorizeBusinessRpc(
    { all: ['mes.production_spec.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async createProductionSpec(
    request: CreateProductionSpecRequest
  ): Promise<CreateProductionSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request, 'CreateProductionSpec')
    return this.runWithContext(context, async () =>
      ProductionSpecGrpcPresenter.toCreateProductionSpecResponse(
        await this.managementService.createProductionSpec({
          ...context,
          commandId: request.commandId ?? '',
          specCode: request.specCode ?? '',
          name: request.name ?? '',
          revisionCode: request.revisionCode ?? undefined,
          supersedesProductionSpecId: request.supersedesProductionSpecId ?? undefined,
          itemRef: toDomainItemRef(request.itemRef) as never,
          effectiveFrom: request.effectiveFrom ?? undefined,
          effectiveTo: request.effectiveTo ?? undefined
        })
      )
    )
  }

  /** updateProductionSpec validates the RPC envelope and forwards mutable fields to the application layer. */
  @AuthorizeBusinessRpc(
    { all: ['mes.production_spec.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async updateProductionSpec(
    request: UpdateProductionSpecRequest
  ): Promise<UpdateProductionSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request, 'UpdateProductionSpec')
    return this.runWithContext(context, async () =>
      ProductionSpecGrpcPresenter.toUpdateProductionSpecResponse(
        await this.managementService.updateProductionSpec({
          ...context,
          commandId: request.commandId ?? '',
          productionSpecId: request.productionSpecId ?? '',
          expectedVersion: request.expectedVersion ?? 0,
          name: request.name ?? undefined,
          itemRef: request.itemRef?.itemId ? toDomainItemRef(request.itemRef) : undefined,
          effectiveFrom: request.effectiveFrom ?? undefined,
          effectiveTo: request.effectiveTo ?? undefined
        })
      )
    )
  }

  /** activateProductionSpec validates the RPC envelope and forwards the lifecycle transition command. */
  @AuthorizeBusinessRpc(
    { all: ['mes.production_spec.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async activateProductionSpec(
    request: ActivateProductionSpecRequest
  ): Promise<ActivateProductionSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(
      request,
      'ActivateProductionSpec'
    )
    return this.runWithContext(context, async () =>
      ProductionSpecGrpcPresenter.toActivateProductionSpecResponse(
        await this.managementService.activateProductionSpec({
          ...context,
          commandId: request.commandId ?? '',
          productionSpecId: request.productionSpecId ?? '',
          expectedVersion: request.expectedVersion ?? 0,
          activatedAt: request.activatedAt ?? undefined
        })
      )
    )
  }

  /** retireProductionSpec validates the RPC envelope and forwards the lifecycle transition command. */
  @AuthorizeBusinessRpc(
    { all: ['mes.production_spec.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async retireProductionSpec(
    request: RetireProductionSpecRequest
  ): Promise<RetireProductionSpecResponse> {
    const context = MesRpcContextValidator.assertManagementContext(request, 'RetireProductionSpec')
    return this.runWithContext(context, async () =>
      ProductionSpecGrpcPresenter.toRetireProductionSpecResponse(
        await this.managementService.retireProductionSpec({
          ...context,
          commandId: request.commandId ?? '',
          productionSpecId: request.productionSpecId ?? '',
          expectedVersion: request.expectedVersion ?? 0,
          retiredAt: request.retiredAt ?? undefined,
          replacementProductionSpecId: request.replacementProductionSpecId ?? undefined
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
