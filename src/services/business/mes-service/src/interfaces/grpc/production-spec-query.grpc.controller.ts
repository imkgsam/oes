import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { AuthorizeBusinessRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import {
  GetProductionSpecRequest,
  GetProductionSpecResponse,
  ListProductionSpecsRequest,
  ListProductionSpecsResponse,
  ProductionSpecQueryServiceController,
  ProductionSpecQueryServiceControllerMethods,
  ResolveProductionSpecsForMoldRequest,
  ResolveProductionSpecsForMoldResponse
} from '@oes/common/generated/mes_service'
import { ProductionSpecQueryService } from '../../application/services/production-spec-query.service'
import {
  ProductionSpecGrpcPresenter,
  toDomainProductionSpecStatus
} from './production-spec-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** ProductionSpecQueryGrpcController maps generated ProductionSpec read requests into application queries. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@ProductionSpecQueryServiceControllerMethods()
export class ProductionSpecQueryGrpcController implements ProductionSpecQueryServiceController {
  constructor(private readonly queryService: ProductionSpecQueryService) {}

  /** getProductionSpec validates the RPC envelope and delegates a single-record lookup. */
  @AuthorizeBusinessRpc({ all: ['mes.production_spec.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
  async getProductionSpec(request: GetProductionSpecRequest): Promise<GetProductionSpecResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return ProductionSpecGrpcPresenter.toGetProductionSpecResponse(
      await this.queryService.getProductionSpec({
        ...context,
        productionSpecId: request.productionSpecId ?? ''
      })
    )
  }

  /** listProductionSpecs validates filters and delegates the paged selector query. */
  @AuthorizeBusinessRpc({ all: ['mes.production_spec.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
  async listProductionSpecs(request: ListProductionSpecsRequest): Promise<ListProductionSpecsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return ProductionSpecGrpcPresenter.toListProductionSpecsResponse(
      await this.queryService.listProductionSpecs({
        ...context,
        keyword: request.keyword ?? undefined,
        itemId: request.itemId ?? undefined,
        status: toDomainProductionSpecStatus(request.status),
        includeRetired: request.includeRetired ?? false,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** resolveProductionSpecsForMold delegates active/visible spec resolution for mold design usage. */
  @AuthorizeBusinessRpc({ all: ['mes.production_spec.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
  async resolveProductionSpecsForMold(
    request: ResolveProductionSpecsForMoldRequest
  ): Promise<ResolveProductionSpecsForMoldResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return ProductionSpecGrpcPresenter.toResolveProductionSpecsForMoldResponse(
      await this.queryService.resolveProductionSpecsForMold({
        ...context,
        productionSpecIds: request.productionSpecIds ?? [],
        moldDesignId: request.moldDesignId ?? undefined
      })
    )
  }
}
