import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetPolicyByIdQuery } from './get-policy-by-id.query'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { POLICY_NOT_FOUND } from '../../../common/constants/exception-enums/permission-service.errors'

@QueryHandler(GetPolicyByIdQuery)
export class GetPolicyByIdHandler implements IQueryHandler<GetPolicyByIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.POLICY)
    private readonly policyRepo: PolicyRepository
  ) {}

  async execute(query: GetPolicyByIdQuery): Promise<Policy> {
    const policy = await this.policyRepo.findById(query.id)
    if (!policy) throw ExceptionFactory.domain(POLICY_NOT_FOUND)
    return policy
  }
}
