import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetUserByEmailResponse,
  GetUserByPhoneResponse,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

@Injectable()
// Looks up existing identity users for tenant onboarding without exposing a full user directory.
export class IdentityUserLookupGrpcAdapter implements OnModuleInit {
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

  getUserByEmail(email: string, source: DownstreamRequestSource): Promise<GetUserByEmailResponse> {
    return safeGrpcCall(
      this.svc.getUserByEmail(
        { email },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      { caller: 'api-gateway', method: 'IdentityQueryService.getUserByEmail' }
    )
  }

  getUserByPhone(phone: string, source: DownstreamRequestSource): Promise<GetUserByPhoneResponse> {
    return safeGrpcCall(
      this.svc.getUserByPhone(
        { phone },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      { caller: 'api-gateway', method: 'IdentityQueryService.getUserByPhone' }
    )
  }
}
