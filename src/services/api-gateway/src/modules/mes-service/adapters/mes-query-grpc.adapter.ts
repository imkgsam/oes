import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetMoldDesignRequest,
  GetMoldDesignResponse,
  GetMoldUsageHistoryRequest,
  GetMoldUsageHistoryResponse,
  GetMasterMoldRequest,
  GetMasterMoldResponse,
  GetProductionMoldRequest,
  GetProductionMoldResponse,
  GetProductionSpecRequest,
  GetProductionSpecResponse,
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
  ListProductionSpecsRequest,
  ListProductionSpecsResponse,
  MOLD_QUERY_SERVICE_NAME,
  MoldQueryServiceClient,
  PRODUCTION_SPEC_QUERY_SERVICE_NAME,
  ProductionSpecQueryServiceClient,
  ResolveProductionSpecsForMoldRequest,
  ResolveProductionSpecsForMoldResponse
} from '@oes/common/generated/mes_service'

import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { GatewayMesGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'

const CALLER = 'api-gateway'

/** MesQueryGrpcAdapter proxies current MES query RPCs from api-gateway into mes-service. */
@Injectable()
export class MesQueryGrpcAdapter implements OnModuleInit {
  private productionSpecSvc!: ProductionSpecQueryServiceClient
  private moldSvc!: MoldQueryServiceClient

  constructor(
    private readonly client: GatewayMesGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  /** onModuleInit resolves the generated MES query service clients. */
  onModuleInit(): void {
    this.productionSpecSvc = this.client.getClient().getService<ProductionSpecQueryServiceClient>(
      PRODUCTION_SPEC_QUERY_SERVICE_NAME
    )
    this.moldSvc = this.client.getClient().getService<MoldQueryServiceClient>(MOLD_QUERY_SERVICE_NAME)
  }

  /** getProductionSpec forwards one ProductionSpec detail read. */
  async getProductionSpec(
    input: Omit<GetProductionSpecRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetProductionSpecResponse> {
    return this.call(
      'getProductionSpec',
      this.productionSpecSvc.getProductionSpec(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_spec.read'])
      )
    )
  }

  /** listProductionSpecs forwards one ProductionSpec directory read. */
  async listProductionSpecs(
    input: Omit<ListProductionSpecsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListProductionSpecsResponse> {
    return this.call(
      'listProductionSpecs',
      this.productionSpecSvc.listProductionSpecs(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_spec.read'])
      )
    )
  }

  /** resolveProductionSpecsForMold forwards one mold-facing ProductionSpec resolution query. */
  async resolveProductionSpecsForMold(
    input: Omit<ResolveProductionSpecsForMoldRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ResolveProductionSpecsForMoldResponse> {
    return this.call(
      'resolveProductionSpecsForMold',
      this.productionSpecSvc.resolveProductionSpecsForMold(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_spec.read'])
      )
    )
  }

  /** getMoldDesign forwards one MoldDesign detail read. */
  async getMoldDesign(
    input: Omit<GetMoldDesignRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetMoldDesignResponse> {
    return this.call(
      'getMoldDesign',
      this.moldSvc.getMoldDesign(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.mold_design.read'])
      )
    )
  }

  /** listMoldDesigns forwards one MoldDesign directory read. */
  async listMoldDesigns(
    input: Omit<ListMoldDesignsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListMoldDesignsResponse> {
    return this.call(
      'listMoldDesigns',
      this.moldSvc.listMoldDesigns(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.mold_design.read'])
      )
    )
  }

  /** getMasterMold forwards one MasterMold detail read. */
  async getMasterMold(
    input: Omit<GetMasterMoldRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetMasterMoldResponse> {
    return this.call(
      'getMasterMold',
      this.moldSvc.getMasterMold(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_mold.read'])
      )
    )
  }

  /** listMasterMolds forwards one MasterMold directory read. */
  async listMasterMolds(
    input: Omit<ListMasterMoldsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListMasterMoldsResponse> {
    return this.call(
      'listMasterMolds',
      this.moldSvc.listMasterMolds(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_mold.read'])
      )
    )
  }

  /** getProductionMold forwards one ProductionMold detail read. */
  async getProductionMold(
    input: Omit<GetProductionMoldRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetProductionMoldResponse> {
    return this.call(
      'getProductionMold',
      this.moldSvc.getProductionMold(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_mold.read'])
      )
    )
  }

  /** listProductionMolds forwards the tenant-wide ProductionMold directory read. */
  async listProductionMolds(
    input: Omit<ListProductionMoldsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListProductionMoldsResponse> {
    return this.call(
      'listProductionMolds',
      this.moldSvc.listProductionMolds(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_mold.read'])
      )
    )
  }

  /** listProductionMoldsByDesign forwards one MoldDesign-scoped ProductionMold directory read. */
  async listProductionMoldsByDesign(
    input: Omit<ListProductionMoldsByDesignRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListProductionMoldsByDesignResponse> {
    return this.call(
      'listProductionMoldsByDesign',
      this.moldSvc.listProductionMoldsByDesign(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_mold.read'])
      )
    )
  }

  /** getToolingCurrentPlacement forwards one current tooling placement query. */
  async getToolingCurrentPlacement(
    input: Omit<GetToolingCurrentPlacementRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetToolingCurrentPlacementResponse> {
    return this.call(
      'getToolingCurrentPlacement',
      this.moldSvc.getToolingCurrentPlacement(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.tooling_installation.read'])
      )
    )
  }

  /** getMoldUsageHistory forwards one mold history query. */
  async getMoldUsageHistory(
    input: Omit<GetMoldUsageHistoryRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetMoldUsageHistoryResponse> {
    return this.call(
      'getMoldUsageHistory',
      this.moldSvc.getMoldUsageHistory(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_mold.read'])
      )
    )
  }

  /** listCurrentMoldsByWorkCenter forwards one work-center current mold read. */
  async listCurrentMoldsByWorkCenter(
    input: Omit<ListCurrentMoldsByWorkCenterRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListCurrentMoldsByWorkCenterResponse> {
    return this.call(
      'listCurrentMoldsByWorkCenter',
      this.moldSvc.listCurrentMoldsByWorkCenter(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.tooling_installation.read'])
      )
    )
  }

  /** listMoldLifeCounters forwards one mold life counter directory read. */
  async listMoldLifeCounters(
    input: Omit<ListMoldLifeCountersRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListMoldLifeCountersResponse> {
    return this.call(
      'listMoldLifeCounters',
      this.moldSvc.listMoldLifeCounters(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['mes.production_mold.read'])
      )
    )
  }

  /** attachQueryContext injects the explicit MES operator and trace contexts required by query contracts. */
  private attachQueryContext<TInput extends object>(input: TInput, _source: DownstreamRequestSource) { return input }

  private metadata(source: DownstreamRequestSource, codes: string[]) { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:mes-service', codes) }

  /** call wraps one gateway MES query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied MES query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
