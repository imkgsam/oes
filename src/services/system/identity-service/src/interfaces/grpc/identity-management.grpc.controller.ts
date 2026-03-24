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
  RevokeAccountWorkEmailAssetRequest,
  RevokeAccountWorkPhoneAssetRequest,
  SetAccountPrimaryWorkEmailAssetRequest,
  SetAccountPrimaryWorkPhoneAssetRequest,
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
  RevokeAccountWorkEmailAssetCommand,
  RevokeAccountWorkPhoneAssetCommand,
  SetAccountPrimaryWorkEmailAssetCommand,
  SetAccountPrimaryWorkPhoneAssetCommand,
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

  async assignAccountWorkEmailAsset(
    request: AssignAccountWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id ?? ''
    const asset = await this.commandBus.execute(
      new AssignAccountWorkEmailAssetCommand(
        request.accountId ?? '',
        request.email ?? '',
        request.isPrimary ?? false,
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
    const operatorId = authenticatedContext?.operatorContext?.operator_id ?? ''
    const asset = await this.commandBus.execute(
      new AssignAccountWorkPhoneAssetCommand(
        request.accountId ?? '',
        request.phone ?? '',
        request.isPrimary ?? false,
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
    const operatorId = authenticatedContext?.operatorContext?.operator_id ?? ''
    const asset = await this.commandBus.execute(
      new RevokeAccountWorkEmailAssetCommand(request.assetId ?? '', operatorId)
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async revokeAccountWorkPhoneAsset(
    request: RevokeAccountWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id ?? ''
    const asset = await this.commandBus.execute(
      new RevokeAccountWorkPhoneAssetCommand(request.assetId ?? '', operatorId)
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountPrimaryWorkEmailAsset(
    request: SetAccountPrimaryWorkEmailAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(
      new SetAccountPrimaryWorkEmailAssetCommand(request.assetId ?? '')
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountPrimaryWorkPhoneAsset(
    request: SetAccountPrimaryWorkPhoneAssetRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(
      new SetAccountPrimaryWorkPhoneAssetCommand(request.assetId ?? '')
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountWorkEmailAssetStatus(
    request: SetAccountWorkEmailAssetStatusRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(
      new SetAccountWorkEmailAssetStatusCommand(request.assetId ?? '', request.enabled ?? false)
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async setAccountWorkPhoneAssetStatus(
    request: SetAccountWorkPhoneAssetStatusRequest
  ): Promise<AccountContactAssetResponse> {
    const asset = await this.commandBus.execute(
      new SetAccountWorkPhoneAssetStatusCommand(request.assetId ?? '', request.enabled ?? false)
    )

    return {
      asset: this.toContactAsset(asset)
    }
  }

  async addAccountOrgMembership(
    request: AddAccountOrgMembershipRequest
  ): Promise<AccountOrgMembershipResponse> {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(request)
    const operatorId = authenticatedContext?.operatorContext?.operator_id ?? ''
    const membership = await this.commandBus.execute(
      new AddAccountOrgMembershipCommand(request.accountId ?? '', request.orgId ?? '', operatorId)
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
    const operatorId = authenticatedContext?.operatorContext?.operator_id ?? ''
    const membership = await this.commandBus.execute(
      new RemoveAccountOrgMembershipCommand(
        request.accountId ?? '',
        request.orgId ?? '',
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
    const operatorId = authenticatedContext?.operatorContext?.operator_id ?? ''
    const membership = await this.commandBus.execute(
      new SetAccountPrimaryOrgCommand(request.accountId ?? '', request.orgId || undefined, operatorId)
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
}
