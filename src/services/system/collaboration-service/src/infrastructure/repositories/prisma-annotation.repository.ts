import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { AnnotationEntity } from '../../domain/entities/annotation.entity'
import {
  AnnotationListFilter,
  AnnotationListResult,
  AnnotationRepository
} from '../../domain/repositories/annotation.repository'
import { AnnotationVisibility } from '../../domain/value-objects/annotation.enums'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaAnnotationRepository persists and queries Annotation P1 aggregates in collaboration-service storage. */
@Injectable()
export class PrismaAnnotationRepository implements AnnotationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(annotation: AnnotationEntity): Promise<AnnotationEntity> {
    const created = await this.prisma.collaborationAnnotation.create({
      data: toPersistence(annotation)
    })
    return toDomain(created)
  }

  async save(annotation: AnnotationEntity): Promise<AnnotationEntity> {
    const saved = await this.prisma.collaborationAnnotation.update({
      where: { id: annotation.id },
      data: toPersistence(annotation)
    })
    return toDomain(saved)
  }

  async findById(tenantId: string, annotationId: string): Promise<AnnotationEntity | null> {
    const annotation = await this.prisma.collaborationAnnotation.findFirst({
      where: { id: annotationId, tenantId }
    })
    return annotation ? toDomain(annotation) : null
  }

  async list(filter: AnnotationListFilter): Promise<AnnotationListResult> {
    const page = Math.max(filter.page, 1)
    const pageSize = Math.max(filter.pageSize, 1)
    const where = buildWhere(filter)
    const [items, total] = await Promise.all([
      this.prisma.collaborationAnnotation.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.collaborationAnnotation.count({ where })
    ])

    return {
      items: items.map(toDomain),
      page,
      pageSize,
      total
    }
  }
}

/** buildWhere maps Annotation object, visibility, and deletion filters to a Prisma where object. */
function buildWhere(filter: AnnotationListFilter): Prisma.CollaborationAnnotationWhereInput {
  return {
    tenantId: filter.tenantId,
    objectOwnerService: filter.objectOwnerService,
    objectType: filter.objectType,
    objectId: filter.objectId,
    deletedAt: null,
    OR: [
      { visibility: AnnotationVisibility.OBJECT_VISIBLE },
      ...(filter.includePrivateForAccountId
        ? [
            {
              visibility: AnnotationVisibility.PRIVATE,
              authorAccountId: filter.includePrivateForAccountId
            }
          ]
        : [])
    ]
  }
}

/** toPersistence maps an Annotation aggregate to Prisma write data without leaking Prisma into domain. */
function toPersistence(annotation: AnnotationEntity): Prisma.CollaborationAnnotationUncheckedCreateInput {
  const snapshot = annotation.snapshot()
  return {
    id: snapshot.id,
    tenantId: snapshot.tenantId,
    objectOwnerService: snapshot.objectOwnerService,
    objectType: snapshot.objectType,
    objectId: snapshot.objectId,
    objectDisplayTitle: snapshot.objectDisplayTitle,
    objectDisplaySubtitle: snapshot.objectDisplaySubtitle,
    objectDisplayStatus: snapshot.objectDisplayStatus,
    authorAccountId: snapshot.authorAccountId,
    authorDisplayNameSnapshot: snapshot.authorDisplayNameSnapshot,
    bodyText: snapshot.bodyText,
    visibility: snapshot.visibility,
    pinned: snapshot.pinned,
    edited: snapshot.edited,
    deletedAt: snapshot.deletedAt,
    deletedByAccountId: snapshot.deletedByAccountId,
    deleteReason: snapshot.deleteReason,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt
  }
}

/** toDomain maps one Prisma annotation row to the Annotation aggregate. */
function toDomain(
  annotation: Prisma.CollaborationAnnotationGetPayload<Record<string, never>>
): AnnotationEntity {
  return new AnnotationEntity({
    id: annotation.id,
    tenantId: annotation.tenantId,
    objectOwnerService: annotation.objectOwnerService,
    objectType: annotation.objectType,
    objectId: annotation.objectId,
    objectDisplayTitle: annotation.objectDisplayTitle,
    objectDisplaySubtitle: annotation.objectDisplaySubtitle,
    objectDisplayStatus: annotation.objectDisplayStatus,
    authorAccountId: annotation.authorAccountId,
    authorDisplayNameSnapshot: annotation.authorDisplayNameSnapshot,
    bodyText: annotation.bodyText,
    visibility: annotation.visibility as AnnotationVisibility,
    pinned: annotation.pinned,
    edited: annotation.edited,
    deletedAt: annotation.deletedAt,
    deletedByAccountId: annotation.deletedByAccountId,
    deleteReason: annotation.deleteReason,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt
  })
}
