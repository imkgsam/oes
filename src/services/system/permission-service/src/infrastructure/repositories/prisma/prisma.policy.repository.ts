import { Injectable } from '@nestjs/common'
import { Policy } from 'src/domain/aggregates/policy.aggregate'
import { PolicyRepository } from 'src/domain/repositories/policy.repository'
import { PolicyMapper } from 'src/infrastructure/mappers/policy.mapper'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

const POLICY_INCLUDE = { conditions: true } as const

@Injectable()
export class PrismaPolicyRepository implements PolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Policy | null> {
    const found = await this.prisma.policy.findUnique({
      where: { id },
      include: POLICY_INCLUDE
    })
    return found ? PolicyMapper.toDomain(found) : null
  }

  async findApplicable(permissionCode: string, tenantId?: string): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany({
      where: {
        isEnabled: true,
        OR: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
        AND: [
          {
            OR: [{ permissionCode: null }, { permissionCode }]
          }
        ]
      },
      include: POLICY_INCLUDE,
      orderBy: { priority: 'desc' }
    })
    return records.map(PolicyMapper.toDomain)
  }

  async findByTenant(tenantId: string): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany({
      where: { tenantId },
      include: POLICY_INCLUDE
    })
    return records.map(PolicyMapper.toDomain)
  }

  async findAll(): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany({ include: POLICY_INCLUDE })
    return records.map(PolicyMapper.toDomain)
  }

  async save(policy: Policy): Promise<Policy> {
    const data = PolicyMapper.toPersistent(policy)

    await this.prisma.$transaction(async (tx) => {
      // Upsert the policy
      await tx.policy.upsert({
        where: { id: policy.id },
        update: {
          name: data.name,
          description: data.description,
          tenantId: data.tenantId,
          effect: data.effect,
          subjectType: data.subjectType,
          subjectId: data.subjectId,
          permissionCode: data.permissionCode,
          resourceType: data.resourceType,
          priority: data.priority,
          isEnabled: data.isEnabled
        },
        create: {
          ...data,
          createdBy: policy.id // placeholder – actual createdBy set at command level
        }
      })

      // Replace conditions: delete all then recreate
      await tx.policyCondition.deleteMany({ where: { policyId: policy.id } })

      if (policy.conditions.length > 0) {
        await tx.policyCondition.createMany({
          data: policy.conditions.map((c) => ({
            id: c.id,
            policyId: policy.id,
            attributeSource: c.attributeSource,
            attributeKey: c.attributeKey,
            operator: c.operator,
            value: c.rawValue
          }))
        })
      }
    })

    return (await this.findById(policy.id))!
  }

  async delete(id: string): Promise<void> {
    // Conditions cascade-delete via onDelete: Cascade in schema
    await this.prisma.policy.delete({ where: { id } })
  }
}
