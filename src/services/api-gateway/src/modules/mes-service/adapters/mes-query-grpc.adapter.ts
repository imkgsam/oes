import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetMoldDesignRequest,
  GetMoldDesignResponse,
  GetMoldUsageHistoryRequest,
  GetMoldUsageHistoryResponse,
  GetProductionMoldRequest,
  GetProductionMoldResponse,
  GetProductionSpecRequest,
  GetProductionSpecResponse,
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
  ListProductionSpecsRequest,
  ListProductionSpecsResponse,
  MOLD_QUERY_SERVICE_NAME,
  MoldQueryServiceClient,
  PRODUCTION_SPEC_QUERY_SERVICE_NAME,
  PrintDailyMoldChecklistRequest,
  PrintDailyMoldChecklistResponse,
  ProductionSpecQueryServiceClient,
  ResolveProductionSpecsForMoldRequest,
  ResolveProductionSpecsForMoldResponse
} from '@oes/common/generated/mes_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { buildMesOperatorContext, buildMesTraceContext } from './mes-grpc-context'

const CALLER = 'api-gateway'

/** MesQueryGrpcAdapter proxies current MES query RPCs from api-gateway into mes-service. */
@Injectable()
export class MesQueryGrpcAdapter implements OnModuleInit {
  private productionSpecSvc!: ProductionSpecQueryServiceClient
  private moldSvc!: MoldQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.MES)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  /** onModuleInit resolves the generated MES query service clients. */
  onModuleInit(): void {
    this.productionSpecSvc = this.client.getService<ProductionSpecQueryServiceClient>(
      PRODUCTION_SPEC_QUERY_SERVICE_NAME
    )
    this.moldSvc = this.client.getService<MoldQueryServiceClient>(MOLD_QUERY_SERVICE_NAME)
  }

  /** getProductionSpec forwards one ProductionSpec detail read. */
  getProductionSpec(
    input: Omit<GetProductionSpecRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetProductionSpecResponse> {
    return this.call(
      'getProductionSpec',
      this.productionSpecSvc.getProductionSpec(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listProductionSpecs forwards one ProductionSpec directory read. */
  listProductionSpecs(
    input: Omit<ListProductionSpecsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListProductionSpecsResponse> {
    return this.call(
      'listProductionSpecs',
      this.productionSpecSvc.listProductionSpecs(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** resolveProductionSpecsForMold forwards one mold-facing ProductionSpec resolution query. */
  resolveProductionSpecsForMold(
    input: Omit<ResolveProductionSpecsForMoldRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ResolveProductionSpecsForMoldResponse> {
    return this.call(
      'resolveProductionSpecsForMold',
      this.productionSpecSvc.resolveProductionSpecsForMold(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getMoldDesign forwards one MoldDesign detail read. */
  getMoldDesign(
    input: Omit<GetMoldDesignRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetMoldDesignResponse> {
    return this.call(
      'getMoldDesign',
      this.moldSvc.getMoldDesign(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listMoldDesigns forwards one MoldDesign directory read. */
  listMoldDesigns(
    input: Omit<ListMoldDesignsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListMoldDesignsResponse> {
    return this.call(
      'listMoldDesigns',
      this.moldSvc.listMoldDesigns(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getProductionMold forwards one ProductionMold detail read. */
  getProductionMold(
    input: Omit<GetProductionMoldRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetProductionMoldResponse> {
    return this.call(
      'getProductionMold',
      this.moldSvc.getProductionMold(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listProductionMolds forwards the tenant-wide ProductionMold directory read. */
  listProductionMolds(
    input: Omit<ListProductionMoldsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListProductionMoldsResponse> {
    return this.call(
      'listProductionMolds',
      this.moldSvc.listProductionMolds(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listProductionMoldsByDesign forwards one MoldDesign-scoped ProductionMold directory read. */
  listProductionMoldsByDesign(
    input: Omit<ListProductionMoldsByDesignRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListProductionMoldsByDesignResponse> {
    return this.call(
      'listProductionMoldsByDesign',
      this.moldSvc.listProductionMoldsByDesign(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getToolingCurrentPlacement forwards one current tooling placement query. */
  getToolingCurrentPlacement(
    input: Omit<GetToolingCurrentPlacementRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetToolingCurrentPlacementResponse> {
    return this.call(
      'getToolingCurrentPlacement',
      this.moldSvc.getToolingCurrentPlacement(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getMoldUsageHistory forwards one mold history query. */
  getMoldUsageHistory(
    input: Omit<GetMoldUsageHistoryRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetMoldUsageHistoryResponse> {
    return this.call(
      'getMoldUsageHistory',
      this.moldSvc.getMoldUsageHistory(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listCurrentMoldsByWorkCenter forwards one work-center current mold read. */
  listCurrentMoldsByWorkCenter(
    input: Omit<ListCurrentMoldsByWorkCenterRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListCurrentMoldsByWorkCenterResponse> {
    return this.call(
      'listCurrentMoldsByWorkCenter',
      this.moldSvc.listCurrentMoldsByWorkCenter(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listMoldLifeCounters forwards one mold life counter directory read. */
  listMoldLifeCounters(
    input: Omit<ListMoldLifeCountersRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListMoldLifeCountersResponse> {
    return this.call(
      'listMoldLifeCounters',
      this.moldSvc.listMoldLifeCounters(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** printDailyMoldChecklist forwards one daily checklist read for web-stage checkbox capture. */
  printDailyMoldChecklist(
    input: Omit<PrintDailyMoldChecklistRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<PrintDailyMoldChecklistResponse> {
    return this.call(
      'printDailyMoldChecklist',
      this.moldSvc.printDailyMoldChecklist(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachQueryContext injects the explicit MES operator and trace contexts required by query contracts. */
  private attachQueryContext<TInput extends object>(input: TInput, source: DownstreamRequestSource) {
    return {
      ...input,
      operatorContext: buildMesOperatorContext(source),
      traceContext: buildMesTraceContext(source)
    }
  }

  /** call wraps one gateway MES query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied MES query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
