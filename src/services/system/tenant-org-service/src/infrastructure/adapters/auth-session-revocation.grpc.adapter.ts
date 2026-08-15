import { Injectable, OnModuleInit } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { AUTH_SERVICE_NAME, AuthServiceClient } from '@oes/common/generated/auth_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  AuthSessionRevocationPort,
  RevokeTenantSessionsInput
} from '../../application/ports/auth-session-revocation.port'
import { TenantOrgAuthTrustedGrpcClient, TenantOrgFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

/** AuthSessionRevocationGrpcAdapter calls auth-service to revoke tenant sessions after lifecycle deactivation. */
@Injectable()
export class AuthSessionRevocationGrpcAdapter
  implements AuthSessionRevocationPort, OnModuleInit
{
  private authService!: AuthServiceClient
  private readonly trusted = new TenantOrgFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly authClient: TenantOrgAuthTrustedGrpcClient) {}

  onModuleInit() {
    this.authService = this.authClient.getClient().getService<AuthServiceClient>(AUTH_SERVICE_NAME)
  }

  async revokeTenantSessions(input: RevokeTenantSessionsInput): Promise<void> {
    await safeGrpcCall(
      this.authService.revokeTenantSessions(
        {
          tenantId: input.tenantId,
          reason: input.reason
        },
        await this.trusted.forBusinessCall('auth-service', ['auth.session.admin.revoke'])
      ),
      {
        caller: SERVICE_NAMES.TENANT_ORG,
        method: 'AuthService.revokeTenantSessions'
      }
    )
  }

}
