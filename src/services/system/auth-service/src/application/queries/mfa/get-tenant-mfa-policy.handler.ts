import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { TenantMfaFactorPolicySnapshot } from '../../../domain/entities/tenant-mfa-policy.entity'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import { GetTenantMfaPolicyQuery } from './get-tenant-mfa-policy.query'

export interface TenantMfaPolicyQueryResult {
  factors: TenantMfaFactorPolicySnapshot[]
  loginRequired: boolean
  tenantId: string
}

@QueryHandler(GetTenantMfaPolicyQuery)
// Reads one tenant-scoped login MFA policy snapshot without exposing repository details to transport layers.
export class GetTenantMfaPolicyHandler
  implements IQueryHandler<GetTenantMfaPolicyQuery, TenantMfaPolicyQueryResult>
{
  constructor(
    @Inject(REPO.TENANT_MFA_POLICY)
    private readonly tenantMfaPolicyRepository: TenantMfaPolicyRepository
  ) {}

  async execute(query: GetTenantMfaPolicyQuery): Promise<TenantMfaPolicyQueryResult> {
    const policy = await this.tenantMfaPolicyRepository.getTenantPolicy(query.tenantId)
    return {
      tenantId: policy.tenantId,
      loginRequired: policy.isLoginRequired(),
      factors: policy.getFactors()
    }
  }
}
