import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ActivateProductionSpecRequest,
  ActivateProductionSpecResponse,
  AcceptProductionMoldRequest,
  AcceptProductionMoldResponse,
  AdjustMoldLifeCounterRequest,
  AdjustMoldLifeCounterResponse,
  ConfirmInstalledMoldReadyRequest,
  ConfirmInstalledMoldReadyResponse,
  ConfirmProductionMoldArrivalRequest,
  ConfirmProductionMoldArrivalResponse,
  CreateProductionSpecRequest,
  CreateProductionSpecResponse,
  InstallToolingRequest,
  InstallToolingResponse,
  MarkInstalledMoldMaintenanceRequest,
  MarkInstalledMoldMaintenanceResponse,
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
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { GatewayMesGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'

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
    private readonly client: GatewayMesGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  /** onModuleInit resolves the generated MES gRPC service clients. */
  onModuleInit(): void {
    this.productionSpecSvc = this.client.getClient().getService<ProductionSpecManagementServiceClient>(
      PRODUCTION_SPEC_MANAGEMENT_SERVICE_NAME
    )
    this.moldSvc = this.client.getClient().getService<MoldManagementServiceClient>(MOLD_MANAGEMENT_SERVICE_NAME)
  }

  /** createProductionSpec forwards one ProductionSpec creation command. */
  async createProductionSpec(
    input: Omit<CreateProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateProductionSpecResponse> {
    return this.call(
      'createProductionSpec',
      this.productionSpecSvc.createProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'create production spec from api-gateway'),
        await this.metadata(source, ['mes.production_spec.manage'])
      )
    )
  }

  /** activateProductionSpec forwards one ProductionSpec activation command. */
  async activateProductionSpec(
    input: Omit<ActivateProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ActivateProductionSpecResponse> {
    return this.call(
      'activateProductionSpec',
      this.productionSpecSvc.activateProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'activate production spec from api-gateway'),
        await this.metadata(source, ['mes.production_spec.manage'])
      )
    )
  }

  /** updateProductionSpec forwards one ProductionSpec update command. */
  async updateProductionSpec(
    input: Omit<UpdateProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateProductionSpecResponse> {
    return this.call(
      'updateProductionSpec',
      this.productionSpecSvc.updateProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'update production spec from api-gateway'),
        await this.metadata(source, ['mes.production_spec.manage'])
      )
    )
  }

  /** retireProductionSpec forwards one ProductionSpec retirement command. */
  async retireProductionSpec(
    input: Omit<RetireProductionSpecRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RetireProductionSpecResponse> {
    return this.call(
      'retireProductionSpec',
      this.productionSpecSvc.retireProductionSpec(
        this.attachManagementContext(input, source, input.auditReason ?? 'retire production spec from api-gateway'),
        await this.metadata(source, ['mes.production_spec.manage'])
      )
    )
  }

  /** registerMoldDesign forwards one MoldDesign registration command. */
  async registerMoldDesign(
    input: Omit<RegisterMoldDesignRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterMoldDesignResponse> {
    return this.call(
      'registerMoldDesign',
      this.moldSvc.registerMoldDesign(
        this.attachManagementContext(input, source, input.auditReason ?? 'register mold design from api-gateway'),
        await this.metadata(source, ['mes.mold_design.manage'])
      )
    )
  }

  /** registerMasterMold forwards one MasterMold registration command. */
  async registerMasterMold(
    input: Omit<RegisterMasterMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterMasterMoldResponse> {
    return this.call(
      'registerMasterMold',
      this.moldSvc.registerMasterMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'register master mold from api-gateway'),
        await this.metadata(source, ['mes.production_mold.manage'])
      )
    )
  }

  /** registerProductionMold forwards one ProductionMold registration command. */
  async registerProductionMold(
    input: Omit<RegisterProductionMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterProductionMoldResponse> {
    return this.call(
      'registerProductionMold',
      this.moldSvc.registerProductionMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'register production mold from api-gateway'),
        await this.metadata(source, ['mes.production_mold.manage'])
      )
    )
  }

  /** acceptProductionMold forwards one ProductionMold acceptance command. */
  async acceptProductionMold(
    input: Omit<AcceptProductionMoldRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<AcceptProductionMoldResponse> {
    return this.call(
      'acceptProductionMold',
      this.moldSvc.acceptProductionMold(
        this.attachManagementContext(input, source, input.auditReason ?? 'accept production mold from api-gateway'),
        await this.metadata(source, ['mes.production_mold.manage'])
      )
    )
  }

  /** confirmProductionMoldArrival forwards the first-stage physical arrival confirmation command. */
  async confirmProductionMoldArrival(
    input: Omit<ConfirmProductionMoldArrivalRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ConfirmProductionMoldArrivalResponse> {
    return this.call(
      'confirmProductionMoldArrival',
      this.moldSvc.confirmProductionMoldArrival(
        this.attachManagementContext(input, source, input.auditReason ?? 'confirm production mold arrival from api-gateway'),
        await this.metadata(source, ['mes.production_mold.manage'])
      )
    )
  }

  /** moveTooling forwards one storage or carrier placement command. */
  async moveTooling(
    input: Omit<MoveToolingRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<MoveToolingResponse> {
    return this.call(
      'moveTooling',
      this.moldSvc.moveTooling(
        this.attachManagementContext(input, source, input.auditReason ?? 'move tooling from api-gateway'),
        await this.metadata(source, ['mes.tooling_installation.manage'])
      )
    )
  }

  /** installTooling forwards one tooling installation command. */
  async installTooling(
    input: Omit<InstallToolingRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<InstallToolingResponse> {
    return this.call(
      'installTooling',
      this.moldSvc.installTooling(
        this.attachManagementContext(input, source, input.auditReason ?? 'install tooling from api-gateway'),
        await this.metadata(source, ['mes.tooling_installation.manage'])
      )
    )
  }

  /** unmountTooling forwards one tooling unmount command. */
  async unmountTooling(
    input: Omit<UnmountToolingRequest, 'auditContext' | 'operatorContext' | 'traceContext'> & ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UnmountToolingResponse> {
    return this.call(
      'unmountTooling',
      this.moldSvc.unmountTooling(
        this.attachManagementContext(input, source, input.auditReason ?? 'unmount tooling from api-gateway'),
        await this.metadata(source, ['mes.tooling_installation.manage'])
      )
    )
  }

  /** confirmInstalledMoldReady forwards readiness confirmation after installation maintenance. */
  async confirmInstalledMoldReady(
    input: Omit<ConfirmInstalledMoldReadyRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ConfirmInstalledMoldReadyResponse> {
    return this.call(
      'confirmInstalledMoldReady',
      this.moldSvc.confirmInstalledMoldReady(
        this.attachManagementContext(input, source, input.auditReason ?? 'confirm installed mold ready from api-gateway'),
        await this.metadata(source, ['mes.tooling_installation.manage'])
      )
    )
  }

  /** markInstalledMoldMaintenance forwards a ready installed mold back to maintenance. */
  async markInstalledMoldMaintenance(
    input: Omit<MarkInstalledMoldMaintenanceRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<MarkInstalledMoldMaintenanceResponse> {
    return this.call(
      'markInstalledMoldMaintenance',
      this.moldSvc.markInstalledMoldMaintenance(
        this.attachManagementContext(input, source, input.auditReason ?? input.reason ?? 'mark installed mold maintenance from api-gateway'),
        await this.metadata(source, ['mes.tooling_installation.manage'])
      )
    )
  }

  /** recordMoldUsage forwards one mold usage fact command. */
  async recordMoldUsage(
    input: Omit<RecordMoldUsageRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RecordMoldUsageResponse> {
    return this.call(
      'recordMoldUsage',
      this.moldSvc.recordMoldUsage(
        this.attachManagementContext(input, source, input.auditReason ?? 'record mold usage from api-gateway'),
        await this.metadata(source, ['mes.mold_usage.record'])
      )
    )
  }

  /** recordMoldUsageBatch forwards one transactional work-center usage batch. */
  async recordMoldUsageBatch(
    input: Omit<RecordMoldUsageBatchRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RecordMoldUsageBatchResponse> {
    return this.call(
      'recordMoldUsageBatch',
      this.moldSvc.recordMoldUsageBatch(
        this.attachManagementContext(input, source, input.auditReason ?? 'record mold usage batch from api-gateway'),
        await this.metadata(source, ['mes.mold_usage.record'])
      )
    )
  }

  /** adjustMoldLifeCounter forwards one mold life counter correction command. */
  async adjustMoldLifeCounter(
    input: Omit<AdjustMoldLifeCounterRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<AdjustMoldLifeCounterResponse> {
    return this.call(
      'adjustMoldLifeCounter',
      this.moldSvc.adjustMoldLifeCounter(
        this.attachManagementContext(input, source, input.auditReason ?? 'adjust mold life counter from api-gateway'),
        await this.metadata(source, ['mes.mold_life.manage'])
      )
    )
  }

  /** markProductionMoldForScrap forwards the first step of the production mold scrap lifecycle. */
  async markProductionMoldForScrap(
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
        await this.metadata(source, ['mes.production_mold.manage'])
      )
    )
  }

  /** attachManagementContext injects the explicit MES operator, trace, and audit contexts required by commands. */
  private attachManagementContext<TInput extends object>(input: TInput, _source: DownstreamRequestSource, _defaultReason: string) { const { auditReason, ...request } = input as TInput & { auditReason?: string }; return auditReason ? { ...request, reason: auditReason } : request }

  private metadata(source: DownstreamRequestSource, codes: string[]) { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:mes-service', codes) }

  /** call wraps one gateway MES command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied MES command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
