import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetManufacturingSpecRequest,
  GetManufacturingSpecResponse,
  GetMoldDesignRequest,
  GetMoldDesignResponse,
  GetProductionMoldInstanceRequest,
  GetProductionMoldInstanceResponse,
  ListCurrentMoldsByWorkCenterRequest,
  ListCurrentMoldsByWorkCenterResponse,
  ListManufacturingSpecsRequest,
  ListManufacturingSpecsResponse,
  ListMoldDesignsRequest,
  ListMoldDesignsResponse,
  ListMoldInstancesByDesignRequest,
  ListMoldInstancesByDesignResponse,
  ListMoldLifeWarningsRequest,
  ListMoldLifeWarningsResponse,
  ListProductionMoldInstancesRequest,
  ListProductionMoldInstancesResponse,
  ListWorkCentersRequest,
  ListWorkCentersResponse,
  MANUFACTURING_SPEC_QUERY_SERVICE_NAME,
  MOLD_QUERY_SERVICE_NAME,
  ManufacturingSpecQueryServiceClient,
  MoldQueryServiceClient,
  PrintDailyMoldChecklistRequest,
  PrintDailyMoldChecklistResponse,
  ResolveManufacturingSpecsForMoldRequest,
  ResolveManufacturingSpecsForMoldResponse
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

/** MesQueryGrpcAdapter proxies the first-stage MES query RPCs from api-gateway into mes-service. */
@Injectable()
export class MesQueryGrpcAdapter implements OnModuleInit {
  private manufacturingSpecSvc!: ManufacturingSpecQueryServiceClient
  private moldSvc!: MoldQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.MES)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.manufacturingSpecSvc = this.client.getService<ManufacturingSpecQueryServiceClient>(
      MANUFACTURING_SPEC_QUERY_SERVICE_NAME
    )
    this.moldSvc = this.client.getService<MoldQueryServiceClient>(MOLD_QUERY_SERVICE_NAME)
  }

  /** getManufacturingSpec forwards one ManufacturingSpec detail read. */
  getManufacturingSpec(
    input: Omit<GetManufacturingSpecRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetManufacturingSpecResponse> {
    return this.call(
      'getManufacturingSpec',
      this.manufacturingSpecSvc.getManufacturingSpec(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listManufacturingSpecs forwards one ManufacturingSpec directory read. */
  listManufacturingSpecs(
    input: Omit<ListManufacturingSpecsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListManufacturingSpecsResponse> {
    return this.call(
      'listManufacturingSpecs',
      this.manufacturingSpecSvc.listManufacturingSpecs(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** resolveManufacturingSpecsForMold forwards one mold-facing ManufacturingSpec resolution query. */
  resolveManufacturingSpecsForMold(
    input: Omit<ResolveManufacturingSpecsForMoldRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ResolveManufacturingSpecsForMoldResponse> {
    return this.call(
      'resolveManufacturingSpecsForMold',
      this.manufacturingSpecSvc.resolveManufacturingSpecsForMold(
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

  /** listWorkCenters forwards the production-unit directory read used by mold management. */
  listWorkCenters(
    input: Omit<ListWorkCentersRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListWorkCentersResponse> {
    return this.call(
      'listWorkCenters',
      this.moldSvc.listWorkCenters(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getProductionMoldInstance forwards one ProductionMoldInstance detail read. */
  getProductionMoldInstance(
    input: Omit<GetProductionMoldInstanceRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetProductionMoldInstanceResponse> {
    return this.call(
      'getProductionMoldInstance',
      this.moldSvc.getProductionMoldInstance(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listProductionMoldInstances forwards the tenant-wide production mold directory read. */
  listProductionMoldInstances(
    input: Omit<ListProductionMoldInstancesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListProductionMoldInstancesResponse> {
    return this.call(
      'listProductionMoldInstances',
      this.moldSvc.listProductionMoldInstances(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listMoldInstancesByDesign forwards one MoldDesign-scoped production mold directory read. */
  listMoldInstancesByDesign(
    input: Omit<ListMoldInstancesByDesignRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListMoldInstancesByDesignResponse> {
    return this.call(
      'listMoldInstancesByDesign',
      this.moldSvc.listMoldInstancesByDesign(
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

  /** listMoldLifeWarnings forwards one mold life warning directory read. */
  listMoldLifeWarnings(
    input: Omit<ListMoldLifeWarningsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListMoldLifeWarningsResponse> {
    return this.call(
      'listMoldLifeWarnings',
      this.moldSvc.listMoldLifeWarnings(
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

  /** attachQueryContext injects the explicit MES operator and trace contexts required by the frozen query contract. */
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
