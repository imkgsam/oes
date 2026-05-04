import { Controller, UseFilters } from '@nestjs/common'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetMoldCurrentLocationRequest,
  GetMoldCurrentLocationResponse,
  GetMoldDesignRequest,
  GetMoldDesignResponse,
  GetMoldUsageHistoryRequest,
  GetMoldUsageHistoryResponse,
  GetProductionMoldInstanceRequest,
  GetProductionMoldInstanceResponse,
  ListCurrentMoldsByWorkCenterRequest,
  ListCurrentMoldsByWorkCenterResponse,
  ListMoldDesignsRequest,
  ListMoldDesignsResponse,
  ListMoldInstancesByDesignRequest,
  ListMoldInstancesByDesignResponse,
  ListMoldLifeWarningsRequest,
  ListMoldLifeWarningsResponse,
  MoldQueryServiceController,
  MoldQueryServiceControllerMethods,
  PrintDailyMoldChecklistRequest,
  PrintDailyMoldChecklistResponse
} from '@oes/common/generated/mes_service'
import { MesMoldQueryService } from '../../application/services/mes-mold-query.service'
import {
  MesGrpcPresenter,
  toDomainMoldResourceType,
  toDomainMoldUsageHistoryEntryType,
  toDomainMoldWarningLevel,
  toDomainMoldWarningStatus,
  toDomainMoldWarningType,
  toDomainProductionMoldInstanceStatus
} from './mes-grpc.presenter'
import { MesRpcContextValidator } from './mes-rpc-context.validator'

/** MesQueryGrpcController exposes the phase 1 read-only MES mold query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@MoldQueryServiceControllerMethods()
export class MesQueryGrpcController implements MoldQueryServiceController {
  constructor(private readonly queryService: MesMoldQueryService) {}

  async getMoldDesign(request: GetMoldDesignRequest): Promise<GetMoldDesignResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetMoldDesignResponse(
      await this.queryService.getMoldDesign({
        ...context,
        moldDesignId: request.moldDesignId ?? ''
      })
    )
  }

  async listMoldDesigns(request: ListMoldDesignsRequest): Promise<ListMoldDesignsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListMoldDesignsResponse(
      await this.queryService.listMoldDesigns({
        ...context,
        keyword: request.keyword ?? undefined,
        productFamilyRefId: request.productFamilyRefId ?? undefined,
        manufacturingSpecRefId: request.manufacturingSpecRefId ?? undefined,
        itemId: request.itemId ?? undefined,
        materialType: request.materialType ?? undefined,
        functionRole: request.functionRole ? String(request.functionRole) : undefined,
        productionMethodTag: request.productionMethodTag ?? undefined,
        status: request.status ? String(request.status) : undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  async getProductionMoldInstance(
    request: GetProductionMoldInstanceRequest
  ): Promise<GetProductionMoldInstanceResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetProductionMoldInstanceResponse(
      await this.queryService.getProductionMoldInstance({
        ...context,
        productionMoldInstanceId: request.productionMoldInstanceId ?? ''
      })
    )
  }

  async listMoldInstancesByDesign(
    request: ListMoldInstancesByDesignRequest
  ): Promise<ListMoldInstancesByDesignResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListMoldInstancesByDesignResponse(
      await this.queryService.listMoldInstancesByDesign({
        ...context,
        moldDesignId: request.moldDesignId ?? '',
        status: toDomainProductionMoldInstanceStatus(request.status),
        warningLevel: toDomainMoldWarningLevel(request.warningLevel),
        supplierId: request.supplierId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  async getMoldCurrentLocation(request: GetMoldCurrentLocationRequest): Promise<GetMoldCurrentLocationResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetMoldCurrentLocationResponse(
      await this.queryService.getMoldCurrentLocation({
        ...context,
        moldResourceType: toDomainMoldResourceType(request.moldResourceType),
        moldResourceId: request.moldResourceId ?? ''
      })
    )
  }

  async getMoldUsageHistory(request: GetMoldUsageHistoryRequest): Promise<GetMoldUsageHistoryResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toGetMoldUsageHistoryResponse(
      await this.queryService.getMoldUsageHistory({
        ...context,
        productionMoldInstanceId: request.productionMoldInstanceId ?? '',
        entryTypes: (request.entryTypes ?? []).map(toDomainMoldUsageHistoryEntryType),
        occurredFrom: request.occurredFrom ?? undefined,
        occurredTo: request.occurredTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  async listCurrentMoldsByWorkCenter(
    request: ListCurrentMoldsByWorkCenterRequest
  ): Promise<ListCurrentMoldsByWorkCenterResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListCurrentMoldsByWorkCenterResponse(
      await this.queryService.listCurrentMoldsByWorkCenter({
        ...context,
        workCenterId: request.workCenterId ?? '',
        includeChildWorkCenters: request.includeChildWorkCenters ?? false,
        warningLevel: toDomainMoldWarningLevel(request.warningLevel),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  async listMoldLifeWarnings(request: ListMoldLifeWarningsRequest): Promise<ListMoldLifeWarningsResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toListMoldLifeWarningsResponse(
      await this.queryService.listMoldLifeWarnings({
        ...context,
        status: toDomainMoldWarningStatus(request.status),
        warningType: toDomainMoldWarningType(request.warningType),
        warningLevel: toDomainMoldWarningLevel(request.warningLevel),
        workCenterId: request.workCenterId ?? undefined,
        moldDesignId: request.moldDesignId ?? undefined,
        raisedFrom: request.raisedFrom ?? undefined,
        raisedTo: request.raisedTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
  }

  async printDailyMoldChecklist(
    request: PrintDailyMoldChecklistRequest
  ): Promise<PrintDailyMoldChecklistResponse> {
    const context = MesRpcContextValidator.assertQueryContext(request)
    return MesGrpcPresenter.toPrintDailyMoldChecklistResponse(
      await this.queryService.printDailyMoldChecklist({
        ...context,
        workCenterIds: request.workCenterIds ?? [],
        checklistDate: request.checklistDate ?? '',
        includeChildWorkCenters: request.includeChildWorkCenters ?? false,
        includeWarnings: request.includeWarnings ?? false,
        includeRecentUsage: request.includeRecentUsage ?? false,
        operatorId: context.operatorContext.operatorId
      })
    )
  }
}
