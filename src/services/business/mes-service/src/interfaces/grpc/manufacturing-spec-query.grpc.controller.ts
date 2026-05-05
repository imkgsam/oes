import { Controller, UseFilters } from '@nestjs/common'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetManufacturingSpecRequest,
  GetManufacturingSpecResponse,
  ListManufacturingSpecsRequest,
  ListManufacturingSpecsResponse,
  ManufacturingSpecQueryServiceController,
  ManufacturingSpecQueryServiceControllerMethods,
  ResolveManufacturingSpecsForMoldRequest,
  ResolveManufacturingSpecsForMoldResponse
} from '@oes/common/generated/mes_service'
import { ManufacturingSpecQueryService } from '../../application/services/manufacturing-spec-query.service'
import {
  ManufacturingSpecGrpcPresenter,
  toDomainManufacturingAttributes,
  toDomainManufacturingSpecStatus
} from './manufacturing-spec-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** ManufacturingSpecQueryGrpcController exposes the phase 1 ManufacturingSpec read-only contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@ManufacturingSpecQueryServiceControllerMethods()
export class ManufacturingSpecQueryGrpcController implements ManufacturingSpecQueryServiceController {
  constructor(private readonly queryService: ManufacturingSpecQueryService) {}

  async getManufacturingSpec(request: GetManufacturingSpecRequest): Promise<GetManufacturingSpecResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return ManufacturingSpecGrpcPresenter.toGetManufacturingSpecResponse(
      await this.queryService.getManufacturingSpec({
        ...context,
        manufacturingSpecId: request.manufacturingSpecId ?? ''
      })
    )
  }

  async listManufacturingSpecs(
    request: ListManufacturingSpecsRequest
  ): Promise<ListManufacturingSpecsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return ManufacturingSpecGrpcPresenter.toListManufacturingSpecsResponse(
      await this.queryService.listManufacturingSpecs({
        ...context,
        keyword: request.keyword ?? undefined,
        productFamilyRefId: request.productFamilyRefId ?? undefined,
        itemId: request.itemId ?? undefined,
        attributeFilters: toDomainManufacturingAttributes(request.attributeFilters),
        status: toDomainManufacturingSpecStatus(request.status),
        includeRetired: request.includeRetired ?? false,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  async resolveManufacturingSpecsForMold(
    request: ResolveManufacturingSpecsForMoldRequest
  ): Promise<ResolveManufacturingSpecsForMoldResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return ManufacturingSpecGrpcPresenter.toResolveManufacturingSpecsForMoldResponse(
      await this.queryService.resolveManufacturingSpecsForMold({
        ...context,
        moldDesignId: request.moldDesignId ?? undefined,
        productFamilyRefId: request.productFamilyRefId ?? undefined,
        itemId: request.itemId ?? undefined,
        manufacturingSpecIds: request.manufacturingSpecIds ?? [],
        includeRetired: request.includeRetired ?? false
      })
    )
  }
}
