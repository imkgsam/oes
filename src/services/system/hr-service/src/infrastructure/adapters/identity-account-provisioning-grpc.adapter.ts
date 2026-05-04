import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import {
  CreateUserAccountResponse,
  IDENTITY_MANAGEMENT_SERVICE_NAME,
  IdentityManagementServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import { IDENTITY_ACCOUNT_PROVISIONING_PORT, IdentityAccountProvisioningPort } from '../../application/ports'
import { IDENTITY_GRPC_CLIENT } from './identity-employee-binding-grpc.adapter'

/** IdentityAccountProvisioningGrpcAdapter provisions tenant-scoped member accounts for HR onboarding access. */
@Injectable()
export class IdentityAccountProvisioningGrpcAdapter
  implements IdentityAccountProvisioningPort, OnModuleInit
{
  private identityManagementService!: IdentityManagementServiceClient

  constructor(
    @Inject(IDENTITY_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit() {
    this.identityManagementService =
      this.client.getService<IdentityManagementServiceClient>(IDENTITY_MANAGEMENT_SERVICE_NAME)
  }

  async createUserAccount(input: {
    scopeLevel: 'TENANT'
    tenantId: string
    displayName: string
    email?: string
    existingUserId?: string
    phone?: string
    username?: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<{
    accountId: string
    userId: string
    displayName: string
  }> {
    const response = await safeGrpcCall<CreateUserAccountResponse>(
      this.identityManagementService.createUserAccount(
        {
          scopeLevel: input.scopeLevel,
          tenantId: input.tenantId,
          displayName: input.displayName,
          username: input.username || input.displayName,
          email: input.email,
          existingUserId: input.existingUserId,
          phone: input.phone
        },
        this.metadata(input)
      ),
      {
        caller: 'hr-service',
        method: 'IdentityManagementService.createUserAccount'
      }
    )

    return {
      accountId: response.account?.id ?? '',
      userId: response.account?.userId ?? '',
      displayName: response.account?.displayName?.trim() || input.displayName
    }
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
