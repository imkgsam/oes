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
  AccountOrgMembershipResponse,
  AddAccountOrgMembershipRequest,
  IdentityManagementServiceController,
  IdentityManagementServiceControllerMethods,
  RemoveAccountOrgMembershipRequest,
  SetAccountPrimaryOrgRequest,
  SetAccountPrimaryOrgResponse
} from '@oes/common/generated/identity_service'
import {
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
}
