import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  CreateUserAccountResponse,
  IDENTITY_MANAGEMENT_SERVICE_NAME,
  IdentityManagementServiceClient
} from '@oes/common/generated/identity_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { IdentityAccountOnboardingPort } from '../../application/ports/identity-account-onboarding.port'
import { buildTenantOnboardingMetadata } from './tenant-onboarding-metadata'

/** IdentityAccountOnboardingGrpcAdapter calls identity-service account creation without owning identity truth. */
@Injectable()
export class IdentityAccountOnboardingGrpcAdapter implements IdentityAccountOnboardingPort, OnModuleInit {
  private readonly logger = new Logger(IdentityAccountOnboardingGrpcAdapter.name)
  private client!: IdentityManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.IDENTITY)
    private readonly identityClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.client = this.identityClient.getService<IdentityManagementServiceClient>(IDENTITY_MANAGEMENT_SERVICE_NAME)
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
        this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'IdentityManagementService.createUserAccount' }
    )
    const accountId = response.account?.id?.trim()
    const userId = response.account?.userId?.trim()
    if (!accountId || !userId) {
      this.logger.error('identity-service returned empty account or user id during tenant onboarding')
      throw new Error('identity-service did not return account/user id')
    }
    return {
      accountId,
      userId,
      userPartyId: response.userPartyId?.trim() || undefined,
      userTenantPartyId: response.userTenantPartyId?.trim() || undefined
    }
  }

  /** buildMetadata propagates tenant-org request context into identity-service calls. */
  private buildMetadata() {
    return buildTenantOnboardingMetadata(this.metadataFactory, this.requestContextStore)
  }
}
