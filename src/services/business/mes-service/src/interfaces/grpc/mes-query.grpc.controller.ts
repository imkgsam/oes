import { Controller, UseFilters } from '@nestjs/common'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetMoldDesignRequest,
  GetMoldDesignResponse,
  GetMoldUsageHistoryRequest,
  GetMoldUsageHistoryResponse,
  GetProductionMoldRequest,
  GetProductionMoldResponse,
  GetToolingCurrentPlacementRequest,
  GetToolingCurrentPlacementResponse,
  ListCurrentMoldsByWorkCenterRequest,
  ListCurrentMoldsByWorkCenterResponse,
  ListMoldDesignsRequest,
  ListMoldDesignsResponse,
  ListMoldLifeCountersRequest,
  ListMoldLifeCountersResponse,
  ListProductionMoldsByDesignRequest,
  ListProductionMoldsByDesignResponse,
  ListProductionMoldsRequest,
  ListProductionMoldsResponse,
  MoldQueryServiceController,
  MoldQueryServiceControllerMethods,
  PrintDailyMoldChecklistRequest,
  PrintDailyMoldChecklistResponse
} from '@oes/common/generated/mes_service'
import { MesMoldQueryService } from '../../application/services/mes-mold-query.service'
import {
  MesGrpcPresenter,
  toDomainMoldDesignStatus,
  toDomainMoldWarningLevel,
  toDomainProductionMoldStatus,
  toDomainToolingType
} from './mes-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** MesQueryGrpcController maps current Mold / Tooling query RPCs into application read use cases. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@MoldQueryServiceControllerMethods()
export class MesQueryGrpcController implements MoldQueryServiceController {
  constructor(private readonly queryService: MesMoldQueryService) {}

  /** getMoldDesign validates the RPC envelope and delegates one mold design lookup. */
  async getMoldDesign(request: GetMoldDesignRequest): Promise<GetMoldDesignResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetMoldDesignResponse(
      await this.queryService.getMoldDesign({
        ...context,
        moldDesignId: request.moldDesignId ?? ''
      })
    )
  }

  /** listMoldDesigns delegates the design selector query with current first-slice filters. */
  async listMoldDesigns(request: ListMoldDesignsRequest): Promise<ListMoldDesignsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListMoldDesignsResponse(
      await this.queryService.listMoldDesigns({
        ...context,
        keyword: request.keyword ?? undefined,
        status: toDomainMoldDesignStatus(request.status),
        productionSpecId: request.productionSpecId ?? undefined,
        itemId: request.itemId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** getProductionMold delegates one production mold lookup. */
  async getProductionMold(request: GetProductionMoldRequest): Promise<GetProductionMoldResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetProductionMoldResponse(
      await this.queryService.getProductionMold({
        ...context,
        productionMoldId: request.productionMoldId ?? ''
      })
    )
  }

  /** listProductionMolds delegates the production mold directory query. */
  async listProductionMolds(request: ListProductionMoldsRequest): Promise<ListProductionMoldsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListProductionMoldsResponse(
      await this.queryService.listProductionMolds({
        ...context,
        moldDesignId: request.moldDesignId ?? undefined,
        status: toDomainProductionMoldStatus(request.status),
        storageResourceId: request.storageResourceId ?? undefined,
        carrierResourceId: request.carrierResourceId ?? undefined,
        warningLevel: toDomainMoldWarningLevel(request.warningLevel),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** listProductionMoldsByDesign delegates one design-scoped production mold query. */
  async listProductionMoldsByDesign(
    request: ListProductionMoldsByDesignRequest
  ): Promise<ListProductionMoldsByDesignResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListProductionMoldsByDesignResponse(
      await this.queryService.listProductionMoldsByDesign({
        ...context,
        moldDesignId: request.moldDesignId ?? '',
        status: toDomainProductionMoldStatus(request.status),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** getToolingCurrentPlacement delegates the current placement projection lookup. */
  async getToolingCurrentPlacement(
    request: GetToolingCurrentPlacementRequest
  ): Promise<GetToolingCurrentPlacementResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetToolingCurrentPlacementResponse(
      await this.queryService.getToolingCurrentPlacement({
        ...context,
        toolingType: toDomainToolingType(request.toolingType),
        toolingId: request.toolingId ?? ''
      })
    )
  }

  /** getMoldUsageHistory delegates the flattened chronological mold history query. */
  async getMoldUsageHistory(request: GetMoldUsageHistoryRequest): Promise<GetMoldUsageHistoryResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetMoldUsageHistoryResponse(
      await this.queryService.getMoldUsageHistory({
        ...context,
        productionMoldId: request.productionMoldId ?? '',
        from: request.from ?? undefined,
        to: request.to ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** listCurrentMoldsByWorkCenter delegates active tooling installations by work center. */
  async listCurrentMoldsByWorkCenter(
    request: ListCurrentMoldsByWorkCenterRequest
  ): Promise<ListCurrentMoldsByWorkCenterResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListCurrentMoldsByWorkCenterResponse(
      await this.queryService.listCurrentMoldsByWorkCenter({
        ...context,
        workCenterId: request.workCenterId ?? '',
        workUnitId: request.workUnitId ?? undefined
      })
    )
  }

  /** listMoldLifeCounters delegates independent life counter pages. */
  async listMoldLifeCounters(request: ListMoldLifeCountersRequest): Promise<ListMoldLifeCountersResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListMoldLifeCountersResponse(
      await this.queryService.listMoldLifeCounters({
        ...context,
        productionMoldId: request.productionMoldId ?? undefined,
        warningLevel: toDomainMoldWarningLevel(request.warningLevel),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** printDailyMoldChecklist delegates a read-only printable checklist query. */
  async printDailyMoldChecklist(
    request: PrintDailyMoldChecklistRequest
  ): Promise<PrintDailyMoldChecklistResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toPrintDailyMoldChecklistResponse(
      await this.queryService.printDailyMoldChecklist({
        ...context,
        workCenterId: request.workCenterId ?? '',
        checklistDate: request.checklistDate ?? ''
      })
    )
  }
}
