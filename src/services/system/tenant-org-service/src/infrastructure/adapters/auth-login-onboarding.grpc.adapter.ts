import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  BootstrapUserLoginMethodsResponse
} from '@oes/common/generated/auth_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { AuthLoginOnboardingPort } from '../../application/ports/auth-login-onboarding.port'
import { buildTenantOnboardingMetadata } from './tenant-onboarding-metadata'

/** AuthLoginOnboardingGrpcAdapter calls auth-service login bootstrap APIs without owning auth truth. */
@Injectable()
export class AuthLoginOnboardingGrpcAdapter implements AuthLoginOnboardingPort, OnModuleInit {
  private client!: AuthServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.AUTH)
    private readonly authClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.client = this.authClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME)
  }

  async bootstrapUserLoginMethods(input: {
    userId: string
    accountId: string
    displayName: string
    email?: string
    phone?: string
  }) {
    const response = await safeGrpcCall<BootstrapUserLoginMethodsResponse>(
      this.client.bootstrapUserLoginMethods(
        {
          userId: input.userId,
          accountId: input.accountId,
          displayName: input.displayName,
          email: input.email ?? '',
          phone: input.phone ?? ''
        },
        this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'AuthService.bootstrapUserLoginMethods' }
    )
    return {
      emailBootstrapped: response.emailBootstrapped,
      phoneBootstrapped: response.phoneBootstrapped,
      passwordBootstrapped: response.passwordBootstrapped
    }
  }

  async requirePasswordSetup(input: { userId: string; reason: string }): Promise<void> {
    await safeGrpcCall(
      this.client.requirePasswordSetup(
        {
          userId: input.userId,
          reason: input.reason,
          revokeSessions: false
        },
        this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'AuthService.requirePasswordSetup' }
    )
  }

  /** buildMetadata propagates tenant-org request context into auth-service calls. */
  private buildMetadata() {
    return buildTenantOnboardingMetadata(this.metadataFactory, this.requestContextStore)
  }
}
