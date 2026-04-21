import { Injectable } from '@nestjs/common'
import { TenantSummaryEntity } from '../../../domain/entities/tenant-summary.entity'
import { TenantRepository } from '../../../domain/repositories/tenant.repository'
import { PrismaTenantMapper } from '../../mappers/prisma-tenant.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string): Promise<TenantSummaryEntity | null> {
    const record = await this.prisma.tenant.findUnique({
      where: { id: tenantId.trim() }
    })

    return record ? PrismaTenantMapper.toDomain(record) : null
  }

  async list(input?: {
    tenantId?: string
    keyword?: string
    pageSize?: number
    isActive?: boolean
  }): Promise<TenantSummaryEntity[]> {
    const tenantId = input?.tenantId?.trim()
    const keyword = input?.keyword?.trim()
    const pageSize = input?.pageSize ?? 20
    const isActive = input?.isActive

    const records = await this.prisma.tenant.findMany({
      where: {
        ...(tenantId ? { id: tenantId } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(keyword
          ? {
              OR: [
                {
                  name: {
                    contains: keyword,
                    mode: 'insensitive'
                  }
                },
                {
                  code: {
                    contains: keyword,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          : {})
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: pageSize
    })

    return records.map((record) => PrismaTenantMapper.toDomain(record))
  }
}
