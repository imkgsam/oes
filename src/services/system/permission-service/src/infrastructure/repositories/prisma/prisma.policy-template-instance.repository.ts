import { Injectable } from '@nestjs/common'
import {
  BuiltInPolicyTemplateRegistry,
  PolicyInstance,
  PolicyTemplateParamsValidator
} from '../../../application/authorization/resource-policy'
import {
  PolicyTemplateInstanceEvaluationQuery,
  PolicyTemplateInstanceManagementListQuery,
  PolicyTemplateInstanceManagementListResult,
  PolicyTemplateInstanceRepository
} from '../../../domain/repositories/policy-template-instance.repository'
import { PolicyTemplateInstanceMapper } from '../../mappers/policy-template-instance.mapper'
import { Prisma } from '../../../../prisma/generated/prisma'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaPolicyTemplateInstanceRepository persists template-based policy instances separately from legacy AST policies. */
@Injectable()
export class PrismaPolicyTemplateInstanceRepository implements PolicyTemplateInstanceRepository {
  private readonly registry = new BuiltInPolicyTemplateRegistry()
  private readonly paramsValidator = new PolicyTemplateParamsValidator()

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

  /** listForManagement fetches paged PolicyInstance rows for readonly governance screens. */
  async listForManagement(
    query: PolicyTemplateInstanceManagementListQuery
  ): Promise<PolicyTemplateInstanceManagementListResult> {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))
    const where = this.buildManagementWhere(query)
    const [total, records] = await Promise.all([
      this.prisma.policyInstance.count({ where }),
      this.prisma.policyInstance.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { priority: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: records.map((record) => PolicyTemplateInstanceMapper.toDomain(record)),
      total,
      page,
      pageSize
    }
  }

  /** save validates built-in template ownership before upserting a policy template instance. */
  async save(instance: PolicyInstance): Promise<PolicyInstance> {
    const template = this.registry.get(instance.templateCode)

    if (!template) {
      throw new Error('POLICY_TEMPLATE_NOT_FOUND')
    }
    this.paramsValidator.assertValid(template, instance)

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
      updatedBy: data.updatedBy,
      updatedAt: data.updatedAt
    }
    const saved = await this.prisma.policyInstance.upsert({
      where: { id: instance.id },
      update: updateData,
      create: createData
    })

    return PolicyTemplateInstanceMapper.toDomain(saved)
  }

  private buildManagementWhere(query: PolicyTemplateInstanceManagementListQuery) {
    return {
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.permissionCode ? { permissionCode: query.permissionCode } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.templateCode ? { templateCode: query.templateCode } : {}),
      ...(query.subjectSelectorType ? { subjectSelectorType: query.subjectSelectorType } : {}),
      ...(query.subjectSelectorValue ? { subjectSelectorValue: query.subjectSelectorValue } : {}),
      ...(query.enabled === undefined ? {} : { isEnabled: query.enabled })
    }
  }
}
