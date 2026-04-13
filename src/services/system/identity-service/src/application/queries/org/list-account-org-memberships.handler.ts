import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { AccountOrgMembershipEntity } from '../../../domain/entities/account-org-membership.entity'
import { AccountOrgMembershipRepository } from '../../../domain/repositories/account-org-membership.repository'
import { AccountOrgMembershipView } from './org-query.result'
import { ListAccountOrgMembershipsQuery } from './list-account-org-memberships.query'

@QueryHandler(ListAccountOrgMembershipsQuery)
export class ListAccountOrgMembershipsHandler
  implements IQueryHandler<ListAccountOrgMembershipsQuery, AccountOrgMembershipView[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP)
    private readonly membershipRepository: AccountOrgMembershipRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListAccountOrgMembershipsQuery): Promise<AccountOrgMembershipView[]> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'account_org_membership',
      action: 'list',
      operatorScope: query.operatorScope
    })

    const memberships = await this.membershipRepository.listByAccountId(query.accountId, queryScope)
    return memberships.map(toAccountOrgMembershipView)
  }
}

function toAccountOrgMembershipView(
  membership: AccountOrgMembershipEntity
): AccountOrgMembershipView {
  return {
    id: membership.id,
    accountId: membership.accountId,
    orgId: membership.orgId,
    orgName: membership.orgName,
    orgType: membership.orgType,
    relationType: membership.relationType,
    isPrimary: membership.isPrimary
  }
}
