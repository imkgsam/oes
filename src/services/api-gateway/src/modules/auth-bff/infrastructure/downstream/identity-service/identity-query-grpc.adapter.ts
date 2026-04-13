import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  GetAccountByIdResponse,
  GetTenantByIdResponse,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// Bridges auth-bff session-context reads to the downstream identity-service gRPC contract.
export class IdentityQueryGrpcAdapter implements OnModuleInit {
  private svc!: IdentityQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.IDENTITY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
  }

  getAccountById(accountId: string, source: DownstreamRequestSource): Promise<GetAccountByIdResponse> {
    return this.call(
      'getAccountById',
      this.svc.getAccountById({ accountId }, this.metadata(source))
    )
  }

  getTenantById(tenantId: string, source: DownstreamRequestSource): Promise<GetTenantByIdResponse> {
    return this.call(
      'getTenantById',
      this.svc.getTenantById({ tenantId }, this.metadata(source))
    )
  }

  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createInternalCallMetadata(toInternalCallMetadataInput(source))
  }

  private call<T>(method: string, call$: any): Promise<T> {
    return safeGrpcCall(call$, this.opts(method))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
