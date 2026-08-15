import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { AUTH_SERVICE_NAME, AuthServiceClient } from '@oes/common/generated/auth_service'
import { safeGrpcCall } from '@oes/common/transport'
import { AuthLoginBootstrapPort } from '../../application/ports'
import { HrFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

export const AUTH_GRPC_CLIENT = Symbol('HR_AUTH_GRPC_CLIENT')

/** AuthLoginBootstrapGrpcAdapter bootstraps invite-ready login methods for HR-owned member access flows. */
@Injectable()
export class AuthLoginBootstrapGrpcAdapter implements AuthLoginBootstrapPort, OnModuleInit {
  private authService!: AuthServiceClient
  private readonly trusted = new HrFoundationTrustedGrpcExecutionProducer()

  constructor(
    @Inject(AUTH_GRPC_CLIENT) private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME)
  }

  async bootstrapUserLoginMethods(input: {
    userId: string
    accountId: string
    displayName: string
    email?: string
    phone?: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<void> {
    await safeGrpcCall(
      this.authService.bootstrapUserLoginMethods(
        {
          userId: input.userId,
          accountId: input.accountId,
          displayName: input.displayName,
          email: input.email,
          phone: input.phone
        },
        await this.trusted.forBusinessCall('auth-service', ['auth.account_credentials.bootstrap'])
      ),
      {
        caller: 'hr-service',
        method: 'AuthService.bootstrapUserLoginMethods'
      }
    )
  }

}
