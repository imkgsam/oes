import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  EnsureTenantRoleInstanceFromTemplateResponse,
  GrantInitialAccessForTenantAccountResponse,
  PERMISSION_MANAGEMENT_SERVICE_NAME,
  PermissionManagementServiceClient
} from '@oes/common/generated/permission_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { PermissionTenantOnboardingPort } from '../../application/ports/permission-tenant-onboarding.port'
import { buildTenantOnboardingMetadata } from './tenant-onboarding-metadata'

/** PermissionTenantOnboardingGrpcAdapter calls permission-service tenant onboarding APIs without owning RBAC truth. */
@Injectable()
export class PermissionTenantOnboardingGrpcAdapter implements PermissionTenantOnboardingPort, OnModuleInit {
  private readonly logger = new Logger(PermissionTenantOnboardingGrpcAdapter.name)
  private client!: PermissionManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly permissionClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.client = this.permissionClient.getService<PermissionManagementServiceClient>(PERMISSION_MANAGEMENT_SERVICE_NAME)
  }

  async ensureTenantAdminRole(input: { tenantId: string; idempotencyKey: string }) {
    const response = await safeGrpcCall<EnsureTenantRoleInstanceFromTemplateResponse>(
      this.client.ensureTenantRoleInstanceFromTemplate(
        {
          tenantId: input.tenantId,
          templateRoleCode: 'tenant.admin',
          idempotencyKey: input.idempotencyKey,
          name: 'Tenant Admin',
          reason: 'tenant onboarding first admin'
        },
        this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'PermissionManagementService.ensureTenantRoleInstanceFromTemplate' }
    )
    const roleId = response.role?.id?.trim()
    if (!roleId) {
      this.logger.error('permission-service returned empty tenant admin role id during tenant onboarding')
      throw new Error('permission-service did not return tenant admin role id')
    }
    return { roleId, roleCode: response.role?.code || 'tenant.admin', created: response.created }
  }

  async grantTenantAdmin(input: { tenantId: string; accountId: string; roleId: string; idempotencyKey: string }) {
    const response = await safeGrpcCall<GrantInitialAccessForTenantAccountResponse>(
      this.client.grantInitialAccessForTenantAccount(
        {
          tenantId: input.tenantId,
          accountId: input.accountId,
          roleIds: [input.roleId],
          idempotencyKey: input.idempotencyKey,
          reason: 'tenant onboarding first admin'
        },
        this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'PermissionManagementService.grantInitialAccessForTenantAccount' }
    )
    return { grantId: response.grant?.id ?? '' }
  }

  /** buildMetadata propagates tenant-org request context into permission-service calls. */
  private buildMetadata() {
    return buildTenantOnboardingMetadata(this.metadataFactory, this.requestContextStore)
  }
}
