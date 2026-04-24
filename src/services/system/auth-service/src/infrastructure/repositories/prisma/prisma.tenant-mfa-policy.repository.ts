import { Injectable } from '@nestjs/common'
import { MfaType } from '../../../common/constants'
import {
  TenantMfaFactorPolicySnapshot,
  TenantMfaScenario,
  TenantMfaPolicyEntity
} from '../../../domain/entities/tenant-mfa-policy.entity'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import { PrismaService } from '../../prisma/prisma.service'

const MANAGED_TENANT_MFA_SCENARIOS: TenantMfaScenario[] = [
  'LOGIN',
  'NEW_DEVICE_LOGIN',
  'CHANGE_PASSWORD',
  'CHANGE_CONTACT'
]

@Injectable()
// Persists tenant-scoped MFA scenario requirements and the shared factor ordering snapshot.
export class PrismaTenantMfaPolicyRepository implements TenantMfaPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantPolicy(tenantId: string): Promise<TenantMfaPolicyEntity> {
    const [scenarioPolicies, factorPolicies] = await Promise.all([
      this.prisma.tenantMfaScenarioPolicy.findMany({
        where: { tenantId }
      }),
      this.prisma.tenantMfaFactorPolicy.findMany({
        where: { tenantId }
      })
    ])

    const entity = TenantMfaPolicyEntity.defaults(tenantId)
    for (const scenarioPolicy of scenarioPolicies) {
      entity.setScenarioRequired(scenarioPolicy.scenario as TenantMfaScenario, Boolean(scenarioPolicy.required))
    }
    if (factorPolicies.length > 0) {
      entity.replaceFactors(
        factorPolicies.map((policy) => ({
          factor: policy.factor as TenantMfaFactorPolicySnapshot['factor'],
          enabled: policy.enabled,
          priority: policy.priority,
          updatedAt: policy.updatedAt,
          updatedBy: policy.updatedBy
        }))
      )
    }

    return entity
  }

  async saveTenantPolicy(policy: TenantMfaPolicyEntity): Promise<TenantMfaPolicyEntity> {
    await this.prisma.$transaction(async (tx) => {
      for (const scenario of MANAGED_TENANT_MFA_SCENARIOS) {
        await tx.tenantMfaScenarioPolicy.upsert({
          where: {
            tenantId_scenario: {
              tenantId: policy.tenantId,
              scenario
            }
          },
          update: {
            required: policy.isScenarioRequired(scenario)
          },
          create: {
            tenantId: policy.tenantId,
            scenario,
            required: policy.isScenarioRequired(scenario)
          }
        })
      }

      for (const factorPolicy of policy.getFactors()) {
        await tx.tenantMfaFactorPolicy.upsert({
          where: {
            tenantId_factor: {
              tenantId: policy.tenantId,
              factor: factorPolicy.factor as unknown as MfaType
            }
          },
          update: {
            enabled: factorPolicy.enabled,
            priority: factorPolicy.priority,
            updatedBy: factorPolicy.updatedBy ?? null
          },
          create: {
            tenantId: policy.tenantId,
            factor: factorPolicy.factor as unknown as MfaType,
            enabled: factorPolicy.enabled,
            priority: factorPolicy.priority,
            updatedBy: factorPolicy.updatedBy ?? null
          }
        })
      }
    })

    return this.getTenantPolicy(policy.tenantId)
  }
}
