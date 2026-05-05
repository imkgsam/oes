import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ActivateManufacturingSpecRequest,
  ActivateManufacturingSpecResponse,
  CreateManufacturingSpecRequest,
  CreateManufacturingSpecResponse,
  CreateWorkCenterRequest,
  CreateWorkCenterResponse,
  DeactivateWorkCenterRequest,
  DeactivateWorkCenterResponse,
  InstallMoldRequest,
  InstallMoldResponse,
  MANUFACTURING_SPEC_MANAGEMENT_SERVICE_NAME,
  MOLD_MANAGEMENT_SERVICE_NAME,
  ManufacturingSpecManagementServiceClient,
  MoldManagementServiceClient,
  MoveMoldRequest,
  MoveMoldResponse,
  RecordMoldUsageRequest,
  RecordMoldUsageResponse,
  RetireManufacturingSpecRequest,
  RetireManufacturingSpecResponse,
  RegisterMoldDesignRequest,
  RegisterMoldDesignResponse,
  RegisterProductionMoldInstanceRequest,
  RegisterProductionMoldInstanceResponse,
  ScrapMoldRequest,
  ScrapMoldResponse,
  UpdateManufacturingSpecRequest,
  UpdateManufacturingSpecResponse,
  UnmountMoldRequest,
  UnmountMoldResponse
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

/** MesManagementGrpcAdapter proxies the first-stage MES management RPCs from api-gateway into mes-service. */
@Injectable()
export class MesManagementGrpcAdapter implements OnModuleInit {
  private manufacturingSpecSvc!: ManufacturingSpecManagementServiceClient
  private moldSvc!: MoldManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.MES)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.manufacturingSpecSvc = this.client.getService<ManufacturingSpecManagementServiceClient>(
      MANUFACTURING_SPEC_MANAGEMENT_SERVICE_NAME
    )
    this.moldSvc = this.client.getService<MoldManagementServiceClient>(MOLD_MANAGEMENT_SERVICE_NAME)
  }

  /** createManufacturingSpec forwards one ManufacturingSpec creation command. */
  createManufacturingSpec(
    input: Omit<CreateManufacturingSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateManufacturingSpecResponse> {
    return this.call(
      'createManufacturingSpec',
      this.manufacturingSpecSvc.createManufacturingSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'create manufacturing spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** activateManufacturingSpec forwards one ManufacturingSpec activation command. */
  activateManufacturingSpec(
    input: Omit<ActivateManufacturingSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ActivateManufacturingSpecResponse> {
    return this.call(
      'activateManufacturingSpec',
      this.manufacturingSpecSvc.activateManufacturingSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'activate manufacturing spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateManufacturingSpec forwards one ManufacturingSpec update command. */
  updateManufacturingSpec(
    input: Omit<UpdateManufacturingSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateManufacturingSpecResponse> {
    return this.call(
      'updateManufacturingSpec',
      this.manufacturingSpecSvc.updateManufacturingSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'update manufacturing spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** retireManufacturingSpec forwards one ManufacturingSpec retirement command. */
  retireManufacturingSpec(
    input: Omit<RetireManufacturingSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RetireManufacturingSpecResponse> {
    return this.call(
      'retireManufacturingSpec',
      this.manufacturingSpecSvc.retireManufacturingSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'retire manufacturing spec from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** createWorkCenter forwards one WorkCenter creation command. */
  createWorkCenter(
    input: Omit<CreateWorkCenterRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateWorkCenterResponse> {
    return this.call(
      'createWorkCenter',
      this.moldSvc.createWorkCenter(
        this.attachManagementContext(input, source, input.auditReason ?? 'create work center from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** deactivateWorkCenter forwards one WorkCenter deactivation command. */
  deactivateWorkCenter(
    input: Omit<DeactivateWorkCenterRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<DeactivateWorkCenterResponse> {
    return this.call(
      'deactivateWorkCenter',
      this.moldSvc.deactivateWorkCenter(
        this.attachManagementContext(input, source, input.auditReason ?? 'deactivate work center from api-gateway'),
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

  /** registerProductionMoldInstance forwards one production mold instance registration command. */
  registerProductionMoldInstance(
    input: Omit<RegisterProductionMoldInstanceRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterProductionMoldInstanceResponse> {
    return this.call(
      'registerProductionMoldInstance',
      this.moldSvc.registerProductionMoldInstance(
        this.attachManagementContext(input, source, input.auditReason ?? 'register production mold from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** moveMold forwards one mold movement command. */
  moveMold(
    input: Omit<MoveMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<MoveMoldResponse> {
    return this.call(
      'moveMold',
      this.moldSvc.moveMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'move mold from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** installMold forwards one production mold installation command. */
  installMold(
    input: Omit<InstallMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<InstallMoldResponse> {
    return this.call(
      'installMold',
      this.moldSvc.installMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'install mold from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** unmountMold forwards one production mold unmount command. */
  unmountMold(
    input: Omit<UnmountMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UnmountMoldResponse> {
    return this.call(
      'unmountMold',
      this.moldSvc.unmountMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'unmount mold from api-gateway'),
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

  /** scrapMold forwards one mold scrap command. */
  scrapMold(
    input: Omit<ScrapMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ScrapMoldResponse> {
    return this.call(
      'scrapMold',
      this.moldSvc.scrapMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'scrap mold from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachManagementContext injects the explicit MES operator, trace, and audit contexts required by management contracts. */
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
