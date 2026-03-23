import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountOrgMembershipEntity } from '../../../domain/entities/account-org-membership.entity'
import { AccountOrgMembershipRepository } from '../../../domain/repositories/account-org-membership.repository'
import { ListAccountOrgMembershipsQuery } from './list-account-org-memberships.query'

@QueryHandler(ListAccountOrgMembershipsQuery)
export class ListAccountOrgMembershipsHandler
  implements IQueryHandler<ListAccountOrgMembershipsQuery, AccountOrgMembershipEntity[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP)
    private readonly membershipRepository: AccountOrgMembershipRepository
  ) {}

  execute(query: ListAccountOrgMembershipsQuery): Promise<AccountOrgMembershipEntity[]> {
    return this.membershipRepository.listByAccountId(query.accountId)
  }
}
