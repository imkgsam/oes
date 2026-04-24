import { Injectable } from '@nestjs/common'
import { Policy } from '../../../domain/aggregates/policy.aggregate'
import { PolicySubjectType } from '../../../domain/enums/policy-subject-type.enum'
import { PolicyRepository } from '../../../domain/repositories/policy.repository'
import { PolicyMapper } from '../../mappers/policy.mapper'
import { Prisma, PolicySubjectType as PrismaPolicySubjectType } from '../../../../prisma/generated/prisma'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaPolicyRepository implements PolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Policy | null> {
    const found = await this.prisma.policy.findUnique({
      where: { id }
    })
    return found ? PolicyMapper.toDomain(found) : null
  }

  async findApplicable(permissionCode: string, tenantId?: string): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany({
      where: {
        isEnabled: true,
        OR: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
        permissionCode
      },
      orderBy: { priority: 'desc' }
    })
    return records.map(PolicyMapper.toDomain)
  }

  async findByPermissionCode(permissionCode: string, tenantId?: string): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany({
      where: {
        permissionCode,
        ...(tenantId ? { OR: [{ tenantId: null }, { tenantId }] } : {})
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    })
    return records.map(PolicyMapper.toDomain)
  }

  async findByTenant(tenantId: string): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany({
      where: { tenantId }
    })
    return records.map(PolicyMapper.toDomain)
  }

  async findAll(): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany()
    return records.map(PolicyMapper.toDomain)
  }

  async findPaged(query: {
    page: number
    pageSize: number
    tenantId?: string
    permissionCode?: string
    isEnabled?: boolean
    keyword?: string
    subjectType?: PolicySubjectType
    subjectId?: string
  }): Promise<{ policies: Policy[]; total: number; page: number; pageSize: number }> {
    const page = query.page
    const pageSize = query.pageSize
    const skip = (page - 1) * pageSize
    const keyword = query.keyword?.trim()

    const where: Prisma.PolicyWhereInput = {
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.permissionCode ? { permissionCode: query.permissionCode } : {}),
      ...(typeof query.isEnabled === 'boolean' ? { isEnabled: query.isEnabled } : {}),
      ...(query.subjectType ? { subjectType: this.toPrismaSubjectType(query.subjectType) } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' as const } },
              { description: { contains: keyword, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.policy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      this.prisma.policy.count({ where })
    ])

    return {
      policies: records.map(PolicyMapper.toDomain),
      total,
      page,
      pageSize
    }
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
          isEnabled: data.isEnabled,
          conditionAstJson: data.conditionAstJson
        },
        create: {
          ...data
        }
      })
    })

    return (await this.findById(policy.id))!
  }

  async delete(id: string): Promise<void> {
    await this.prisma.policy.delete({ where: { id } })
  }

  // Maps the domain policy subject type onto the generated Prisma enum used by repository filters.
  private toPrismaSubjectType(subjectType: PolicySubjectType): PrismaPolicySubjectType {
    switch (subjectType) {
      case PolicySubjectType.ROLE:
        return PrismaPolicySubjectType.ROLE
      case PolicySubjectType.ACCOUNT:
        return PrismaPolicySubjectType.ACCOUNT
      case PolicySubjectType.ANY:
      default:
        return PrismaPolicySubjectType.ANY
    }
  }
}
