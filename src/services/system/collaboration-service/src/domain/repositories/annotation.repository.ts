import { AnnotationEntity } from '../entities/annotation.entity'

export type AnnotationListFilter = {
  tenantId: string
  objectOwnerService: string
  objectType: string
  objectId: string
  includePrivateForAccountId?: string
  page: number
  pageSize: number
}

export type AnnotationListResult = {
  items: AnnotationEntity[]
  page: number
  pageSize: number
  total: number
}

/** AnnotationRepository persists and queries Annotation P1 notes inside collaboration-service storage. */
export interface AnnotationRepository {
  create(annotation: AnnotationEntity): Promise<AnnotationEntity>
  save(annotation: AnnotationEntity): Promise<AnnotationEntity>
  findById(tenantId: string, annotationId: string): Promise<AnnotationEntity | null>
  list(filter: AnnotationListFilter): Promise<AnnotationListResult>
}

export const ANNOTATION_REPOSITORY = Symbol('ANNOTATION_REPOSITORY')
