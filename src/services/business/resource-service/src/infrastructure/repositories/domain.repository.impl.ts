import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  IDomainRepository,
  DomainQueryFilters,
  DomainPaginationResult
} from '../../domain/repositories/domain.repository'
import { Domain } from '../../domain/aggregates/domain.aggregate'
import { DomainRecord } from '../../domain/entities/domain-record.entity'

/**
 * 域名仓储实现类
 *
 * 职责：
 * 1. 实现域名聚合根的持久化操作
 * 2. 封装Prisma数据访问逻辑
 * 3. 提供复杂查询支持
 * 4. 维护数据一致性
 *
 * 设计原则：
 * - 面向聚合根设计
 * - 隐藏底层存储细节
 * - 提供业务友好的查询方法
 * - 支持事务操作
 */
@Injectable()
export class DomainRepositoryImpl implements IDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Domain | null> {
    const prismaDomain = await this.prisma.domain.findUnique({
      where: { id },
      include: { records: true }
    })

    if (!prismaDomain) {
      return null
    }

    return Domain.fromPrisma(prismaDomain)
  }

  async findByValue(domainValue: string): Promise<Domain | null> {
    const prismaDomain = await this.prisma.domain.findUnique({
      where: { value: domainValue },
      include: { records: true }
    })

    if (!prismaDomain) {
      return null
    }

    return Domain.fromPrisma(prismaDomain)
  }

  async findByTenantId(tenantId: string): Promise<Domain[]> {
    const prismaDomains = await this.prisma.domain.findMany({
      where: { tenantId },
      include: { records: true },
      orderBy: { createdAt: 'desc' }
    })

    return prismaDomains.map((domain) => Domain.fromPrisma(domain))
  }

  async findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: DomainQueryFilters
  ): Promise<DomainPaginationResult> {
    const skip = (page - 1) * pageSize
    const where = this.buildWhereClause(tenantId, filters)

    const [domains, totalCount] = await Promise.all([
      this.prisma.domain.findMany({
        where,
        include: { records: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      this.prisma.domain.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      domains: domains.map((domain) => Domain.fromPrisma(domain)),
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    }
  }

  async exists(domainValue: string): Promise<boolean> {
    const count = await this.prisma.domain.count({
      where: { value: domainValue }
    })
    return count > 0
  }

  async save(domain: Domain): Promise<Domain> {
    const domainEvents = domain.getDomainEvents()

    // 使用事务确保数据一致性
    const result = await this.prisma.$transaction(async (tx) => {
      // 保存域名基本信息
      const prismaDomain = await tx.domain.upsert({
        where: { id: domain.id },
        create: {
          id: domain.id,
          value: domain.value,
          tenantId: domain.tenantId,
          isVerified: domain.isVerified(),
          description: domain.description,
          createdAt: domain.createdAt,
          updatedAt: domain.updatedAt
        },
        update: {
          isVerified: domain.isVerified(),
          description: domain.description,
          updatedAt: domain.updatedAt
        },
        include: { records: true }
      })

      // 处理DNS记录
      const currentRecords = domain.getRecords()
      const existingRecords = prismaDomain.records

      // 删除不存在的记录
      const recordsToDelete = existingRecords.filter(
        (existing) => !currentRecords.some((current) => current.id === existing.id)
      )

      for (const record of recordsToDelete) {
        await tx.domainRecord.delete({ where: { id: record.id } })
      }

      // 更新或创建记录
      for (const record of currentRecords) {
        await tx.domainRecord.upsert({
          where: { id: record.id },
          create: {
            id: record.id,
            domainId: record.domainId,
            type: record.type,
            name: record.name,
            value: record.value,
            ttl: record.ttl,
            priority: record.priority,
            required: record.required,
            verified: record.isVerified(),
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          },
          update: {
            value: record.value,
            ttl: record.ttl,
            priority: record.priority,
            required: record.required,
            verified: record.isVerified(),
            updatedAt: record.updatedAt
          }
        })
      }

      return prismaDomain
    })

    return Domain.fromPrisma(result)
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 先删除所有DNS记录
        await tx.domainRecord.deleteMany({
          where: { domainId: id }
        })

        // 再删除域名
        await tx.domain.delete({
          where: { id }
        })
      })

      return true
    } catch (error) {
      console.error('Failed to delete domain:', error)
      return false
    }
  }

  async count(tenantId: string, filters?: DomainQueryFilters): Promise<number> {
    const where = this.buildWhereClause(tenantId, filters)
    return this.prisma.domain.count({ where })
  }

  /**
   * 构建查询条件
   */
  private buildWhereClause(tenantId: string, filters?: DomainQueryFilters) {
    const where: any = { tenantId }

    if (filters) {
      if (filters.verified !== undefined) {
        where.isVerified = filters.verified
      }

      if (filters.searchTerm) {
        where.OR = [
          { value: { contains: filters.searchTerm, mode: 'insensitive' } },
          { description: { contains: filters.searchTerm, mode: 'insensitive' } }
        ]
      }

      if (filters.createdAfter) {
        where.createdAt = { ...where.createdAt, gte: filters.createdAfter }
      }

      if (filters.createdBefore) {
        where.createdAt = { ...where.createdAt, lte: filters.createdBefore }
      }

      if (filters.hasRecords !== undefined) {
        if (filters.hasRecords) {
          where.records = { some: {} }
        } else {
          where.records = { none: {} }
        }
      }

      if (filters.recordType) {
        where.records = {
          some: { type: filters.recordType }
        }
      }
    }

    return where
  }
}
