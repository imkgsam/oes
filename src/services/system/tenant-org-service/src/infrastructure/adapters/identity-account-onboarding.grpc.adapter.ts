import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {
  CreateUserAccountResponse,
  IDENTITY_MANAGEMENT_SERVICE_NAME,
  IdentityManagementServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import { IdentityAccountOnboardingPort } from '../../application/ports/identity-account-onboarding.port'
import {
  TenantOrgFoundationTrustedGrpcExecutionProducer,
  TenantOrgIdentityTrustedGrpcClient
} from './foundation-trusted-grpc.clients'

/** IdentityAccountOnboardingGrpcAdapter calls identity-service account creation without owning identity truth. */
@Injectable()
export class IdentityAccountOnboardingGrpcAdapter
  implements IdentityAccountOnboardingPort, OnModuleInit
{
  private readonly logger = new Logger(IdentityAccountOnboardingGrpcAdapter.name)
  private client!: IdentityManagementServiceClient
  private readonly trusted = new TenantOrgFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly identityClient: TenantOrgIdentityTrustedGrpcClient) {}

  onModuleInit() {
    this.client = this.identityClient
      .getClient()
      .getService<IdentityManagementServiceClient>(IDENTITY_MANAGEMENT_SERVICE_NAME)
  }

  async createTenantUserAccount(input: {
    tenantId: string
    displayName: string
    email?: string
    existingUserId?: string
    phone?: string
    provisioningMode?: 'CREATE_NEW_USER' | 'EXISTING_USER'
    idempotencyKey: string
  }) {
    const response = await safeGrpcCall<CreateUserAccountResponse>(
      this.client.createUserAccount(
        {
          scopeLevel: 'TENANT',
          tenantId: input.tenantId,
          displayName: input.displayName,
          email: input.email ?? '',
          existingUserId: input.existingUserId ?? '',
          phone: input.phone ?? '',
          idempotencyKey: input.idempotencyKey
        },
        await this.trusted.forBusinessCall('identity-service', ['identity.account.create'])
      ),
      { caller: 'tenant-org-service', method: 'IdentityManagementService.createUserAccount' }
    )
    const accountId = response.account?.id?.trim()
    const userId = response.account?.userId?.trim()
    if (!accountId || !userId) {
      this.logger.error(
        'identity-service returned empty account or user id during tenant onboarding'
      )
      throw new Error('identity-service did not return account/user id')
    }
    return {
      accountId,
      userId,
      tenantPartyId:
        response.tenantPartyId?.trim() || response.account?.tenantPartyId?.trim() || undefined
    }
  }
}
