import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ListPoliciesQuery } from './list-policies.query'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'

@QueryHandler(ListPoliciesQuery)
export class ListPoliciesHandler implements IQueryHandler<ListPoliciesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(query: ListPoliciesQuery): Promise<Policy[]> {
    if (query.tenantId) {
      return this.policyRepo.findByTenant(query.tenantId)
    }
    return this.policyRepo.findAll()
  }
}
