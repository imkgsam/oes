import { Injectable } from '@nestjs/common'
import { OrgNodeEntity } from '../../../domain/entities/org-node.entity'
import { OrgRepository } from '../../../domain/repositories/org.repository'
import { PrismaOrgMapper } from '../../mappers/prisma-org.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaOrgRepository implements OrgRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(orgId: string): Promise<OrgNodeEntity | null> {
    const record = await this.prisma.org.findUnique({
      where: { id: orgId.trim() }
    })

    return record ? PrismaOrgMapper.toDomain(record) : null
  }

  async findTreeByTenantId(tenantId: string): Promise<OrgNodeEntity[]> {
    const records = await this.prisma.org.findMany({
      where: { tenantId: tenantId.trim() },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    })

    const nodes = records.map((record) => PrismaOrgMapper.toDomain(record))
    const nodeMap = new Map<string, OrgNodeEntity>(
      nodes.map((node) => [node.id, node])
    )
    const roots: OrgNodeEntity[] = []

    for (const node of nodes) {
      if (!node.parentId) {
        roots.push(node)
        continue
      }

      const parent = nodeMap.get(node.parentId)
      if (!parent) {
        roots.push(node)
        continue
      }

      parent.children.push(node)
    }

    return roots
  }
}
