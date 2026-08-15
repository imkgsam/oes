import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  EnsureTenantRoleInstanceFromTemplateResponse,
  GrantInitialAccessForTenantAccountResponse,
  PERMISSION_MANAGEMENT_SERVICE_NAME,
  PermissionManagementServiceClient
} from '@oes/common/generated/permission_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { PermissionTenantOnboardingPort } from '../../application/ports/permission-tenant-onboarding.port'
import { TenantOrgFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

/** PermissionTenantOnboardingGrpcAdapter calls permission-service tenant onboarding APIs without owning RBAC truth. */
@Injectable()
export class PermissionTenantOnboardingGrpcAdapter implements PermissionTenantOnboardingPort, OnModuleInit {
  private readonly logger = new Logger(PermissionTenantOnboardingGrpcAdapter.name)
  private client!: PermissionManagementServiceClient
  private readonly trusted = new TenantOrgFoundationTrustedGrpcExecutionProducer()

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly permissionClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.client = this.permissionClient.getService<PermissionManagementServiceClient>(PERMISSION_MANAGEMENT_SERVICE_NAME)
  }

  async ensureTenantAdminRole(input: { tenantId: string; idempotencyKey: string }) {
    return this.ensureTenantRoleFromTemplate({
      ...input,
      templateRoleCode: 'tenant.admin',
      name: 'Tenant Admin',
      reason: 'tenant onboarding first admin'
    })
  }

  async ensureHrAdminRole(input: { tenantId: string; idempotencyKey: string }) {
    return this.ensureTenantRoleFromTemplate({
      ...input,
      templateRoleCode: 'hr.admin',
      name: 'HR Admin',
      reason: 'tenant onboarding first admin hr access'
    })
  }

  async ensureAccountBasicRole(input: { tenantId: string; idempotencyKey: string }) {
    return this.ensureTenantRoleFromTemplate({
      ...input,
      templateRoleCode: 'account.basic',
      name: 'Account Basic',
      reason: 'tenant onboarding default employee access'
    })
  }

  async grantTenantAdmin(input: { tenantId: string; accountId: string; roleId: string; idempotencyKey: string }) {
    return this.grantInitialTenantRole({
      ...input,
      reason: 'tenant onboarding first admin'
    })
  }

  async grantHrAdmin(input: { tenantId: string; accountId: string; roleId: string; idempotencyKey: string }) {
    return this.grantInitialTenantRole({
      ...input,
      reason: 'tenant onboarding first admin hr access'
    })
  }

  /** ensureTenantRoleFromTemplate asks permission-service to derive one tenant role instance from a template code. */
  private async ensureTenantRoleFromTemplate(input: {
    tenantId: string
    idempotencyKey: string
    templateRoleCode: string
    name: string
    reason: string
  }) {
    const response = await safeGrpcCall<EnsureTenantRoleInstanceFromTemplateResponse>(
      this.client.ensureTenantRoleInstanceFromTemplate(
        {
          tenantId: input.tenantId,
          templateRoleCode: input.templateRoleCode,
          idempotencyKey: input.idempotencyKey,
          name: input.name,
          reason: input.reason
        },
        await this.trusted.forBusinessCall('permission-service', [
          'permission.role_instance.create_from_template'
        ])
      ),
      { caller: 'tenant-org-service', method: 'PermissionManagementService.ensureTenantRoleInstanceFromTemplate' }
    )
    const roleId = response.role?.id?.trim()
    if (!roleId) {
      this.logger.error(`permission-service returned empty ${input.templateRoleCode} role id during tenant onboarding`)
      throw new Error(`permission-service did not return ${input.templateRoleCode} role id`)
    }
    return { roleId, roleCode: response.role?.code || input.templateRoleCode, created: response.created }
  }

  /** grantInitialTenantRole delegates account-role binding to permission-service onboarding grant contract. */
  private async grantInitialTenantRole(input: {
    tenantId: string
    accountId: string
    roleId: string
    idempotencyKey: string
    reason: string
  }) {
    const response = await safeGrpcCall<GrantInitialAccessForTenantAccountResponse>(
      this.client.grantInitialAccessForTenantAccount(
        {
          tenantId: input.tenantId,
          accountId: input.accountId,
          roleIds: [input.roleId],
          idempotencyKey: input.idempotencyKey,
          reason: input.reason
        },
        await this.trusted.forBusinessCall('permission-service', ['permission.account.assign_roles'])
      ),
      { caller: 'tenant-org-service', method: 'PermissionManagementService.grantInitialAccessForTenantAccount' }
    )
    return { grantId: response.grant?.id ?? '' }
  }

}
