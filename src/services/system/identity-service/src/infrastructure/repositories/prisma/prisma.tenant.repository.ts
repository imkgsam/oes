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
}
