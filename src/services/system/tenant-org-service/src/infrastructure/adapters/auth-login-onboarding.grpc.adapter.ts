import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  BootstrapUserLoginMethodsResponse
} from '@oes/common/generated/auth_service'
import { safeGrpcCall } from '@oes/common/transport'
import { AuthLoginOnboardingPort } from '../../application/ports/auth-login-onboarding.port'
import {
  TenantOrgAuthTrustedGrpcClient,
  TenantOrgFoundationTrustedGrpcExecutionProducer
} from './foundation-trusted-grpc.clients'

/** AuthLoginOnboardingGrpcAdapter calls auth-service login bootstrap APIs without owning auth truth. */
@Injectable()
export class AuthLoginOnboardingGrpcAdapter implements AuthLoginOnboardingPort, OnModuleInit {
  private client!: AuthServiceClient
  private readonly trusted = new TenantOrgFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly authClient: TenantOrgAuthTrustedGrpcClient) {}

  onModuleInit() {
    this.client = this.authClient.getClient().getService<AuthServiceClient>(AUTH_SERVICE_NAME)
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
        await this.trusted.forBusinessCall('auth-service', ['auth.account_credentials.bootstrap'])
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
        await this.trusted.forBusinessCall('auth-service', ['auth.account_credentials.bootstrap'])
      ),
      { caller: 'tenant-org-service', method: 'AuthService.requirePasswordSetup' }
    )
  }
}
