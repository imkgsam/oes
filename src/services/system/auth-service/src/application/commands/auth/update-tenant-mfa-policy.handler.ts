import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { TenantMfaFactorPolicySnapshot } from '../../../domain/entities/tenant-mfa-policy.entity'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import { UpdateTenantMfaPolicyCommand } from './update-tenant-mfa-policy.command'

export interface TenantMfaPolicyView {
  factors: TenantMfaFactorPolicySnapshot[]
  loginRequired: boolean
  tenantId: string
}

@CommandHandler(UpdateTenantMfaPolicyCommand)
// Persists one tenant-scoped login MFA policy snapshot used by post-account-selection login MFA orchestration.
export class UpdateTenantMfaPolicyHandler
  implements ICommandHandler<UpdateTenantMfaPolicyCommand, TenantMfaPolicyView>
{
  constructor(
    @Inject(REPO.TENANT_MFA_POLICY)
    private readonly tenantMfaPolicyRepository: TenantMfaPolicyRepository
  ) {}

  async execute(command: UpdateTenantMfaPolicyCommand): Promise<TenantMfaPolicyView> {
    const policy = await this.tenantMfaPolicyRepository.getTenantPolicy(command.tenantId)
    policy.setLoginRequired(command.loginRequired)
    policy.replaceFactors(
      command.factors.map((factor) => ({
        factor: factor.factor,
        enabled: factor.enabled,
        priority: factor.priority,
        updatedBy: command.updatedBy
      }))
    )

    const saved = await this.tenantMfaPolicyRepository.saveTenantPolicy(policy)
    return {
      tenantId: saved.tenantId,
      loginRequired: saved.isLoginRequired(),
      factors: saved.getFactors()
    }
  }
}
