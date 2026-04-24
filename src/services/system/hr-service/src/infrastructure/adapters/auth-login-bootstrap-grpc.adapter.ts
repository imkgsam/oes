import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import { AUTH_SERVICE_NAME, AuthServiceClient } from '@oes/common/generated/auth_service'
import { safeGrpcCall } from '@oes/common/transport'
import { AuthLoginBootstrapPort } from '../../application/ports'

export const AUTH_GRPC_CLIENT = Symbol('HR_AUTH_GRPC_CLIENT')

/** AuthLoginBootstrapGrpcAdapter bootstraps invite-ready login methods for HR-owned member access flows. */
@Injectable()
export class AuthLoginBootstrapGrpcAdapter implements AuthLoginBootstrapPort, OnModuleInit {
  private authService!: AuthServiceClient

  constructor(
    @Inject(AUTH_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
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
        this.metadata(input)
      ),
      {
        caller: 'hr-service',
        method: 'AuthService.bootstrapUserLoginMethods'
      }
    )
  }

  private metadata(input: {
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }) {
    if (input.operatorContext) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: 'hr-service',
        operatorContext: input.operatorContext,
        requestId: input.requestId,
        traceId: input.traceId
      })
    }

    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: 'hr-service',
      requestId: input.requestId,
      traceId: input.traceId
    })
  }
}
