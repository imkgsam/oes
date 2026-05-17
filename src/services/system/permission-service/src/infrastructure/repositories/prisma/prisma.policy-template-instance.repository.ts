import { Injectable } from '@nestjs/common'
import { BuiltInPolicyTemplateRegistry, PolicyInstance } from '../../../application/authorization/resource-policy'
import {
  PolicyTemplateInstanceEvaluationQuery,
  PolicyTemplateInstanceRepository
} from '../../../domain/repositories/policy-template-instance.repository'
import { PolicyTemplateInstanceMapper } from '../../mappers/policy-template-instance.mapper'
import { Prisma } from '../../../../prisma/generated/prisma'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaPolicyTemplateInstanceRepository persists template-based policy instances separately from legacy AST policies. */
@Injectable()
export class PrismaPolicyTemplateInstanceRepository implements PolicyTemplateInstanceRepository {
  private readonly registry = new BuiltInPolicyTemplateRegistry()

  constructor(private readonly prisma: PrismaService) {}

  /** findById loads one policy template instance by stable id. */
  async findById(id: string): Promise<PolicyInstance | null> {
    const found = await this.prisma.policyInstance.findUnique({
      where: { id }
    })

    return found ? PolicyTemplateInstanceMapper.toDomain(found) : null
  }

  /** findEnabledForEvaluation fetches enabled instances that can apply to a permission/resource target. */
  async findEnabledForEvaluation(
    query: PolicyTemplateInstanceEvaluationQuery
  ): Promise<PolicyInstance[]> {
    const records = await this.prisma.policyInstance.findMany({
      where: {
        tenantId: query.tenantId,
        permissionCode: query.permissionCode,
        isEnabled: true,
        OR: [{ resourceType: null }, { resourceType: query.resourceType }]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    })

    return records.map((record) => PolicyTemplateInstanceMapper.toDomain(record))
  }

  /** save validates built-in template ownership before upserting a policy template instance. */
  async save(instance: PolicyInstance): Promise<PolicyInstance> {
    if (!this.registry.get(instance.templateCode)) {
      throw new Error('POLICY_TEMPLATE_NOT_FOUND')
    }

    const data = PolicyTemplateInstanceMapper.toPersistent(instance)
    const createData: Prisma.PolicyInstanceUncheckedCreateInput = {
      ...data,
      params: data.params as Prisma.InputJsonValue
    }
    const updateData: Prisma.PolicyInstanceUncheckedUpdateInput = {
      tenantId: data.tenantId,
      subjectSelectorType: data.subjectSelectorType,
      subjectSelectorValue: data.subjectSelectorValue,
      permissionCode: data.permissionCode,
      resourceType: data.resourceType,
      templateCode: data.templateCode,
      effect: data.effect,
      params: data.params as Prisma.InputJsonValue,
      priority: data.priority,
      isEnabled: data.isEnabled,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy
    }
    const saved = await this.prisma.policyInstance.upsert({
      where: { id: instance.id },
      update: updateData,
      create: createData
    })

    return PolicyTemplateInstanceMapper.toDomain(saved)
  }
}
