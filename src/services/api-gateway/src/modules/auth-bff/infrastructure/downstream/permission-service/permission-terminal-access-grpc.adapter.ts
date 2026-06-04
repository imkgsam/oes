import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PERMISSION_TERMINAL_ACCESS_SERVICE_NAME,
  PermissionTerminalAccessServiceClient,
  ResolveAccountTerminalAccessResponse
} from '@oes/common/generated/permission_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

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
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PermissionTerminalAccessServiceClient>(
      PERMISSION_TERMINAL_ACCESS_SERVICE_NAME
    )
  }

  resolveAccountTerminalAccess(
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
        this.metadata(source)
      ),
      this.opts('resolveAccountTerminalAccess')
    )
  }

  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createInternalCallMetadata(toInternalCallMetadataInput(source))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
