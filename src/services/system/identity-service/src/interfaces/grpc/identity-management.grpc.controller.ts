import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  AuthenticatedOperatorGuard,
  getAuthenticatedGrpcRequestContext,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/security'
import {
  AccountContactAssetResponse,
  AccountOrgMembershipResponse,
  AssignAccountWorkEmailAssetRequest,
  AssignAccountWorkPhoneAssetRequest,
  CreateServiceAccountRequest,
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
  SetAccountPrimaryOrgRequest,
  SetAccountPrimaryOrgResponse
} from '@oes/common/generated/identity_service'
import {
  AssignAccountWorkEmailAssetCommand,
  AssignAccountWorkPhoneAssetCommand,
  CreateServiceAccountCommand,
  RevokeAccountWorkEmailAssetCommand,
  RevokeAccountWorkPhoneAssetCommand,
  SetAccountPrimaryWorkEmailAssetCommand,
  SetAccountPrimaryWorkPhoneAssetCommand,
  SetServiceAccountEnabledCommand,
  SetAccountWorkEmailAssetStatusCommand,
  SetAccountWorkPhoneAssetStatusCommand,
  AddAccountOrgMembershipCommand,
  RemoveAccountOrgMembershipCommand,
  SetAccountPrimaryOrgCommand
} from '../../application/commands'

@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
@Controller()
@IdentityManagementServiceControllerMethods()
export class IdentityManagementGrpcController
  implements IdentityManagementServiceController
{
  constructor(private readonly commandBus: ValidatingCommandBus) {}

  async createServiceAccount(
    request: CreateServiceAccountRequest
  ): Promise<ServiceAccountResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const account = await this.commandBus.execute(
      new CreateServiceAccountCommand({
        tenantId: request.tenantId || undefined,
        scopeLevel: request.scopeLevel!,
        type: request.type!,
        name: request.name!,
        description: request.description || undefined,
        operatorId
      })
    )

    return {
      account: this.toServiceAccount(account)
    }
  }

  async setServiceAccountEnabled(
    request: SetServiceAccountEnabledRequest
  ): Promise<ServiceAccountResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const account = await this.commandBus.execute(
      new SetServiceAccountEnabledCommand(request.serviceAccountId!, request.enabled!, operatorId)
    )

    return {
      account: this.toServiceAccount(account)
    }
  }

  async assignAccountWorkEmailAsset(
    request: AssignAccountWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const asset = await this.commandBus.execute(
      new AssignAccountWorkEmailAssetCommand(
        request.accountId!,
        request.email!,
        request.isPrimary!,
        operatorId
      )
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async assignAccountWorkPhoneAsset(
    request: AssignAccountWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const asset = await this.commandBus.execute(
      new AssignAccountWorkPhoneAssetCommand(
        request.accountId!,
        request.phone!,
        request.isPrimary!,
        operatorId
      )
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async revokeAccountWorkEmailAsset(
    request: RevokeAccountWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const asset = await this.commandBus.execute(new RevokeAccountWorkEmailAssetCommand(request.assetId!, operatorId))

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async revokeAccountWorkPhoneAsset(
    request: RevokeAccountWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const asset = await this.commandBus.execute(new RevokeAccountWorkPhoneAssetCommand(request.assetId!, operatorId))

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountPrimaryWorkEmailAsset(
    request: SetAccountPrimaryWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(new SetAccountPrimaryWorkEmailAssetCommand(request.assetId!))

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountPrimaryWorkPhoneAsset(
    request: SetAccountPrimaryWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(new SetAccountPrimaryWorkPhoneAssetCommand(request.assetId!))

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountWorkEmailAssetStatus(
    request: SetAccountWorkEmailAssetStatusRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(
      new SetAccountWorkEmailAssetStatusCommand(request.assetId!, request.enabled!)
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountWorkPhoneAssetStatus(
    request: SetAccountWorkPhoneAssetStatusRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(
      new SetAccountWorkPhoneAssetStatusCommand(request.assetId!, request.enabled!)
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async addAccountOrgMembership(
    request: AddAccountOrgMembershipRequest
  ): Promise<AccountOrgMembershipResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const membership = await this.commandBus.execute(
      new AddAccountOrgMembershipCommand(request.accountId!, request.orgId!, operatorId)
    )

    return {
      membership: {
        id: membership.id,
        accountId: membership.accountId,
        orgId: membership.orgId,
        orgName: membership.orgName ?? '',
        orgType: membership.orgType ?? '',
        relationType: membership.relationType,
        isPrimary: membership.isPrimary
      }
    }
  }

  async removeAccountOrgMembership(
    request: RemoveAccountOrgMembershipRequest
  ): Promise<AccountOrgMembershipResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const membership = await this.commandBus.execute(
      new RemoveAccountOrgMembershipCommand(
        request.accountId!,
        request.orgId!,
        operatorId
      )
    )

    return {
      membership: {
        id: membership.id,
        accountId: membership.accountId,
        orgId: membership.orgId,
        orgName: membership.orgName ?? '',
        orgType: membership.orgType ?? '',
        relationType: membership.relationType,
        isPrimary: membership.isPrimary
      }
    }
  }

  async setAccountPrimaryOrg(
    request: SetAccountPrimaryOrgRequest
  ): Promise<SetAccountPrimaryOrgResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id!
    const membership = await this.commandBus.execute(
      new SetAccountPrimaryOrgCommand(
        request.accountId!,
        Object.prototype.hasOwnProperty.call(request, 'orgId') ? request.orgId : undefined,
        operatorId
      )
    )

    if (!membership) {
      return {}
    }

    return {
      membership: {
        id: membership.id,
        accountId: membership.accountId,
        orgId: membership.orgId,
        orgName: membership.orgName ?? '',
        orgType: membership.orgType ?? '',
        relationType: membership.relationType,
        isPrimary: membership.isPrimary
      }
    }
  }

  private toContactAsset(asset: {
    id: string
    tenantId: string
    accountId: string
    type: string
    value: string
    status: string
    isPrimary: boolean
    assignedAt: Date
    revokedAt: Date | null
  }) {
    return {
      id: asset.id,
      tenantId: asset.tenantId,
      accountId: asset.accountId,
      type: asset.type,
      value: asset.value,
      status: asset.status,
      isPrimary: asset.isPrimary,
      assignedAt: asset.assignedAt.toISOString(),
      revokedAt: asset.revokedAt?.toISOString() ?? ''
    }
  }

  private toServiceAccount(account: {
    id: string
    tenantId: string | null
    scopeLevel: string
    type: string
    name: string
    description: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    createdBy: string | null
    disabledAt: Date | null
    disabledBy: string | null
  }) {
    return {
      id: account.id,
      tenantId: account.tenantId ?? '',
      scopeLevel: account.scopeLevel,
      type: account.type,
      name: account.name,
      description: account.description ?? '',
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      createdBy: account.createdBy ?? '',
      disabledAt: account.disabledAt?.toISOString() ?? '',
      disabledBy: account.disabledBy ?? ''
    }
  }
}
