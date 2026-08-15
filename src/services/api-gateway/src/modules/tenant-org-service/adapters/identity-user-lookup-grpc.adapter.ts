import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetUserByEmailResponse,
  GetUserByPhoneResponse,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  IDENTITY_TARGET_AUDIENCE,
  TrustedIdentityGrpcClient
} from '../../../infrastructure/grpc/trusted-identity.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'

@Injectable()
// Looks up existing identity users for tenant onboarding without exposing a full user directory.
export class IdentityUserLookupGrpcAdapter implements OnModuleInit {
  private svc!: IdentityQueryServiceClient

  constructor(
    private readonly client: TrustedIdentityGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client
      .getClient()
      .getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
  }

  async getUserByEmail(
    email: string,
    source: DownstreamRequestSource
  ): Promise<GetUserByEmailResponse> {
    return safeGrpcCall(
      this.svc.getUserByEmail(
        { email },
        await this.trusted.forBusinessCall(source, IDENTITY_TARGET_AUDIENCE, [
          'identity.account.list'
        ])
      ),
      { caller: 'api-gateway', method: 'IdentityQueryService.getUserByEmail' }
    )
  }

  async getUserByPhone(
    phone: string,
    source: DownstreamRequestSource
  ): Promise<GetUserByPhoneResponse> {
    return safeGrpcCall(
      this.svc.getUserByPhone(
        { phone },
        await this.trusted.forBusinessCall(source, IDENTITY_TARGET_AUDIENCE, [
          'identity.account.list'
        ])
      ),
      { caller: 'api-gateway', method: 'IdentityQueryService.getUserByPhone' }
    )
  }
}
