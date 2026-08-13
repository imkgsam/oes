import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { AuthorizeBusinessRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import {
  GetMoldDesignRequest,
  GetMoldDesignResponse,
  GetMoldUsageHistoryRequest,
  GetMoldUsageHistoryResponse,
  GetMasterMoldRequest,
  GetMasterMoldResponse,
  GetProductionMoldRequest,
  GetProductionMoldResponse,
  GetToolingCurrentPlacementRequest,
  GetToolingCurrentPlacementResponse,
  ListCurrentMoldsByWorkCenterRequest,
  ListCurrentMoldsByWorkCenterResponse,
  ListMasterMoldsRequest,
  ListMasterMoldsResponse,
  ListMoldDesignsRequest,
  ListMoldDesignsResponse,
  ListMoldLifeCountersRequest,
  ListMoldLifeCountersResponse,
  ListProductionMoldsByDesignRequest,
  ListProductionMoldsByDesignResponse,
  ListProductionMoldsRequest,
  ListProductionMoldsResponse,
  MoldQueryServiceController,
  MoldQueryServiceControllerMethods
} from '@oes/common/generated/mes_service'
import { MesMoldQueryService } from '../../application/services/mes-mold-query.service'
import {
  MesGrpcPresenter,
  toDomainMasterMoldStatus,
  toDomainMoldDesignStatus,
  toDomainMoldWarningLevel,
  toDomainProductionMoldStatus,
  toDomainToolingType
} from './mes-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** MesQueryGrpcController maps current Mold / Tooling query RPCs into application read use cases. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@MoldQueryServiceControllerMethods()
export class MesQueryGrpcController implements MoldQueryServiceController {
  constructor(private readonly queryService: MesMoldQueryService) {}

  /** getMoldDesign validates the RPC envelope and delegates one mold design lookup. */
  @AuthorizeBusinessRpc({ all: ['mes.mold_design.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
  @AuthorizeBusinessRpc({ all: ['mes.mold_design.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
  async listMoldDesigns(request: ListMoldDesignsRequest): Promise<ListMoldDesignsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListMoldDesignsResponse(
      await this.queryService.listMoldDesigns({
        ...context,
        keyword: request.keyword ?? undefined,
        status: toDomainMoldDesignStatus(request.status),
        productionSpecId: request.productionSpecId ?? undefined,
        itemModelId: request.itemModelId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** getMasterMold delegates one master mold lookup. */
  @AuthorizeBusinessRpc({ all: ['mes.production_mold.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
  async getMasterMold(request: GetMasterMoldRequest): Promise<GetMasterMoldResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetMasterMoldResponse(
      await this.queryService.getMasterMold({
        ...context,
        masterMoldId: request.masterMoldId ?? ''
      })
    )
  }

  /** listMasterMolds delegates the master mold directory query. */
  @AuthorizeBusinessRpc({ all: ['mes.production_mold.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
  async listMasterMolds(request: ListMasterMoldsRequest): Promise<ListMasterMoldsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListMasterMoldsResponse(
      await this.queryService.listMasterMolds({
        ...context,
        keyword: request.keyword ?? undefined,
        moldDesignId: request.moldDesignId ?? undefined,
        status: toDomainMasterMoldStatus(request.status),
        storageResourceId: request.storageResourceId ?? undefined,
        carrierResourceId: request.carrierResourceId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  /** getProductionMold delegates one production mold lookup. */
  @AuthorizeBusinessRpc({ all: ['mes.production_mold.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
  @AuthorizeBusinessRpc({ all: ['mes.production_mold.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
  @AuthorizeBusinessRpc({ all: ['mes.production_mold.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
  @AuthorizeBusinessRpc({ all: ['mes.tooling_installation.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
  @AuthorizeBusinessRpc({ all: ['mes.production_mold.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
  @AuthorizeBusinessRpc({ all: ['mes.tooling_installation.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
  @AuthorizeBusinessRpc({ all: ['mes.production_mold.read'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })
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
}
