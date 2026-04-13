import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  AccountAccessSummaryResponse,
  PERMISSION_ACCESS_SUMMARY_SERVICE_NAME,
  PermissionAccessSummaryServiceClient
} from '@oes/common/generated/permission_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// Bridges auth-bff access-summary reads to the downstream permission-service self-context gRPC contract.
export class PermissionAccessSummaryGrpcAdapter implements OnModuleInit {
  private svc!: PermissionAccessSummaryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PermissionAccessSummaryServiceClient>(
      PERMISSION_ACCESS_SUMMARY_SERVICE_NAME
    )
  }

  getAccountAccessSummary(
    request: { accountId: string; tenantId?: string; scopeLevel: 'SYSTEM' | 'TENANT' },
    source: DownstreamRequestSource
  ): Promise<AccountAccessSummaryResponse> {
    return safeGrpcCall(
      this.svc.getAccountAccessSummary(request, this.metadata(source)),
      this.opts('getAccountAccessSummary')
    )
  }

  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(
      toOperatorScopedMetadataInput(source)
    )
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
