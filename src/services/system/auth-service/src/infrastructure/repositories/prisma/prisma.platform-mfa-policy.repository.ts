import { Injectable } from '@nestjs/common'
import { MfaType } from '../../../common/constants'
import {
  PlatformMfaFactorPolicySnapshot,
  PlatformMfaPolicyEntity,
  PlatformMfaScenario
} from '../../../domain/entities/platform-mfa-policy.entity'
import { PlatformMfaPolicyRepository } from '../../../domain/repositories/platform-mfa-policy.repository'
import { PrismaService } from '../../prisma/prisma.service'

const PLATFORM_SCOPE_KEY = '__SYSTEM__'
const MANAGED_PLATFORM_MFA_SCENARIOS: PlatformMfaScenario[] = [
  'LOGIN',
  'NEW_DEVICE_LOGIN',
  'CHANGE_PASSWORD',
  'CHANGE_CONTACT'
]

@Injectable()
// Persists the platform-owned MFA policy surface used by SYSTEM accounts.
export class PrismaPlatformMfaPolicyRepository implements PlatformMfaPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformPolicy(): Promise<PlatformMfaPolicyEntity> {
    const [scenarioPolicies, factorPolicies] = await Promise.all([
      this.prisma.platformMfaScenarioPolicy.findMany({
        where: { scopeKey: PLATFORM_SCOPE_KEY }
      }),
      this.prisma.platformMfaFactorPolicy.findMany({
        where: { scopeKey: PLATFORM_SCOPE_KEY }
      })
    ])

    const entity = PlatformMfaPolicyEntity.defaults()
    for (const scenarioPolicy of scenarioPolicies) {
      entity.setScenarioRequired(scenarioPolicy.scenario as PlatformMfaScenario, Boolean(scenarioPolicy.required))
    }
    if (factorPolicies.length > 0) {
      entity.replaceFactors(
        factorPolicies.map((policy) => ({
          factor: policy.factor as PlatformMfaFactorPolicySnapshot['factor'],
          enabled: policy.enabled,
          priority: policy.priority,
          updatedAt: policy.updatedAt,
          updatedBy: policy.updatedBy
        }))
      )
    }

    return entity
  }

  async savePlatformPolicy(policy: PlatformMfaPolicyEntity): Promise<PlatformMfaPolicyEntity> {
    await this.prisma.$transaction(async (tx) => {
      for (const scenario of MANAGED_PLATFORM_MFA_SCENARIOS) {
        await tx.platformMfaScenarioPolicy.upsert({
          where: {
            scopeKey_scenario: {
              scopeKey: PLATFORM_SCOPE_KEY,
              scenario
            }
          },
          update: {
            required: policy.isScenarioRequired(scenario)
          },
          create: {
            scopeKey: PLATFORM_SCOPE_KEY,
            scenario,
            required: policy.isScenarioRequired(scenario)
          }
        })
      }

      for (const factorPolicy of policy.getFactors()) {
        await tx.platformMfaFactorPolicy.upsert({
          where: {
            scopeKey_factor: {
              scopeKey: PLATFORM_SCOPE_KEY,
              factor: factorPolicy.factor as unknown as MfaType
            }
          },
          update: {
            enabled: factorPolicy.enabled,
            priority: factorPolicy.priority,
            updatedBy: factorPolicy.updatedBy ?? null
          },
          create: {
            scopeKey: PLATFORM_SCOPE_KEY,
            factor: factorPolicy.factor as unknown as MfaType,
            enabled: factorPolicy.enabled,
            priority: factorPolicy.priority,
            updatedBy: factorPolicy.updatedBy ?? null
          }
        })
      }
    })

    return this.getPlatformPolicy()
  }
}
