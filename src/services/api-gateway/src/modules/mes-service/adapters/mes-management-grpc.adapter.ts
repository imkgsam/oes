import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ActivateProductionSpecRequest,
  ActivateProductionSpecResponse,
  AcceptProductionMoldRequest,
  AcceptProductionMoldResponse,
  AdjustMoldLifeCounterRequest,
  AdjustMoldLifeCounterResponse,
  CreateProductionSpecRequest,
  CreateProductionSpecResponse,
  InstallToolingRequest,
  InstallToolingResponse,
  MarkProductionMoldForScrapRequest,
  MarkProductionMoldForScrapResponse,
  MOLD_MANAGEMENT_SERVICE_NAME,
  MoldManagementServiceClient,
  MoveToolingRequest,
  MoveToolingResponse,
  PRODUCTION_SPEC_MANAGEMENT_SERVICE_NAME,
  ProductionSpecManagementServiceClient,
  RecordMoldUsageBatchRequest,
  RecordMoldUsageBatchResponse,
  RecordMoldUsageRequest,
  RecordMoldUsageResponse,
  RegisterMasterMoldRequest,
  RegisterMasterMoldResponse,
  RegisterMoldDesignRequest,
  RegisterMoldDesignResponse,
  RegisterProductionMoldRequest,
  RegisterProductionMoldResponse,
  RetireProductionSpecRequest,
  RetireProductionSpecResponse,
  UnmountToolingRequest,
  UnmountToolingResponse,
  UpdateProductionSpecRequest,
  UpdateProductionSpecResponse
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
import { buildMesAuditContext, buildMesOperatorContext, buildMesTraceContext } from './mes-grpc-context'

const CALLER = 'api-gateway'

interface ManagementInputBase {
  auditReason?: string
}

/** MesManagementGrpcAdapter proxies current MES command RPCs from api-gateway into mes-service. */
@Injectable()
export class MesManagementGrpcAdapter implements OnModuleInit {
  private productionSpecSvc!: ProductionSpecManagementServiceClient
  private moldSvc!: MoldManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.MES)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  /** onModuleInit resolves the generated MES gRPC service clients. */
  onModuleInit(): void {
    this.productionSpecSvc = this.client.getService<ProductionSpecManagementServiceClient>(
      PRODUCTION_SPEC_MANAGEMENT_SERVICE_NAME
    )
    this.moldSvc = this.client.getService<MoldManagementServiceClient>(MOLD_MANAGEMENT_SERVICE_NAME)
  }

  /** createProductionSpec forwards one ProductionSpec creation command. */
  createProductionSpec(
    input: Omit<CreateProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateProductionSpecResponse> {
    return this.call(
      'createProductionSpec',
      this.productionSpecSvc.createProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'create production spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** activateProductionSpec forwards one ProductionSpec activation command. */
  activateProductionSpec(
    input: Omit<ActivateProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ActivateProductionSpecResponse> {
    return this.call(
      'activateProductionSpec',
      this.productionSpecSvc.activateProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'activate production spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateProductionSpec forwards one ProductionSpec update command. */
  updateProductionSpec(
    input: Omit<UpdateProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateProductionSpecResponse> {
    return this.call(
      'updateProductionSpec',
      this.productionSpecSvc.updateProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'update production spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** retireProductionSpec forwards one ProductionSpec retirement command. */
  retireProductionSpec(
    input: Omit<RetireProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RetireProductionSpecResponse> {
    return this.call(
      'retireProductionSpec',
      this.productionSpecSvc.retireProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'retire production spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** registerMoldDesign forwards one MoldDesign registration command. */
  registerMoldDesign(
    input: Omit<RegisterMoldDesignRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterMoldDesignResponse> {
    return this.call(
      'registerMoldDesign',
      this.moldSvc.registerMoldDesign(
        this.attachManagementContext(input, source, input.auditReason ?? 'register mold design from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** registerMasterMold forwards one MasterMold registration command. */
  registerMasterMold(
    input: Omit<RegisterMasterMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterMasterMoldResponse> {
    return this.call(
      'registerMasterMold',
      this.moldSvc.registerMasterMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'register master mold from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** registerProductionMold forwards one ProductionMold registration command. */
  registerProductionMold(
    input: Omit<RegisterProductionMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterProductionMoldResponse> {
    return this.call(
      'registerProductionMold',
      this.moldSvc.registerProductionMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'register production mold from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** acceptProductionMold forwards one ProductionMold acceptance command. */
  acceptProductionMold(
    input: Omit<AcceptProductionMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<AcceptProductionMoldResponse> {
    return this.call(
      'acceptProductionMold',
      this.moldSvc.acceptProductionMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'accept production mold from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** moveTooling forwards one storage or carrier placement command. */
  moveTooling(
    input: Omit<MoveToolingRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<MoveToolingResponse> {
    return this.call(
      'moveTooling',
      this.moldSvc.moveTooling(
        this.attachManagementContext(input, source, input.auditReason ?? 'move tooling from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** installTooling forwards one tooling installation command. */
  installTooling(
    input: Omit<InstallToolingRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<InstallToolingResponse> {
    return this.call(
      'installTooling',
      this.moldSvc.installTooling(
        this.attachManagementContext(input, source, input.auditReason ?? 'install tooling from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** unmountTooling forwards one tooling unmount command. */
  unmountTooling(
    input: Omit<UnmountToolingRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UnmountToolingResponse> {
    return this.call(
      'unmountTooling',
      this.moldSvc.unmountTooling(
        this.attachManagementContext(input, source, input.auditReason ?? 'unmount tooling from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** recordMoldUsage forwards one mold usage fact command. */
  recordMoldUsage(
    input: Omit<RecordMoldUsageRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RecordMoldUsageResponse> {
    return this.call(
      'recordMoldUsage',
      this.moldSvc.recordMoldUsage(
        this.attachManagementContext(input, source, input.auditReason ?? 'record mold usage from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** recordMoldUsageBatch forwards one transactional work-center usage batch. */
  recordMoldUsageBatch(
    input: Omit<RecordMoldUsageBatchRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RecordMoldUsageBatchResponse> {
    return this.call(
      'recordMoldUsageBatch',
      this.moldSvc.recordMoldUsageBatch(
        this.attachManagementContext(input, source, input.auditReason ?? 'record mold usage batch from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** adjustMoldLifeCounter forwards one mold life counter correction command. */
  adjustMoldLifeCounter(
    input: Omit<AdjustMoldLifeCounterRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<AdjustMoldLifeCounterResponse> {
    return this.call(
      'adjustMoldLifeCounter',
      this.moldSvc.adjustMoldLifeCounter(
        this.attachManagementContext(input, source, input.auditReason ?? 'adjust mold life counter from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** markProductionMoldForScrap forwards the first step of the production mold scrap lifecycle. */
  markProductionMoldForScrap(
    input: Omit<MarkProductionMoldForScrapRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<MarkProductionMoldForScrapResponse> {
    return this.call(
      'markProductionMoldForScrap',
      this.moldSvc.markProductionMoldForScrap(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'mark production mold for scrap from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachManagementContext injects the explicit MES operator, trace, and audit contexts required by commands. */
  private attachManagementContext<TInput extends { auditReason?: string }>(
    input: TInput,
    source: DownstreamRequestSource,
    defaultReason: string
  ) {
    const { auditReason: _auditReason, ...rest } = input

    return {
      ...rest,
      auditContext: buildMesAuditContext(source, input.auditReason ?? defaultReason),
      operatorContext: buildMesOperatorContext(source),
      traceContext: buildMesTraceContext(source)
    }
  }

  /** call wraps one gateway MES command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied MES command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
