import { Controller, Inject, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AuthenticatedOperatorGuard,
  getAuthenticatedGrpcRequestContext,
  GrpcRequestContextInterceptor,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  InternalServiceGuard,
  IDENTITY_ORG_PERMISSION_CODES,
  IDENTITY_MACHINE_PERMISSION_CODES,
  OPERATOR_PERMISSION_RESOLVER,
  OperatorPermissionResolver,
  PermissionGuard,
  RequirePermission,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import {
  AccountContactAssetResponse,
  AccountOrgMembershipResponse,
  ApiKeyResponse,
  AssignAccountWorkEmailAssetRequest,
  AssignAccountWorkPhoneAssetRequest,
  CreateUserAccountRequest,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  CreateServiceAccountRequest,
  GetAccountByIdResponse,
  GetUserByIdResponse,
  RevokeAccountWorkEmailAssetRequest,
  RevokeAccountWorkPhoneAssetRequest,
  ServiceAccountResponse,
  SetAccountPrimaryWorkEmailAssetRequest,
  SetAccountPrimaryWorkPhoneAssetRequest,
  SetServiceAccountEnabledRequest,
  SetAccountWorkEmailAssetStatusRequest,
  SetAccountWorkPhoneAssetStatusRequest,
  AddAccountOrgMembershipRequest,
  IdentityManagementServiceController,
  IdentityManagementServiceControllerMethods,
  RemoveAccountOrgMembershipRequest,
  RevokeApiKeyRequest,
  RotateApiKeyRequest,
  RotateApiKeyResponse,
  SetAccountPrimaryOrgRequest,
  SetAccountPrimaryOrgResponse,
  UpdateUserBasicInfoRequest,
  UpdateAccountProfileRequest
} from '@oes/common/generated/identity_service'
import {
  CreateUserAccountCommand,
  UpdateAccountProfileCommand,
  UpdateUserBasicInfoCommand,
  AssignAccountWorkEmailAssetCommand,
  AssignAccountWorkPhoneAssetCommand,
  CreateApiKeyCommand,
  CreateServiceAccountCommand,
  RevokeAccountWorkEmailAssetCommand,
  RevokeAccountWorkPhoneAssetCommand,
  RevokeApiKeyCommand,
  RotateApiKeyCommand,
  SetAccountPrimaryWorkEmailAssetCommand,
  SetAccountPrimaryWorkPhoneAssetCommand,
  SetServiceAccountEnabledCommand,
  SetAccountWorkEmailAssetStatusCommand,
  SetAccountWorkPhoneAssetStatusCommand,
  AddAccountOrgMembershipCommand,
  RemoveAccountOrgMembershipCommand,
  SetAccountPrimaryOrgCommand
} from '../../application/commands'
import { IdentityAuditService } from '../../application/services/identity-audit.service'
import { classifyAuditResult, extractAuditErrorDetails } from './grpc-audit-support'
import { IdentityGrpcPresenter } from './identity-grpc.presenter'
import { getOptionalOperatorScope, getRequiredOperatorId } from './grpc-request-context'

@UseFilters(GrpcExceptionFilter)
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@IdentityManagementServiceControllerMethods()
export class IdentityManagementGrpcController implements IdentityManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly identityAuditService: IdentityAuditService,
    @Inject(OPERATOR_PERMISSION_RESOLVER)
    private readonly permissionResolver: OperatorPermissionResolver
  ) {}

  @RequirePermission(IDENTITY_MACHINE_PERMISSION_CODES.CREATE_API_KEY)
  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'API_KEY_CREATED',
        module: 'machine',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'api_key', resourceId: null },
        details: {
          serviceAccountId: request.serviceAccountId!,
          expiresAt: request.expiresAt || null
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreateApiKeyCommand({
            serviceAccountId: request.serviceAccountId!,
            expiresAt: request.expiresAt || undefined,
            operatorId,
            operatorScope
          })
        )

        this.identityAuditService.emitApiKeyEvent('API_KEY_CREATED', result.apiKey, operatorId)

        return {
          apiKey: {
            apiKey: IdentityGrpcPresenter.toApiKey(result.apiKey),
            secret: result.secret
          }
        }
      }
    )
  }

  @RequirePermission(IDENTITY_MACHINE_PERMISSION_CODES.CREATE_SERVICE_ACCOUNT)
  async createServiceAccount(
    request: CreateServiceAccountRequest
  ): Promise<ServiceAccountResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'SERVICE_ACCOUNT_CREATED',
        module: 'machine',
        operatorId,
        scope: { tenantId: request.tenantId || null, orgId: null },
        resource: { resourceType: 'service_account', resourceId: null },
        details: {
          scopeLevel: request.scopeLevel!,
          accountType: request.type!,
          name: request.name!
        }
      },
      async () => {
        const account = await this.commandBus.execute(
          new CreateServiceAccountCommand({
            tenantId: request.tenantId || undefined,
            scopeLevel: request.scopeLevel!,
            type: request.type!,
            name: request.name!,
            description: request.description || undefined,
            operatorId,
            operatorScope
          })
        )

        this.identityAuditService.emitServiceAccountEvent(
          'SERVICE_ACCOUNT_CREATED',
          account,
          operatorId
        )

        return {
          account: IdentityGrpcPresenter.toServiceAccount(account)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_MACHINE_PERMISSION_CODES.REVOKE_API_KEY)
  async revokeApiKey(request: RevokeApiKeyRequest): Promise<ApiKeyResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'API_KEY_REVOKED',
        module: 'machine',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'api_key', resourceId: request.apiKeyId! },
        details: {
          apiKeyId: request.apiKeyId!
        }
      },
      async () => {
        const apiKey = await this.commandBus.execute(
          new RevokeApiKeyCommand(request.apiKeyId!, operatorId, operatorScope)
        )

        this.identityAuditService.emitApiKeyEvent('API_KEY_REVOKED', apiKey, operatorId)

        return {
          apiKey: IdentityGrpcPresenter.toApiKey(apiKey)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_MACHINE_PERMISSION_CODES.ROTATE_API_KEY)
  async rotateApiKey(request: RotateApiKeyRequest): Promise<RotateApiKeyResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'API_KEY_ROTATED',
        module: 'machine',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'api_key', resourceId: request.apiKeyId! },
        details: {
          apiKeyId: request.apiKeyId!,
          expiresAt: request.expiresAt || null
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new RotateApiKeyCommand({
            apiKeyId: request.apiKeyId!,
            expiresAt: request.expiresAt || undefined,
            operatorId,
            operatorScope
          })
        )

        this.identityAuditService.emitApiKeyEvent('API_KEY_ROTATED', result.apiKey, operatorId)

        return {
          apiKey: {
            apiKey: IdentityGrpcPresenter.toApiKey(result.apiKey),
            secret: result.secret
          }
        }
      }
    )
  }

  @RequirePermission(IDENTITY_MACHINE_PERMISSION_CODES.UPDATE_SERVICE_ACCOUNT_STATUS)
  async setServiceAccountEnabled(
    request: SetServiceAccountEnabledRequest
  ): Promise<ServiceAccountResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'SERVICE_ACCOUNT_STATUS_CHANGED',
        module: 'machine',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'service_account', resourceId: request.serviceAccountId! },
        details: {
          serviceAccountId: request.serviceAccountId!,
          enabled: request.enabled!
        }
      },
      async () => {
        const account = await this.commandBus.execute(
          new SetServiceAccountEnabledCommand(
            request.serviceAccountId!,
            request.enabled!,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitServiceAccountEvent(
          'SERVICE_ACCOUNT_STATUS_CHANGED',
          account,
          operatorId
        )

        return {
          account: IdentityGrpcPresenter.toServiceAccount(account)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT)
  async createUserAccount(request: CreateUserAccountRequest): Promise<GetAccountByIdResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    const account = await this.commandBus.execute(
      new CreateUserAccountCommand({
        scopeLevel: request.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
        tenantId: request.tenantId || undefined,
        displayName: request.displayName || undefined,
        username: request.username || undefined,
        email: request.email || undefined,
        phone: request.phone || undefined,
        operatorId,
        operatorScope
      })
    )

    return {
      account: {
        id: account.id,
        userId: account.userId,
        tenantId: account.tenantId ?? '',
        avatarUrl: account.avatarUrl ?? '',
        displayName: account.displayName ?? '',
        bio: account.bio ?? '',
        isEnabled: account.isEnabled,
        scopeLevel: account.scopeLevel
      }
    }
  }

  async updateAccountProfile(
    request: UpdateAccountProfileRequest
  ): Promise<GetAccountByIdResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_PROFILE_UPDATED',
        module: 'account',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account', resourceId: request.accountId! },
        details: {
          accountId: request.accountId!,
          avatarUpdated: Boolean(request.avatarUrl),
          displayNameUpdated: request.displayName !== undefined,
          bioUpdated: request.bio !== undefined,
          enabledUpdated: request.isEnabled !== undefined
        }
      },
      async () => {
        await this.enforceAccountProfileUpdatePermissions(request)

        const account = await this.commandBus.execute(
          new UpdateAccountProfileCommand(request.accountId!, {
            avatarUrl: request.avatarUrl || undefined,
            displayName: request.displayName || undefined,
            bio: request.bio || undefined,
            isEnabled: request.isEnabled,
            operatorId,
            operatorScope
          })
        )

        return {
          account: {
            id: account.id,
            userId: account.userId,
            tenantId: account.tenantId ?? '',
            avatarUrl: account.avatarUrl ?? '',
            displayName: account.displayName ?? '',
            bio: account.bio ?? '',
            isEnabled: account.isEnabled,
            scopeLevel: account.scopeLevel
          }
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_PROFILE)
  async updateUserBasicInfo(request: UpdateUserBasicInfoRequest): Promise<GetUserByIdResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_PROFILE_UPDATED',
        module: 'account',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'user', resourceId: request.userId! },
        details: {
          accountId: request.accountId!,
          userId: request.userId!,
          emailUpdated: request.email !== undefined,
          phoneUpdated: request.phone !== undefined
        }
      },
      async () => {
        const user = await this.commandBus.execute(
          new UpdateUserBasicInfoCommand({
            accountId: request.accountId ?? '',
            userId: request.userId ?? '',
            email: request.email || undefined,
            phone: request.phone || undefined,
            operatorId,
            operatorScope
          })
        )

        return {
          user: {
            id: user.id,
            username: user.username ?? '',
            personalEmail: user.personalEmail ?? '',
            personalPhone: user.personalPhone ?? '',
            isActive: user.isActive
          }
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.ASSIGN_WORK_EMAIL)
  async assignAccountWorkEmailAsset(
    request: AssignAccountWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_WORK_EMAIL_ASSIGNED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: null },
        details: {
          accountId: request.accountId!,
          assetType: 'WORK_EMAIL',
          assetValue: request.email!,
          isPrimary: request.isPrimary!
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new AssignAccountWorkEmailAssetCommand(
            request.accountId!,
            request.email!,
            request.isPrimary!,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_WORK_EMAIL_ASSIGNED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.ASSIGN_WORK_PHONE)
  async assignAccountWorkPhoneAsset(
    request: AssignAccountWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_WORK_PHONE_ASSIGNED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: null },
        details: {
          accountId: request.accountId!,
          assetType: 'WORK_PHONE',
          assetValue: request.phone!,
          isPrimary: request.isPrimary!
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new AssignAccountWorkPhoneAssetCommand(
            request.accountId!,
            request.phone!,
            request.isPrimary!,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_WORK_PHONE_ASSIGNED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.REVOKE_WORK_EMAIL)
  async revokeAccountWorkEmailAsset(
    request: RevokeAccountWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_WORK_EMAIL_REVOKED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: request.assetId! },
        details: {
          assetId: request.assetId!,
          assetType: 'WORK_EMAIL'
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new RevokeAccountWorkEmailAssetCommand(request.assetId!, operatorId, operatorScope)
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_WORK_EMAIL_REVOKED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.REVOKE_WORK_PHONE)
  async revokeAccountWorkPhoneAsset(
    request: RevokeAccountWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_WORK_PHONE_REVOKED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: request.assetId! },
        details: {
          assetId: request.assetId!,
          assetType: 'WORK_PHONE'
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new RevokeAccountWorkPhoneAssetCommand(request.assetId!, operatorId, operatorScope)
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_WORK_PHONE_REVOKED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.SET_PRIMARY_WORK_EMAIL)
  async setAccountPrimaryWorkEmailAsset(
    request: SetAccountPrimaryWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_PRIMARY_WORK_EMAIL_CHANGED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: request.assetId! },
        details: {
          assetId: request.assetId!,
          assetType: 'WORK_EMAIL'
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new SetAccountPrimaryWorkEmailAssetCommand(request.assetId!, operatorId, operatorScope)
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_PRIMARY_WORK_EMAIL_CHANGED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.SET_PRIMARY_WORK_PHONE)
  async setAccountPrimaryWorkPhoneAsset(
    request: SetAccountPrimaryWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_PRIMARY_WORK_PHONE_CHANGED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: request.assetId! },
        details: {
          assetId: request.assetId!,
          assetType: 'WORK_PHONE'
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new SetAccountPrimaryWorkPhoneAssetCommand(request.assetId!, operatorId, operatorScope)
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_PRIMARY_WORK_PHONE_CHANGED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.SET_WORK_EMAIL_STATUS)
  async setAccountWorkEmailAssetStatus(
    request: SetAccountWorkEmailAssetStatusRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_WORK_EMAIL_STATUS_CHANGED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: request.assetId! },
        details: {
          assetId: request.assetId!,
          assetType: 'WORK_EMAIL',
          enabled: request.enabled!
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new SetAccountWorkEmailAssetStatusCommand(
            request.assetId!,
            request.enabled!,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_WORK_EMAIL_STATUS_CHANGED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ACCOUNT_PERMISSION_CODES.SET_WORK_PHONE_STATUS)
  async setAccountWorkPhoneAssetStatus(
    request: SetAccountWorkPhoneAssetStatusRequest
  ): Promise<AccountContactAssetResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_WORK_PHONE_STATUS_CHANGED',
        module: 'contact',
        operatorId,
        scope: { tenantId: null, orgId: null },
        resource: { resourceType: 'account_contact_asset', resourceId: request.assetId! },
        details: {
          assetId: request.assetId!,
          assetType: 'WORK_PHONE',
          enabled: request.enabled!
        }
      },
      async () => {
        const asset = await this.commandBus.execute(
          new SetAccountWorkPhoneAssetStatusCommand(
            request.assetId!,
            request.enabled!,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitContactAssetEvent(
          'ACCOUNT_WORK_PHONE_STATUS_CHANGED',
          asset,
          operatorId
        )

        return {
          asset: IdentityGrpcPresenter.toContactAsset(asset)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ORG_PERMISSION_CODES.ADD_ACCOUNT_MEMBERSHIP)
  async addAccountOrgMembership(
    request: AddAccountOrgMembershipRequest
  ): Promise<AccountOrgMembershipResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_ORG_MEMBERSHIP_ADDED',
        module: 'org',
        operatorId,
        scope: { tenantId: null, orgId: request.orgId! },
        resource: { resourceType: 'account_org_membership', resourceId: null },
        details: {
          accountId: request.accountId!,
          orgId: request.orgId!
        }
      },
      async () => {
        const membership = await this.commandBus.execute(
          new AddAccountOrgMembershipCommand(
            request.accountId!,
            request.orgId!,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitOrgMembershipEvent(
          'ACCOUNT_ORG_MEMBERSHIP_ADDED',
          operatorId,
          {
            accountId: request.accountId!,
            orgId: request.orgId!,
            membership
          }
        )

        return {
          membership: IdentityGrpcPresenter.toAccountOrgMembership(membership)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ORG_PERMISSION_CODES.REMOVE_ACCOUNT_MEMBERSHIP)
  async removeAccountOrgMembership(
    request: RemoveAccountOrgMembershipRequest
  ): Promise<AccountOrgMembershipResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_ORG_MEMBERSHIP_REMOVED',
        module: 'org',
        operatorId,
        scope: { tenantId: null, orgId: request.orgId! },
        resource: { resourceType: 'account_org_membership', resourceId: null },
        details: {
          accountId: request.accountId!,
          orgId: request.orgId!
        }
      },
      async () => {
        const membership = await this.commandBus.execute(
          new RemoveAccountOrgMembershipCommand(
            request.accountId!,
            request.orgId!,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitOrgMembershipEvent(
          'ACCOUNT_ORG_MEMBERSHIP_REMOVED',
          operatorId,
          {
            accountId: request.accountId!,
            orgId: request.orgId!,
            membership
          }
        )

        return {
          membership: IdentityGrpcPresenter.toAccountOrgMembership(membership)
        }
      }
    )
  }

  @RequirePermission(IDENTITY_ORG_PERMISSION_CODES.SET_ACCOUNT_PRIMARY_ORG)
  async setAccountPrimaryOrg(
    request: SetAccountPrimaryOrgRequest
  ): Promise<SetAccountPrimaryOrgResponse> {
    const operatorId = getRequiredOperatorId(request)
    const operatorScope = getOptionalOperatorScope(request)
    return this.executeWithAudit(
      {
        eventType: 'ACCOUNT_PRIMARY_ORG_CHANGED',
        module: 'org',
        operatorId,
        scope: {
          tenantId: null,
          orgId: Object.prototype.hasOwnProperty.call(request, 'orgId') ? request.orgId! : null
        },
        resource: { resourceType: 'account_org_membership', resourceId: null },
        details: {
          accountId: request.accountId!,
          orgId: Object.prototype.hasOwnProperty.call(request, 'orgId') ? request.orgId! : null
        }
      },
      async () => {
        const membership = await this.commandBus.execute(
          new SetAccountPrimaryOrgCommand(
            request.accountId!,
            Object.prototype.hasOwnProperty.call(request, 'orgId') ? request.orgId : undefined,
            operatorId,
            operatorScope
          )
        )

        this.identityAuditService.emitOrgMembershipEvent(
          'ACCOUNT_PRIMARY_ORG_CHANGED',
          operatorId,
          {
            accountId: request.accountId!,
            orgId: Object.prototype.hasOwnProperty.call(request, 'orgId')
              ? request.orgId
              : undefined,
            membership
          }
        )

        if (!membership) {
          return {}
        }

        return {
          membership: IdentityGrpcPresenter.toAccountOrgMembership(membership)
        }
      }
    )
  }

  private async executeWithAudit<T>(
    context: {
      eventType: Parameters<IdentityAuditService['emitEnvelope']>[0]
      module: Parameters<IdentityAuditService['emitEnvelope']>[1]
      operatorId: string
      scope: { tenantId: string | null; orgId: string | null }
      resource: { resourceType: string; resourceId: string | null }
      details: Record<string, unknown>
    },
    action: () => Promise<T>
  ): Promise<T> {
    try {
      return await action()
    } catch (error) {
      this.identityAuditService.emitEnvelope(context.eventType, context.module, {
        operator: {
          operatorId: context.operatorId,
          operatorType: 'HUMAN'
        },
        scope: context.scope,
        resource: context.resource,
        result: classifyAuditResult(error),
        details: {
          ...context.details,
          ...extractAuditErrorDetails(error)
        }
      })
      throw error
    }
  }

  // Applies field-level account-profile permission checks for the merged profile update interface.
  private async enforceAccountProfileUpdatePermissions(
    request: UpdateAccountProfileRequest
  ): Promise<void> {
    if (request.avatarUrl !== undefined || request.displayName !== undefined || request.bio !== undefined) {
      await this.requireOperatorPermission(
        request,
        IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_PROFILE
      )
    }

    if (request.isEnabled !== undefined) {
      await this.requireOperatorPermission(
        request,
        IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_STATUS
      )
    }
  }

  // Resolves one operator permission code from the authenticated gRPC request context for interface-layer authorization checks.
  private async requireOperatorPermission(
    request: object,
    permissionCode: string
  ): Promise<void> {
    const operatorContext = getAuthenticatedGrpcRequestContext(request)?.operatorContext

    if (!operatorContext) {
      throw ExceptionFactory.application(ACCESS_DENIED, {
        requiredPermission: permissionCode
      })
    }

    const permissions = await this.permissionResolver.resolvePermissions(operatorContext)

    if (!permissions.includes(permissionCode)) {
      throw ExceptionFactory.application(ACCESS_DENIED, {
        requiredPermission: permissionCode
      })
    }
  }
}
