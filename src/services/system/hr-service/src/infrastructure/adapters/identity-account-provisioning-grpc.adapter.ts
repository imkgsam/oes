import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  CreateUserAccountResponse,
  IDENTITY_MANAGEMENT_SERVICE_NAME,
  IdentityManagementServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import { IDENTITY_ACCOUNT_PROVISIONING_PORT, IdentityAccountProvisioningPort } from '../../application/ports'
import { IDENTITY_GRPC_CLIENT } from './identity-employee-binding-grpc.adapter'
import { HrFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

/** IdentityAccountProvisioningGrpcAdapter provisions tenant-scoped member accounts for HR onboarding access. */
@Injectable()
export class IdentityAccountProvisioningGrpcAdapter
  implements IdentityAccountProvisioningPort, OnModuleInit
{
  private identityManagementService!: IdentityManagementServiceClient
  private readonly trusted = new HrFoundationTrustedGrpcExecutionProducer()

  constructor(
    @Inject(IDENTITY_GRPC_CLIENT) private readonly client: ClientGrpc
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
    tenantPartyId?: string
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
          phone: input.phone,
          tenantPartyId: input.tenantPartyId
        },
        await this.trusted.forBusinessCall('identity-service', ['identity.account.create'])
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

}
