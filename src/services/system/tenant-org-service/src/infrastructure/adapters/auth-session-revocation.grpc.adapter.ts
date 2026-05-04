import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { AUTH_SERVICE_NAME, AuthServiceClient } from '@oes/common/generated/auth_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  AuthSessionRevocationPort,
  RevokeTenantSessionsInput
} from '../../application/ports/auth-session-revocation.port'

/** AuthSessionRevocationGrpcAdapter calls auth-service to revoke tenant sessions after lifecycle deactivation. */
@Injectable()
export class AuthSessionRevocationGrpcAdapter
  implements AuthSessionRevocationPort, OnModuleInit
{
  private authService!: AuthServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.AUTH)
    private readonly authClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME)
  }

  async revokeTenantSessions(input: RevokeTenantSessionsInput): Promise<void> {
    await safeGrpcCall(
      this.authService.revokeTenantSessions(
        {
          tenantId: input.tenantId,
          reason: input.reason
        },
        this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.TENANT_ORG,
        method: 'AuthService.revokeTenantSessions'
      }
    )
  }

  /** buildMetadata forwards trace/request context for the lifecycle side effect call. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.TENANT_ORG,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
