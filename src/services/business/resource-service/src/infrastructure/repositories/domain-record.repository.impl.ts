import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { IDomainRecordRepository } from '../../domain/repositories/domain.repository'
import { DomainRecord } from '../../domain/entities/domain-record.entity'

/**
 * DNS记录仓储实现类
 *
 * 职责：
 * 1. 实现DNS记录的持久化操作
 * 2. 封装Prisma数据访问逻辑
 * 3. 提供记录查询和批量操作
 * 4. 支持记录验证状态管理
 *
 * 注意：虽然违反DDD原则，但保留此接口是为了实用性
 * 主要用于查询和批量操作，修改操作仍应通过Domain聚合根进行
 */
@Injectable()
export class DomainRecordRepositoryImpl implements IDomainRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DomainRecord | null> {
    const prismaRecord = await this.prisma.domainRecord.findUnique({
      where: { id }
    })

    if (!prismaRecord) {
      return null
    }

    return DomainRecord.fromPrisma(prismaRecord)
  }

  async findByDomainId(domainId: string): Promise<DomainRecord[]> {
    const prismaRecords = await this.prisma.domainRecord.findMany({
      where: { domainId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }, { createdAt: 'asc' }]
    })

    return prismaRecords.map((record) => DomainRecord.fromPrisma(record))
  }

  async findByDomainIdAndType(domainId: string, recordType: string): Promise<DomainRecord[]> {
    const prismaRecords = await this.prisma.domainRecord.findMany({
      where: {
        domainId,
        type: recordType as any
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }]
    })

    return prismaRecords.map((record) => DomainRecord.fromPrisma(record))
  }

  async exists(domainId: string, recordName: string, recordType: string): Promise<boolean> {
    const count = await this.prisma.domainRecord.count({
      where: {
        domainId,
        name: recordName,
        type: recordType as any
      }
    })
    return count > 0
  }

  async save(record: DomainRecord): Promise<DomainRecord> {
    const prismaRecord = await this.prisma.domainRecord.upsert({
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

    return DomainRecord.fromPrisma(prismaRecord)
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.domainRecord.delete({
        where: { id }
      })
      return true
    } catch (error) {
      console.error('Failed to delete domain record:', error)
      return false
    }
  }

  async deleteByDomainId(domainId: string): Promise<number> {
    const result = await this.prisma.domainRecord.deleteMany({
      where: { domainId }
    })
    return result.count
  }

  async updateVerificationStatusBatch(ids: string[], verified: boolean): Promise<number> {
    const result = await this.prisma.domainRecord.updateMany({
      where: { id: { in: ids } },
      data: {
        verified,
        updatedAt: new Date()
      }
    })
    return result.count
  }

  async count(domainId: string, recordType?: string): Promise<number> {
    const where: any = { domainId }

    if (recordType) {
      where.type = recordType
    }

    return this.prisma.domainRecord.count({ where })
  }

  /**
   * 批量验证DNS记录
   * 根据域名ID和记录类型批量更新验证状态
   */
  async batchVerifyRecords(
    domainId: string,
    recordType: string,
    verified: boolean
  ): Promise<number> {
    const result = await this.prisma.domainRecord.updateMany({
      where: {
        domainId,
        type: recordType as any
      },
      data: {
        verified,
        updatedAt: new Date()
      }
    })
    return result.count
  }

  /**
   * 获取域名的记录统计信息
   */
  async getRecordStatistics(domainId: string): Promise<{
    totalRecords: number
    verifiedRecords: number
    unverifiedRecords: number
    recordsByType: Record<string, number>
  }> {
    const [totalRecords, verifiedRecords, recordsByType] = await Promise.all([
      this.prisma.domainRecord.count({ where: { domainId } }),
      this.prisma.domainRecord.count({ where: { domainId, verified: true } }),
      this.prisma.domainRecord.groupBy({
        by: ['type'],
        where: { domainId },
        _count: { type: true }
      })
    ])

    const recordsByTypeMap = recordsByType.reduce(
      (acc, item) => {
        acc[item.type] = item._count.type
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalRecords,
      verifiedRecords,
      unverifiedRecords: totalRecords - verifiedRecords,
      recordsByType: recordsByTypeMap
    }
  }

  /**
   * 查找重复的记录
   * 查找同一域名下名称和类型相同的记录
   */
  async findDuplicateRecords(domainId: string): Promise<DomainRecord[]> {
    const duplicates = await this.prisma.$queryRaw`
      SELECT dr1.*
      FROM "resource"."DomainRecord" dr1
      INNER JOIN "resource"."DomainRecord" dr2 
        ON dr1."domainId" = dr2."domainId" 
        AND dr1."name" = dr2."name" 
        AND dr1."type" = dr2."type"
        AND dr1."id" != dr2."id"
      WHERE dr1."domainId" = ${domainId}
      ORDER BY dr1."name", dr1."type"
    `

    return (duplicates as any[]).map((record) => DomainRecord.fromPrisma(record))
  }
}
