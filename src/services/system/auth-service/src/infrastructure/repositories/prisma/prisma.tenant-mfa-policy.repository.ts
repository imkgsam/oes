import { Injectable } from '@nestjs/common'
import { MfaType } from '../../../common/constants'
import {
  TenantMfaFactorPolicySnapshot,
  TenantMfaPolicyEntity
} from '../../../domain/entities/tenant-mfa-policy.entity'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
// Persists one tenant-scoped MFA policy surface for login-scene factor orchestration.
export class PrismaTenantMfaPolicyRepository implements TenantMfaPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantPolicy(tenantId: string): Promise<TenantMfaPolicyEntity> {
    const [scenarioPolicy, factorPolicies] = await Promise.all([
      this.prisma.tenantMfaScenarioPolicy.findUnique({
        where: {
          tenantId_scenario: {
            tenantId,
            scenario: 'LOGIN'
          }
        }
      }),
      this.prisma.tenantMfaFactorPolicy.findMany({
        where: { tenantId }
      })
    ])

    const entity = TenantMfaPolicyEntity.defaults(tenantId)
    if (scenarioPolicy) {
      entity.setLoginRequired(Boolean(scenarioPolicy.required))
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
      await tx.tenantMfaScenarioPolicy.upsert({
        where: {
          tenantId_scenario: {
            tenantId: policy.tenantId,
            scenario: 'LOGIN'
          }
        },
        update: {
          required: policy.isLoginRequired()
        },
        create: {
          tenantId: policy.tenantId,
          scenario: 'LOGIN',
          required: policy.isLoginRequired()
        }
      })

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
