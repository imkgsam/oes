import { Org, OrgType } from '../../../prisma/generated/prisma/index'
import { OrgNodeEntity } from '../../domain/entities/org-node.entity'

export class PrismaOrgMapper {
  static toDomain(record: Org): OrgNodeEntity {
    return new OrgNodeEntity(
      record.id,
      record.tenantId,
      record.parentId ?? null,
      record.name,
      record.code ?? null,
      OrgType[record.type],
      record.order,
      []
    )
  }
}
