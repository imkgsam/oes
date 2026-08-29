import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  AccountAccessSummaryResponse,
  AccountNavigationSummaryResponse,
  PERMISSION_ACCESS_SUMMARY_SERVICE_NAME,
  PermissionAccessSummaryServiceClient,
  ResolveAccountNavigationRequest
} from '@oes/common/generated/permission_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import {
  PERMISSION_TARGET_AUDIENCE,
  TrustedPermissionGrpcClient
} from '../../../../../infrastructure/grpc/trusted-permission.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'
const GATEWAY_SELF_AUDIENCE = 'urn:oes:service:api-gateway'

@Injectable()
// Bridges auth-bff access-summary reads to the downstream permission-service self-context gRPC contract.
export class PermissionAccessSummaryGrpcAdapter implements OnModuleInit {
  private svc!: PermissionAccessSummaryServiceClient

  constructor(
    private readonly client: TrustedPermissionGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client
      .getClient()
      .getService<PermissionAccessSummaryServiceClient>(PERMISSION_ACCESS_SUMMARY_SERVICE_NAME)
  }

  async getAccountAccessSummary(
    request: { accountId: string; tenantId?: string; scopeLevel: 'SYSTEM' | 'TENANT' },
    source: DownstreamRequestSource
  ): Promise<AccountAccessSummaryResponse> {
    return safeGrpcCall(
      this.svc.getAccountAccessSummary(
        request,
        await this.trusted.forHumanOboInternalCall(
          source,
          GATEWAY_SELF_AUDIENCE,
          PERMISSION_TARGET_AUDIENCE,
          ['permission.internal.account_access_summary.resolve']
        )
      ),
      this.opts('getAccountAccessSummary')
    )
  }

  // Resolves runtime navigation entries for the selected account context.
  async resolveAccountNavigation(
    request: ResolveAccountNavigationRequest,
    source: DownstreamRequestSource
  ): Promise<AccountNavigationSummaryResponse> {
    return safeGrpcCall(
      this.svc.resolveAccountNavigation(
        request,
        await this.trusted.forHumanOboInternalCall(
          source,
          GATEWAY_SELF_AUDIENCE,
          PERMISSION_TARGET_AUDIENCE,
          ['permission.internal.account_navigation.resolve']
        )
      ),
      this.opts('resolveAccountNavigation')
    )
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
