import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ListPoliciesPagedQuery } from './list-policies-paged.query'

@QueryHandler(ListPoliciesPagedQuery)
export class ListPoliciesPagedHandler implements IQueryHandler<ListPoliciesPagedQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(query: ListPoliciesPagedQuery): Promise<{
    policies: Policy[]
    total: number
    page: number
    pageSize: number
  }> {
    return this.policyRepo.findPaged({
      page: query.page,
      pageSize: query.pageSize,
      tenantId: query.tenantId,
      permissionCode: query.permissionCode,
      isEnabled: query.isEnabled,
      keyword: query.keyword
    })
  }
}
