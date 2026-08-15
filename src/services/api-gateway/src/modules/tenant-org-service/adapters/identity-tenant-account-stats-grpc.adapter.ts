import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  CountTenantAccountsResponse,
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
// Reads identity-owned tenant account counts for tenant management list summaries.
export class IdentityTenantAccountStatsGrpcAdapter implements OnModuleInit {
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

  async countTenantAccounts(
    request: { tenantIds: string[]; scopeLevel?: string; status?: string },
    source: DownstreamRequestSource
  ): Promise<CountTenantAccountsResponse> {
    return safeGrpcCall(
      this.svc.countTenantAccounts(
        {
          tenantIds: request.tenantIds,
          scopeLevel: request.scopeLevel,
          status: request.status
        },
        await this.trusted.forBusinessCall(source, IDENTITY_TARGET_AUDIENCE, [
          'identity.account.list'
        ])
      ),
      { caller: 'api-gateway', method: 'IdentityQueryService.countTenantAccounts' }
    )
  }
}
