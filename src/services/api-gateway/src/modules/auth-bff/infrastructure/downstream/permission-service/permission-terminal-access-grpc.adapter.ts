import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PERMISSION_TERMINAL_ACCESS_SERVICE_NAME,
  PermissionTerminalAccessServiceClient,
  ResolveAccountTerminalAccessResponse
} from '@oes/common/generated/permission_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PERMISSION_TARGET_AUDIENCE, TrustedPermissionGrpcClient } from '../../../../../infrastructure/grpc/trusted-permission.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'

export interface ResolveTerminalAccessInput {
  accountId: string
  tenantId?: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  terminal: string
}

@Injectable()
// Resolves account terminal login eligibility for auth-bff terminal-specific account option filtering.
export class PermissionTerminalAccessGrpcAdapter implements OnModuleInit {
  private svc!: PermissionTerminalAccessServiceClient

  constructor(
    private readonly client: TrustedPermissionGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<PermissionTerminalAccessServiceClient>(
      PERMISSION_TERMINAL_ACCESS_SERVICE_NAME
    )
  }

  async resolveAccountTerminalAccess(
    request: ResolveTerminalAccessInput,
    source: DownstreamRequestSource
  ): Promise<ResolveAccountTerminalAccessResponse> {
    return safeGrpcCall(
      this.svc.resolveAccountTerminalAccess(
        {
          accountId: request.accountId,
          tenantId: request.tenantId,
          scopeLevel: request.scopeLevel,
          terminal: request.terminal
        },
        await this.trusted.forInternalCall(source, PERMISSION_TARGET_AUDIENCE, [
          'permission.internal.account_terminal_access.resolve'
        ])
      ),
      this.opts('resolveAccountTerminalAccess')
    )
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
